/* 後台單頁介面。刻意不依賴任何框架或 CDN，整頁內嵌，載入快且沒有外部相依。 */
export const adminHTML = `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>文心牙醫 網站後台</title>
<link rel="icon" href="/assets/img/favicon.ico" sizes="32x32">
<style>
  :root{
    --brand:#DD802E; --brand-deep:#B4621C; --brand-wash:#FEF9F4; --brand-tint:#FDF3E9;
    --ink:#18191B; --ink-2:#55585E; --ink-3:#878C94;
    --bg:#F5F6F7; --surface:#fff; --line:rgba(24,25,27,.12); --line-2:rgba(24,25,27,.22);
    --ok:#1b7f4b; --err:#c0392b;
    --font:"Noto Sans TC",-apple-system,BlinkMacSystemFont,"PingFang TC","Microsoft JhengHei",sans-serif;
    color-scheme: light;
  }
  *{box-sizing:border-box;margin:0}
  body{font-family:var(--font);background:var(--bg);color:var(--ink);line-height:1.7;-webkit-font-smoothing:antialiased}
  button,input,select,textarea{font:inherit;color:inherit}
  button{cursor:pointer;border:0;background:none}
  a{color:var(--brand-deep)}
  .hide{display:none!important}

  /* 登入 */
  .login{min-height:100dvh;display:grid;place-items:center;padding:24px}
  .login form{width:min(100%,380px);background:var(--surface);padding:32px;border-radius:16px;
    box-shadow:0 1px 3px rgba(0,0,0,.06),0 16px 40px rgba(0,0,0,.08)}
  .login h1{font-size:1.25rem;margin-bottom:4px}
  .login p{color:var(--ink-3);font-size:.875rem;margin-bottom:24px}

  label{display:block;font-size:.875rem;font-weight:600;margin-bottom:6px}
  .f{margin-bottom:16px}
  input[type=text],input[type=password],input[type=date],input[type=url],select,textarea{
    width:100%;padding:10px 12px;min-height:44px;background:var(--surface);
    border:1.5px solid var(--line-2);border-radius:8px;transition:border-color .14s}
  input:focus,select:focus,textarea:focus{outline:0;border-color:var(--brand);
    box-shadow:0 0 0 3px rgba(221,128,46,.16)}
  textarea{min-height:360px;resize:vertical;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    font-size:.875rem;line-height:1.7}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;min-height:44px;
    border-radius:8px;font-weight:600;background:var(--brand);color:#fff;transition:background .14s,transform .1s}
  .btn:hover{background:var(--brand-deep)} .btn:active{transform:scale(.97)}
  .btn[disabled]{opacity:.45;cursor:not-allowed}
  .btn--ghost{background:var(--surface);color:var(--ink);border:1.5px solid var(--line-2)}
  .btn--ghost:hover{background:var(--brand-wash);border-color:var(--brand)}
  .btn--danger{background:var(--err)} .btn--danger:hover{background:#9f2d20}
  .btn--sm{padding:6px 12px;min-height:36px;font-size:.875rem}

  /* 版面 */
  header{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:16px;
    padding:12px 20px;background:var(--surface);border-bottom:1px solid var(--line)}
  header b{font-size:1rem}
  nav{display:flex;gap:4px;flex-wrap:wrap;margin-left:auto}
  nav button{padding:8px 14px;border-radius:8px;font-weight:600;font-size:.9375rem;color:var(--ink-2)}
  nav button:hover{background:var(--brand-wash)}
  nav button[aria-current=page]{background:var(--brand);color:#fff}
  main{max-width:1100px;margin:0 auto;padding:24px 20px 80px}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:20px;margin-bottom:16px}
  h2{font-size:1.125rem;margin-bottom:4px}
  .muted{color:var(--ink-3);font-size:.875rem}
  .row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
  .grid2{display:grid;gap:16px}@media(min-width:720px){.grid2{grid-template-columns:1fr 1fr}}

  table{width:100%;border-collapse:collapse;font-size:.9375rem}
  th,td{padding:10px 8px;text-align:left;border-bottom:1px solid var(--line);vertical-align:middle}
  th{font-size:.8125rem;color:var(--ink-3);font-weight:600}
  tbody tr:hover{background:var(--brand-wash)}
  .tag{display:inline-block;padding:2px 8px;border-radius:999px;background:var(--brand-tint);
    color:var(--brand-deep);font-size:.75rem;font-weight:600}

  .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(120%);
    padding:12px 20px;border-radius:999px;background:var(--ink);color:#fff;font-weight:600;
    box-shadow:0 10px 30px rgba(0,0,0,.25);transition:transform .28s cubic-bezier(.22,.61,.36,1);z-index:50}
  .toast.on{transform:translateX(-50%) translateY(0)}
  .toast.err{background:var(--err)}
  .err-msg{color:var(--err);font-size:.875rem;margin-top:8px;min-height:1.2em}
  .thumb{width:120px;height:76px;object-fit:cover;border-radius:6px;border:1px solid var(--line);background:var(--bg)}
  .sp{flex:1}
</style>
</head>
<body>

<div class="login" id="login">
  <form onsubmit="return doLogin(event)">
    <h1>文心牙醫 網站後台</h1>
    <p>請輸入帳號密碼</p>
    <div class="f"><label for="u">帳號</label><input id="u" type="text" autocomplete="username" required></div>
    <div class="f"><label for="p">密碼</label><input id="p" type="password" autocomplete="current-password" required></div>
    <button class="btn" style="width:100%;justify-content:center" id="loginBtn">登入</button>
    <p class="err-msg" id="loginErr"></p>
  </form>
</div>

<div id="app" class="hide">
  <header>
    <b>文心牙醫 後台</b>
    <nav>
      <button data-tab="articles" aria-current="page">文章</button>
      <button data-tab="banners">Banner</button>
      <button data-tab="seo">SEO</button>
      <button data-tab="schedule">門診班表</button>
      <button data-tab="clinic">診所資訊</button>
      <button data-tab="doctors">醫師</button>
    </nav>
    <button class="btn btn--ghost btn--sm" onclick="doLogout()">登出</button>
  </header>
  <main>
    <div id="panel"></div>
  </main>
</div>

<div class="toast" id="toast"></div>

<script>
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
let TAB = "articles";

function toast(msg, bad) {
  const t = $("#toast"); t.textContent = msg; t.classList.toggle("err", !!bad);
  t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 2600);
}
async function api(url, opt = {}) {
  const r = await fetch(url, { headers: { "content-type": "application/json" }, ...opt });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.ok === false) throw new Error(d.error || ("HTTP " + r.status));
  return d;
}

/* ── 登入 ── */
async function doLogin(e) {
  e.preventDefault();
  const btn = $("#loginBtn"); btn.disabled = true; $("#loginErr").textContent = "";
  try {
    await api("/api/login", { method: "POST", body: JSON.stringify({ username: $("#u").value, password: $("#p").value }) });
    boot();
  } catch (err) { $("#loginErr").textContent = err.message; }
  finally { btn.disabled = false; }
  return false;
}
async function doLogout() { await fetch("/api/logout", { method: "POST" }); location.reload(); }

async function boot() {
  try { await api("/api/me"); } catch { $("#login").classList.remove("hide"); $("#app").classList.add("hide"); return; }
  $("#login").classList.add("hide"); $("#app").classList.remove("hide");
  render();
}
document.addEventListener("click", e => {
  const b = e.target.closest("nav [data-tab]"); if (!b) return;
  TAB = b.dataset.tab;
  document.querySelectorAll("nav [data-tab]").forEach(x => x.removeAttribute("aria-current"));
  b.setAttribute("aria-current", "page");
  render();
});

/* ── 發布（清邊緣快取） ── */
async function publish() {
  try { const d = await api("/api/publish", { method: "POST" }); toast("已更新，共 " + d.pages + " 頁"); }
  catch (e) { toast(e.message, true); }
}

function pubBar(extra = "") {
  return '<div class="card row"><span class="muted">改好之後按「更新網站」，前台才會立刻看到。</span><span class="sp"></span>' +
         extra + '<button class="btn" onclick="publish()">更新網站</button></div>';
}

/* ── 共用：JSON 設定編輯器 ── */
async function settingPanel(key, title, hint) {
  const d = await api("/api/settings/" + key);
  $("#panel").innerHTML = pubBar() +
    '<div class="card"><h2>' + esc(title) + '</h2><p class="muted">' + esc(hint) + '</p>' +
    '<textarea id="js">' + esc(JSON.stringify(d.value, null, 2)) + '</textarea>' +
    '<p class="err-msg" id="jsErr"></p>' +
    '<div class="row" style="margin-top:12px"><button class="btn" onclick="saveSetting(\\'' + key + '\\')">儲存</button>' +
    '<button class="btn btn--ghost" onclick="render()">取消</button></div></div>';
}
async function saveSetting(key) {
  let v;
  try { v = JSON.parse($("#js").value); } catch (e) { $("#jsErr").textContent = "格式有誤：" + e.message; return; }
  try { await api("/api/settings/" + key, { method: "PUT", body: JSON.stringify(v) }); toast("已儲存"); await publish(); }
  catch (e) { toast(e.message, true); }
}

/* ── 文章 ── */
let AQ = "", AKIND = "";
async function articlesPanel() {
  const d = await api("/api/articles?" + new URLSearchParams({ q: AQ, kind: AKIND }));
  $("#panel").innerHTML = pubBar('<button class="btn btn--ghost" onclick="editArticle(null)">新增文章</button>') +
    '<div class="card"><div class="row" style="margin-bottom:12px">' +
      '<input type="text" id="q" placeholder="搜尋標題" value="' + esc(AQ) + '" style="max-width:260px">' +
      '<select id="kind" style="max-width:160px">' +
        '<option value="">全部</option>' +
        '<option value="knowledge"' + (AKIND === "knowledge" ? " selected" : "") + '>牙齒知識</option>' +
        '<option value="news"' + (AKIND === "news" ? " selected" : "") + '>最新消息</option></select>' +
      '<button class="btn btn--ghost btn--sm" onclick="AQ=$(\\'#q\\').value;AKIND=$(\\'#kind\\').value;render()">搜尋</button>' +
      '<span class="sp"></span><span class="muted">' + d.items.length + ' 篇</span></div>' +
    '<table><thead><tr><th>標題</th><th>分類</th><th>日期</th><th></th></tr></thead><tbody>' +
    d.items.map(a => '<tr><td>' + esc(a.title) + (a.published ? "" : ' <span class="tag">未發布</span>') +
      '</td><td><span class="tag">' + esc(a.cat) + '</span></td><td class="muted">' + esc(a.date) + '</td>' +
      '<td style="text-align:right"><button class="btn btn--ghost btn--sm" onclick="editArticle(\\'' + esc(a.slug) + '\\')">編輯</button></td></tr>').join("") +
    '</tbody></table></div>';
}

const CATS = ["醫師專欄","矯正案例分享","矯正知識","牙齒衛教","訊息動態","門診公告"];
async function editArticle(slug) {
  const a = slug ? (await api("/api/articles/" + encodeURIComponent(slug))).item
                 : { slug:"", kind:"knowledge", cat:"醫師專欄", title:"", seo_title:"", description:"",
                     date:new Date().toISOString().slice(0,10), body:"", old_path:"", published:1 };
  $("#panel").innerHTML =
    '<div class="card"><div class="row"><h2>' + (slug ? "編輯文章" : "新增文章") + '</h2><span class="sp"></span>' +
      '<button class="btn btn--ghost btn--sm" onclick="render()">返回列表</button></div></div>' +
    '<div class="card">' +
      '<div class="f"><label>標題</label><input type="text" id="a_title" value="' + esc(a.title) + '"></div>' +
      '<div class="grid2">' +
        '<div class="f"><label>網址代稱（slug）</label><input type="text" id="a_slug" value="' + esc(a.slug) + '"' + (slug ? " readonly" : "") + '>' +
          '<p class="muted">英數與連字號，建立後不要再改，改了舊連結會失效</p></div>' +
        '<div class="f"><label>發布日期</label><input type="date" id="a_date" value="' + esc(a.date) + '"></div>' +
        '<div class="f"><label>放在哪一區</label><select id="a_kind">' +
          '<option value="knowledge"' + (a.kind === "knowledge" ? " selected" : "") + '>牙齒知識</option>' +
          '<option value="news"' + (a.kind === "news" ? " selected" : "") + '>最新消息</option></select></div>' +
        '<div class="f"><label>分類</label><select id="a_cat">' +
          CATS.map(c => '<option' + (a.cat === c ? " selected" : "") + '>' + c + '</option>').join("") + '</select></div>' +
      '</div>' +
      '<div class="f"><label>SEO 標題<span class="muted">（留空用文章標題）</span></label><input type="text" id="a_seo" value="' + esc(a.seo_title) + '"></div>' +
      '<div class="f"><label>搜尋結果摘要</label><input type="text" id="a_desc" value="' + esc(a.description) + '"></div>' +
      '<div class="f"><label>內文</label>' +
        '<div class="row" style="margin-bottom:8px"><input type="file" id="a_img" accept="image/*">' +
          '<button class="btn btn--ghost btn--sm" onclick="uploadImg()">上傳圖片並插入</button></div>' +
        '<textarea id="a_body">' + esc(a.body) + '</textarea>' +
        '<p class="muted">舊文章是 HTML，維持原樣即可。新文章可直接用 Markdown（## 標題、- 項目、**粗體**）</p></div>' +
      '<div class="row">' +
        '<button class="btn" onclick="saveArticle()">儲存</button>' +
        '<button class="btn btn--ghost" onclick="render()">取消</button><span class="sp"></span>' +
        (slug ? '<button class="btn btn--danger btn--sm" onclick="delArticle(\\'' + esc(slug) + '\\')">刪除</button>' : "") +
      '</div><p class="err-msg" id="aErr"></p></div>';
}

async function uploadImg() {
  const f = $("#a_img").files[0];
  if (!f) { toast("請先選擇檔案", true); return; }
  const fd = new FormData(); fd.append("file", f);
  try {
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);
    const ta = $("#a_body");
    ta.value += '\\n<p class="figure"><img src="' + d.url + '" alt="" loading="lazy"></p>\\n';
    toast("已插入圖片");
  } catch (e) { toast(e.message, true); }
}

async function saveArticle() {
  const slug = $("#a_slug").value.trim();
  if (!slug) { $("#aErr").textContent = "請填網址代稱"; return; }
  if (!/^[a-z0-9-]+$/.test(slug)) { $("#aErr").textContent = "網址代稱只能用小寫英數與連字號"; return; }
  if (!$("#a_title").value.trim()) { $("#aErr").textContent = "請填標題"; return; }
  try {
    await api("/api/articles/" + encodeURIComponent(slug), { method: "PUT", body: JSON.stringify({
      kind: $("#a_kind").value, cat: $("#a_cat").value, title: $("#a_title").value,
      seo_title: $("#a_seo").value, description: $("#a_desc").value,
      date: $("#a_date").value, body: $("#a_body").value, published: 1,
    })});
    toast("已儲存"); await publish(); render();
  } catch (e) { $("#aErr").textContent = e.message; }
}

async function delArticle(slug) {
  if (!confirm("確定要刪除這篇文章？刪除後網址會失效，無法復原。")) return;
  try { await api("/api/articles/" + encodeURIComponent(slug), { method: "DELETE" }); toast("已刪除"); await publish(); render(); }
  catch (e) { toast(e.message, true); }
}

/* ── 分頁切換 ── */
async function render() {
  $("#panel").innerHTML = '<div class="card muted">載入中…</div>';
  try {
    if (TAB === "articles") return articlesPanel();
    if (TAB === "banners")  return settingPanel("banners", "Banner 圖片", "首頁輪播（slides）與各分頁橫幅（pages）。圖片請先用上面的上傳功能取得網址。");
    if (TAB === "seo")      return settingPanel("seo", "頁面 SEO", "各頁的搜尋標題、描述與分享預覽圖。留空則沿用系統預設值。");
    if (TAB === "schedule") return settingPanel("schedule", "門診班表", "這份同時決定首頁輪播、看診中狀態，以及 Google 顯示的營業時間。");
    if (TAB === "clinic")   return settingPanel("clinic", "診所資訊", "電話、地址、社群網址與首頁數據。改這裡全站一起更新。");
    if (TAB === "doctors")  return doctorsPanel();
  } catch (e) { $("#panel").innerHTML = '<div class="card err-msg">' + esc(e.message) + '</div>'; }
}

async function doctorsPanel() {
  const d = await api("/api/doctors");
  $("#panel").innerHTML = pubBar() + d.items.map(x =>
    '<div class="card"><div class="row">' +
      '<img class="thumb" src="' + esc(x.photo || "") + '" alt="">' +
      '<div><b>' + esc(x.name) + '</b> <span class="tag">' + esc(x.badge || "") + '</span>' +
      '<p class="muted">' + esc(x.role || "") + '</p></div><span class="sp"></span>' +
      '<button class="btn btn--ghost btn--sm" onclick="editDoctor(\\'' + esc(x.slug) + '\\')">編輯</button>' +
    '</div></div>').join("");
}

async function editDoctor(slug) {
  const all = await api("/api/doctors");
  const x = all.items.find(i => i.slug === slug);
  $("#panel").innerHTML =
    '<div class="card"><div class="row"><h2>編輯醫師</h2><span class="sp"></span>' +
    '<button class="btn btn--ghost btn--sm" onclick="render()">返回</button></div></div>' +
    '<div class="card"><div class="grid2">' +
      '<div class="f"><label>姓名</label><input type="text" id="d_name" value="' + esc(x.name) + '"></div>' +
      '<div class="f"><label>職稱標籤</label><input type="text" id="d_badge" value="' + esc(x.badge || "") + '"></div>' +
      '<div class="f"><label>專科</label><input type="text" id="d_role" value="' + esc(x.role || "") + '"></div>' +
      '<div class="f"><label>排序</label><input type="text" id="d_order" value="' + esc(x.sort_order) + '"></div>' +
    '</div>' +
    '<div class="f"><label>照片網址</label><input type="text" id="d_photo" value="' + esc(x.photo || "") + '"></div>' +
    '<div class="f"><label>專長</label><input type="text" id="d_spec" value="' + esc(x.spec || "") + '"></div>' +
    '<div class="f"><label>介紹</label><textarea id="d_intro" style="min-height:140px">' + esc(x.intro || "") + '</textarea></div>' +
    '<div class="f"><label>學經歷（JSON）</label><textarea id="d_creds" style="min-height:200px">' + esc(JSON.stringify(x.creds, null, 2)) + '</textarea></div>' +
    '<div class="row"><button class="btn" onclick="saveDoctor(\\'' + esc(slug) + '\\')">儲存</button>' +
    '<button class="btn btn--ghost" onclick="render()">取消</button></div><p class="err-msg" id="dErr"></p></div>';
}

async function saveDoctor(slug) {
  let creds;
  try { creds = JSON.parse($("#d_creds").value); } catch (e) { $("#dErr").textContent = "學經歷格式有誤：" + e.message; return; }
  try {
    await api("/api/doctors/" + encodeURIComponent(slug), { method: "PUT", body: JSON.stringify({
      sort_order: Number($("#d_order").value) || 9, name: $("#d_name").value, badge: $("#d_badge").value,
      role: $("#d_role").value, photo: $("#d_photo").value, spec: $("#d_spec").value,
      intro: $("#d_intro").value, creds,
    })});
    toast("已儲存"); await publish(); render();
  } catch (e) { $("#dErr").textContent = e.message; }
}

boot();
</script>
</body>
</html>`;
