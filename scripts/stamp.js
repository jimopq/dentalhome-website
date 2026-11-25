#!/usr/bin/env node
/* 用 CSS / JS 的內容雜湊產生一組版本號，寫進 src/asset-version.js。

   為什麼需要：GitHub Pages 與 Cloudflare 都會對 .css / .js 設快取
   （Pages 是 max-age=600）。改完推上去，瀏覽器可能還吃舊檔，
   會變成「明明改了卻看不到」。網址帶上 ?v=<雜湊> 就能強制重抓。

   render.js 是 Node 與 Worker 共用的，不能碰檔案系統，
   所以雜湊在建置期算好、寫成一個模組讓兩邊 import。

   用法：node scripts/stamp.js   （npm run build 會自動先跑）
*/
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "assets/css/style.css",
  ...fs.readdirSync(path.join(ROOT, "assets/js")).sort().map(f => "assets/js/" + f)
];

const h = crypto.createHash("sha256");
for (const f of files) h.update(fs.readFileSync(path.join(ROOT, f)));
const v = h.digest("hex").slice(0, 10);

const out = path.join(ROOT, "src/asset-version.js");
const body = `/* 由 scripts/stamp.js 產生，請勿手改。
   內容：${files.length} 個檔案的 sha256 前 10 碼。 */
export const ASSET_V = "${v}";
`;

// 沒變就不要動檔案，免得每次建置都產生假的 git 差異
if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== body) {
  fs.writeFileSync(out, body, "utf8");
  console.log(`✓ asset-version.js → ${v}（${files.length} 個檔案）`);
} else {
  console.log(`· asset-version.js 無變動（${v}）`);
}
