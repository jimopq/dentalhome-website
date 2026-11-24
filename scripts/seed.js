#!/usr/bin/env node
/* 把 content/ 底下的 JSON 灌進 D1。
   產生 SQL 檔而不是直接連線，這樣可以先檢查內容再套用，
   也方便之後重跑（每筆都是 upsert，重複執行不會壞）。

   用法：
     node scripts/seed.js                 # 產生 migrations 外的 seed.sql
     npx wrangler d1 execute venshin-dental --local  --file=scripts/seed.sql
     npx wrangler d1 execute venshin-dental --remote --file=scripts/seed.sql
*/
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = path.join(__dirname, "..");
const q = (v) =>
  v === null || v === undefined ? "NULL" : "'" + String(v).replace(/'/g, "''") + "'";

const lines = [];
const say = (s) => lines.push(s);

say("-- 由 scripts/seed.js 產生，請勿手改");
say("PRAGMA defer_foreign_keys = true;");
say("");

/* ── 設定 ─────────────────────────────────────────────────────────── */
say("-- 網站設定");
for (const key of ["clinic", "schedule", "banners", "seo"]) {
  const f = path.join(ROOT, "content/settings", key + ".json");
  if (!fs.existsSync(f)) { console.warn("略過（找不到）", f); continue; }
  const json = JSON.stringify(JSON.parse(fs.readFileSync(f, "utf8")));
  say(`INSERT INTO settings (key, value) VALUES (${q(key)}, ${q(json)})
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now');`);
}
say("");

/* ── 醫師 ─────────────────────────────────────────────────────────── */
say("-- 醫師團隊");
const docDir = path.join(ROOT, "content/doctors");
let docN = 0;
for (const f of fs.existsSync(docDir) ? fs.readdirSync(docDir).filter((x) => x.endsWith(".json")) : []) {
  const d = JSON.parse(fs.readFileSync(path.join(docDir, f), "utf8"));
  const slug = f.replace(/\.json$/, "");
  say(`INSERT INTO doctors (slug, sort_order, name, badge, role, photo, spec, intro, creds)
  VALUES (${q(slug)}, ${Number(d.order) || 9}, ${q(d.name)}, ${q(d.badge)}, ${q(d.role)},
          ${q(d.photo)}, ${q(d.spec)}, ${q(d.intro)}, ${q(JSON.stringify(d.creds || []))})
  ON CONFLICT(slug) DO UPDATE SET
    sort_order=excluded.sort_order, name=excluded.name, badge=excluded.badge,
    role=excluded.role, photo=excluded.photo, spec=excluded.spec,
    intro=excluded.intro, creds=excluded.creds, updated_at=datetime('now');`);
  docN++;
}
say("");

/* ── 文章 ─────────────────────────────────────────────────────────── */
say("-- 文章");
const artDir = path.join(ROOT, "content/articles");
let artN = 0;
for (const f of fs.existsSync(artDir) ? fs.readdirSync(artDir).filter((x) => x.endsWith(".json")) : []) {
  const a = JSON.parse(fs.readFileSync(path.join(artDir, f), "utf8"));
  const slug = f.replace(/\.json$/, "");
  say(`INSERT INTO articles (slug, kind, cat, title, seo_title, description, date, body, old_path)
  VALUES (${q(slug)}, ${q(a.kind || "knowledge")}, ${q(a.cat)}, ${q(a.title)},
          ${q(a.seoTitle || "")}, ${q(a.desc || "")}, ${q(a.date || "")},
          ${q(a.body)}, ${q(a.oldPath || "")})
  ON CONFLICT(slug) DO UPDATE SET
    kind=excluded.kind, cat=excluded.cat, title=excluded.title,
    seo_title=excluded.seo_title, description=excluded.description,
    date=excluded.date, body=excluded.body, old_path=excluded.old_path,
    updated_at=datetime('now');`);
  artN++;
}
say("");

/* ── 後台帳號 ──────────────────────────────────────────────────────── */
/* 密碼雜湊用 PBKDF2-SHA256 10 萬次，與 Worker 端 verifyPassword 的格式一致。
   密碼從環境變數帶入，不寫死在檔案裡：
     ADMIN_USER=venshin ADMIN_PASS='你的密碼' node scripts/seed.js            */
const user = process.env.ADMIN_USER || "venshin";
const pass = process.env.ADMIN_PASS;
if (pass) {
  const salt = crypto.randomBytes(16);
  const bits = crypto.pbkdf2Sync(pass, salt, 100000, 32, "sha256");
  const hash = `pbkdf2$100000$${salt.toString("base64")}$${bits.toString("base64")}`;
  say("-- 後台帳號");
  say(`INSERT INTO admin_users (username, password_hash, display_name)
  VALUES (${q(user)}, ${q(hash)}, ${q("文心牙醫")})
  ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash;`);
} else {
  say("-- 未設定 ADMIN_PASS，略過建立帳號");
  say("-- 要建帳號請執行： ADMIN_USER=venshin ADMIN_PASS='密碼' node scripts/seed.js");
}

const out = path.join(__dirname, "seed.sql");
fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`✓ 產生 ${path.relative(ROOT, out)}`);
console.log(`  設定 4 筆 / 醫師 ${docN} 筆 / 文章 ${artN} 筆 / 帳號 ${pass ? "1" : "0"} 筆`);
console.log(`  大小 ${(fs.statSync(out).size / 1024 / 1024).toFixed(2)} MB`);
