#!/usr/bin/env node
/* ==========================================================================
   文心牙醫官網｜靜態產生器（Node 端）
   讀 content/ 的 JSON，交給 src/render.js 產生頁面，再寫成檔案。
   頁面模板本身在 src/render.js，與 Cloudflare Worker 共用同一份。

   用法： node build.js
   ========================================================================== */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSite } from "./src/render.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const readJSON = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const readDir = d => fs.existsSync(path.join(ROOT, d))
  ? fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith(".json"))
      .map(f => Object.assign(readJSON(path.join(d, f)), { slug: f.replace(/\.json$/, "") }))
  : [];

const data = {
  clinic:   readJSON("content/settings/clinic.json"),
  schedule: readJSON("content/settings/schedule.json"),
  banners:  readJSON("content/settings/banners.json"),
  seo:      readJSON("content/settings/seo.json"),
  doctors:  readDir("content/doctors"),
  articles: readDir("content/articles"),
};

const site = createSite(data);
const { pages, layout, ARTICLES, artUrl } = site;
const SITE = "https://www.dentalhome.com.tw";

const out = ROOT;
pages.forEach(p => {
  fs.writeFileSync(path.join(out, p.slug), layout(p), "utf8");
  console.log("✓ " + p.slug);
});

/* sitemap / robots / 轉址表：規則在 src/render.js，與 Worker 共用 */
fs.writeFileSync(path.join(out, "sitemap.xml"), site.sitemapXML(), "utf8");
console.log("✓ sitemap.xml");
fs.writeFileSync(path.join(out, "robots.txt"), site.robotsTxt(), "utf8");
console.log("✓ robots.txt");
fs.writeFileSync(path.join(out, "redirects.txt"), site.redirectsTxt(), "utf8");
console.log("✓ redirects.txt (" + ARTICLES.length + " 篇文章轉址)");

console.log("\n完成：共 " + pages.length + " 個頁面。");
