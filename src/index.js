/* ==========================================================================
   文心牙醫官網｜Cloudflare Worker
   頁面由 D1 的內容即時組出來（src/render.js，與 Node 端共用同一份樣板），
   後台走帳號密碼登入。靜態資源（CSS / JS / 圖）走 Assets binding。
   ========================================================================== */
import { createSite } from "./render.js";
import { adminHTML } from "./admin-ui.js";

const SESSION_DAYS = 14;
const COOKIE = "vs_session";

/* ── 密碼與 session ─────────────────────────────────────────────────── */
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function hashPassword(password, saltBytes) {
  const salt = saltBytes ?? crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return `pbkdf2$100000$${b64(salt)}$${b64(bits)}`;
}

async function verifyPassword(password, stored) {
  const [scheme, iters, salt, expected] = String(stored).split("$");
  if (scheme !== "pbkdf2") return false;
  const [, , , got] = (await hashPassword(password, unb64(salt))).split("$");
  if (iters !== "100000" || got.length !== expected.length) return false;
  let diff = 0;                              // 等長比較，避免時間差攻擊
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

async function makeToken(secret, userId) {
  const payload = `${userId}.${Date.now() + SESSION_DAYS * 86400000}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

async function readToken(secret, token) {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const payload = token.slice(0, i);
  if ((await hmac(secret, payload)) !== token.slice(i + 1)) return null;
  const [id, exp] = payload.split(".");
  if (!id || Number(exp) < Date.now()) return null;
  return Number(id);
}

const cookieOf = (req, name) =>
  (req.headers.get("cookie") || "").split(";").map((c) => c.trim())
    .find((c) => c.startsWith(name + "="))?.slice(name.length + 1) || null;

async function requireAuth(req, env) {
  return readToken(env.SESSION_SECRET, cookieOf(req, COOKIE));
}

/* ── 回應輔助 ───────────────────────────────────────────────────────── */
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });
const fail = (msg, status = 400) => json({ ok: false, error: msg }, status);
const ok = (data = {}) => json({ ok: true, ...data });

/* ── 從 D1 取出整站資料 ─────────────────────────────────────────────── */
async function loadData(env) {
  const [settings, doctors, articles] = await Promise.all([
    env.DB.prepare("SELECT key, value FROM settings").all(),
    env.DB.prepare("SELECT * FROM doctors ORDER BY sort_order").all(),
    env.DB.prepare(
      "SELECT slug, kind, cat, title, seo_title, description, date, body, old_path " +
      "FROM articles WHERE published = 1 ORDER BY date DESC, slug").all(),
  ]);
  const s = Object.fromEntries(settings.results.map((r) => [r.key, JSON.parse(r.value)]));
  return {
    clinic: s.clinic, schedule: s.schedule, banners: s.banners, seo: s.seo || { pages: [] },
    doctors: doctors.results.map((d) => ({
      slug: d.slug, order: d.sort_order, name: d.name, badge: d.badge, role: d.role,
      photo: d.photo, spec: d.spec, intro: d.intro, creds: JSON.parse(d.creds || "[]"),
    })),
    articles: articles.results.map((a) => ({
      slug: a.slug, kind: a.kind, cat: a.cat, title: a.title,
      seoTitle: a.seo_title, desc: a.description, date: a.date,
      body: a.body, oldPath: a.old_path,
    })),
  };
}

/* 同一次請求內重複用同一份 site，避免一個請求渲染兩次 */
async function getSite(env) {
  return createSite(await loadData(env));
}

/* ── 主要入口 ───────────────────────────────────────────────────────── */
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const p = url.pathname;

    try {
      if (p.startsWith("/api/")) return await api(req, env, url);
      if (p === "/admin" || p === "/admin/") return await adminPage(req, env);
      if (p.startsWith("/media/")) return await serveMedia(req, env, p);
      return await page(req, env, ctx, url);
    } catch (e) {
      console.error(e);
      return new Response("Server error", { status: 500 });
    }
  },

  /* 每日把 D1 匯出成 JSON 推回 GitHub 當備份 */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(backupToGitHub(env));
  },
};

/* ── 頁面 ───────────────────────────────────────────────────────────── */
async function page(req, env, ctx, url) {
  let slug = url.pathname.replace(/^\//, "");
  if (slug === "") slug = "index.html";

  // 靜態資源（css/js/img/favicon…）直接交給 Assets
  if (/\.(css|js|jpg|jpeg|png|svg|ico|webp|woff2?|txt|xml)$/i.test(slug) &&
      slug !== "sitemap.xml" && slug !== "robots.txt") {
    return env.ASSETS.fetch(req);
  }

  const cache = caches.default;
  const hit = await cache.match(req);
  if (hit) return hit;

  const site = await getSite(env);

  if (slug === "sitemap.xml" || slug === "robots.txt") {
    const body = slug === "sitemap.xml" ? site.sitemapXML() : site.robotsTxt();
    const res = new Response(body, {
      headers: {
        "content-type": slug.endsWith(".xml") ? "application/xml; charset=utf-8" : "text/plain; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
    ctx.waitUntil(cache.put(req, res.clone()));
    return res;
  }

  const found = site.pages.find((x) => x.slug === slug);
  if (!found) {
    const nf = site.pages.find((x) => x.slug === "404.html");
    return new Response(nf ? site.layout(nf) : "Not found", {
      status: 404, headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const res = new Response(site.layout(found), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // 邊緣快取 5 分鐘；後台存檔會主動清掉
      "cache-control": "public, max-age=0, s-maxage=300",
    },
  });
  ctx.waitUntil(cache.put(req, res.clone()));
  return res;
}

async function serveMedia(req, env, p) {
  const key = decodeURIComponent(p.replace(/^\/media\//, ""));
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set("etag", obj.httpEtag);
  h.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers: h });
}

async function adminPage(req, env) {
  return new Response(adminHTML, {
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, nofollow" },
  });
}

/* ── API ────────────────────────────────────────────────────────────── */
async function api(req, env, url) {
  const p = url.pathname;
  const method = req.method;

  /* 登入：擋暴力破解（同帳號 15 分鐘內失敗 8 次就鎖） */
  if (p === "/api/login" && method === "POST") {
    const { username, password } = await req.json().catch(() => ({}));
    if (!username || !password) return fail("請輸入帳號與密碼");

    const recent = await env.DB.prepare(
      "SELECT COUNT(*) n FROM login_attempts WHERE username = ? AND ok = 0 " +
      "AND created_at > datetime('now','-15 minutes')").bind(username).first();
    if ((recent?.n || 0) >= 8) return fail("嘗試次數過多，請 15 分鐘後再試", 429);

    const ip = req.headers.get("cf-connecting-ip") || "";
    const user = await env.DB.prepare(
      "SELECT id, username, password_hash FROM admin_users WHERE username = ?").bind(username).first();
    const good = user && (await verifyPassword(password, user.password_hash));

    await env.DB.prepare("INSERT INTO login_attempts (username, ip, ok) VALUES (?,?,?)")
      .bind(username, ip, good ? 1 : 0).run();
    if (!good) return fail("帳號或密碼不正確", 401);

    await env.DB.prepare("UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?")
      .bind(user.id).run();
    const token = await makeToken(env.SESSION_SECRET, user.id);
    return new Response(JSON.stringify({ ok: true, user: user.username }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "set-cookie": `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`,
      },
    });
  }

  if (p === "/api/logout" && method === "POST") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json", "set-cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; Max-Age=0` },
    });
  }

  /* 以下都要登入 */
  const uid = await requireAuth(req, env);
  if (!uid) return fail("請先登入", 401);

  if (p === "/api/me") {
    const u = await env.DB.prepare("SELECT username, display_name FROM admin_users WHERE id = ?").bind(uid).first();
    return ok({ user: u });
  }

  /* 文章 */
  if (p === "/api/articles" && method === "GET") {
    const kind = url.searchParams.get("kind");
    const q = url.searchParams.get("q");
    let sql = "SELECT slug, kind, cat, title, date, published FROM articles";
    const w = [], b = [];
    if (kind) { w.push("kind = ?"); b.push(kind); }
    if (q) { w.push("(title LIKE ? OR slug LIKE ?)"); b.push(`%${q}%`, `%${q}%`); }
    if (w.length) sql += " WHERE " + w.join(" AND ");
    sql += " ORDER BY date DESC, slug LIMIT 500";
    const r = await env.DB.prepare(sql).bind(...b).all();
    return ok({ items: r.results });
  }

  let m;
  if ((m = p.match(/^\/api\/articles\/(.+)$/))) {
    const slug = decodeURIComponent(m[1]);
    if (method === "GET") {
      const a = await env.DB.prepare("SELECT * FROM articles WHERE slug = ?").bind(slug).first();
      return a ? ok({ item: a }) : fail("找不到這篇文章", 404);
    }
    if (method === "PUT") {
      const d = await req.json();
      await env.DB.prepare(
        `INSERT INTO articles (slug, kind, cat, title, seo_title, description, date, body, old_path, published)
         VALUES (?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(slug) DO UPDATE SET kind=excluded.kind, cat=excluded.cat, title=excluded.title,
           seo_title=excluded.seo_title, description=excluded.description, date=excluded.date,
           body=excluded.body, old_path=excluded.old_path, published=excluded.published,
           updated_at=datetime('now')`
      ).bind(slug, d.kind || "knowledge", d.cat || "", d.title || "", d.seo_title || "",
             d.description || "", d.date || "", d.body || "", d.old_path || "",
             d.published === 0 ? 0 : 1).run();
      await audit(env, uid, "update", "article", slug, d.title);
      return ok();
    }
    if (method === "DELETE") {
      await env.DB.prepare("DELETE FROM articles WHERE slug = ?").bind(slug).run();
      // 刪除後這一頁不會再出現在 pages 清單裡，publish 掃不到，
      // 必須在這裡主動把它的快取清掉，否則舊頁面會被續發到 TTL 到期。
      const origin = new URL(req.url).origin;
      await caches.default.delete(new Request(`${origin}/article-${slug}.html`));
      await audit(env, uid, "delete", "article", slug, "");
      return ok();
    }
  }

  /* 設定（clinic / schedule / banners / seo） */
  if ((m = p.match(/^\/api\/settings\/(\w+)$/))) {
    const key = m[1];
    if (method === "GET") {
      const r = await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
      return r ? ok({ value: JSON.parse(r.value) }) : fail("找不到這組設定", 404);
    }
    if (method === "PUT") {
      const body = await req.json();
      await env.DB.prepare(
        "INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')"
      ).bind(key, JSON.stringify(body)).run();
      await audit(env, uid, "update", "setting", key, "");
      return ok();
    }
  }

  /* 醫師 */
  if (p === "/api/doctors" && method === "GET") {
    const r = await env.DB.prepare("SELECT * FROM doctors ORDER BY sort_order").all();
    return ok({ items: r.results.map((d) => ({ ...d, creds: JSON.parse(d.creds || "[]") })) });
  }
  if ((m = p.match(/^\/api\/doctors\/(.+)$/)) && method === "PUT") {
    const slug = decodeURIComponent(m[1]); const d = await req.json();
    await env.DB.prepare(
      `INSERT INTO doctors (slug, sort_order, name, badge, role, photo, spec, intro, creds)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT(slug) DO UPDATE SET sort_order=excluded.sort_order, name=excluded.name,
         badge=excluded.badge, role=excluded.role, photo=excluded.photo, spec=excluded.spec,
         intro=excluded.intro, creds=excluded.creds, updated_at=datetime('now')`
    ).bind(slug, d.sort_order || 9, d.name || "", d.badge || "", d.role || "",
           d.photo || "", d.spec || "", d.intro || "", JSON.stringify(d.creds || [])).run();
    await audit(env, uid, "update", "doctor", slug, d.name);
    return ok();
  }

  /* 圖片上傳 */
  if (p === "/api/upload" && method === "POST") {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return fail("沒有收到檔案");
    if (file.size > 8 * 1024 * 1024) return fail("檔案請小於 8MB");
    const type = file.type || "";
    if (!/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(type)) return fail("只接受圖片檔");

    const ext = (file.name.match(/\.[a-z0-9]+$/i) || [".jpg"])[0].toLowerCase();
    const key = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID().slice(0, 8)}${ext}`;
    await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: type } });
    await env.DB.prepare(
      "INSERT INTO media (key, filename, content_type, size) VALUES (?,?,?,?)"
    ).bind(key, file.name, type, file.size).run();
    await audit(env, uid, "create", "media", key, file.name);
    return ok({ url: `/media/${key}` });
  }

  /* 存檔後清快取，讓改動立刻看得到 */
  if (p === "/api/publish" && method === "POST") {
    const site = await getSite(env);
    const base = new URL(req.url).origin;
    const cache = caches.default;
    await Promise.all(site.pages.map((pg) =>
      cache.delete(new Request(`${base}/${pg.slug === "index.html" ? "" : pg.slug}`))));
    await audit(env, uid, "update", "site", "publish", `${site.pages.length} 頁`);
    return ok({ pages: site.pages.length });
  }

  return fail("找不到這個端點", 404);
}

async function audit(env, uid, action, entity, id, summary) {
  await env.DB.prepare(
    "INSERT INTO audit_log (user_id, action, entity, entity_id, summary) VALUES (?,?,?,?,?)"
  ).bind(uid, action, entity, id, String(summary || "").slice(0, 200)).run();
}

/* ── 每日備份：D1 → JSON → GitHub ───────────────────────────────────── */
async function backupToGitHub(env) {
  if (!env.GITHUB_TOKEN) { console.log("未設定 GITHUB_TOKEN，略過備份"); return; }
  const data = await loadData(env);
  const stamp = new Date().toISOString().slice(0, 10);
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 1);

  const repo = env.BACKUP_REPO || "jimopq/dentalhome-website";
  const pathInRepo = `backups/${stamp}.json`;
  const api = `https://api.github.com/repos/${repo}/contents/${pathInRepo}`;
  const headers = {
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    accept: "application/vnd.github+json",
    "user-agent": "venshin-dental-backup",
    "content-type": "application/json",
  };
  // 已存在就帶 sha 覆蓋
  let sha;
  const exist = await fetch(api, { headers });
  if (exist.ok) sha = (await exist.json()).sha;

  const res = await fetch(api, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `備份 ${stamp}：文章 ${data.articles.length} 篇`,
      content: btoa(String.fromCharCode(...new TextEncoder().encode(payload))),
      ...(sha ? { sha } : {}),
    }),
  });
  console.log("備份", res.ok ? "成功" : "失敗 " + (await res.text()).slice(0, 200));
}
