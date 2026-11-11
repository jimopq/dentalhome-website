# 文心牙醫聯合診所 — 新官網

純靜態網站（HTML / CSS / 原生 JavaScript），無框架、無資料庫、無建置相依套件。
整個資料夾上傳到任何虛擬主機即可運作。

---

## 網站後台 /admin

診所人員用瀏覽器就能新增文章、換 banner、改門診班表與診所資訊，不需要懂 git。

### 怎麼登入

1. 開 `https://你的網域/admin/`
2. 按 **Sign In with Token**
3. 貼上 GitHub personal access token

產 token：GitHub → Settings → Developer settings → Personal access tokens →
Fine-grained token，只授權 `jimopq/dentalhome-website` 這個 repo，權限給 **Contents: Read and write** 即可。
Token 存在瀏覽器本機，不會外流。

> 之後若要讓多位櫃檯人員各自用 GitHub 帳號登入、不必共用 token，
> 把 [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth)
> 部署到 Cloudflare Workers，再把網址填進 `admin/config.yml` 的 `base_url` 並取消註解即可。

### 可以改什麼

| 後台項目 | 實際檔案 | 影響範圍 |
|---|---|---|
| 文章 | `content/articles/*.json` | 牙齒知識與最新消息兩區、分頁、sitemap、301 對應 |
| 醫師團隊 | `content/doctors/*.json` | 首頁與醫師團隊頁 |
| 門診班表 | `content/settings/schedule.json` | 首頁輪播、「現在看診中」狀態、**Google 營業時間**（自動推導）|
| Banner 圖片 | `content/settings/banners.json` | 首頁主視覺與各分頁橫幅 |
| 診所資訊 | `content/settings/clinic.json` | 全站電話、地址、LINE、首頁數據、結構化資料 |

### 存檔之後會發生什麼

後台存檔 → 提交到 GitHub → GitHub Actions 跑 `node build.js` 重新產生 298 個頁面 →
自動提交 → GitHub Pages 更新。整個流程約 1–2 分鐘，不需要人工介入。

工作流程在 `.github/workflows/build.yml`，只在 `content/`、`build.js`、`assets/` 變動時觸發，
產生出來的 `.html` 不在觸發清單內，所以不會形成無限迴圈。
產出頁面少於 50 頁或 sitemap 為空時會中止提交，避免壞掉的版本覆蓋正常網站。

### 文章內文格式

舊站搬來的 259 篇內文是 HTML，編輯時維持原樣即可。
新文章可以直接用後台的編輯器寫（Markdown），產生器會自動轉成 HTML。
判斷方式：內文第一個字元是 `<` 就當 HTML 原樣輸出，否則當 Markdown 轉換。

## 配色與主題

全站**單一主題：橘白**，不提供深色模式。

- 強調色 `#DD802E`，從診所 logo 實際取樣，全站只有這一個強調色
- 底色為純白與中性灰，文字為中性近黑 `#18191B`
- `:root` 明示 `color-scheme: light`，表單元件與捲軸在深色系統下也維持亮色
- 已移除所有 `prefers-color-scheme: dark` 規則；使用者系統設為深色時，網站仍為白底

色彩全部定義為 `assets/css/style.css` 開頭 `:root` 的變數，要調整色系改那一處即可。

保留的使用者偏好（屬無障礙，與配色無關）：`prefers-reduced-motion`、`prefers-reduced-transparency`、`prefers-contrast`。

## 素材來源

網站的圖片、logo 與門診時間全部取自客戶舊官網 `dentalhome.com.tw`，經壓縮後放在 `assets/img/`（全部合計 1.8MB）。

| 檔案 | 來源與用途 |
|---|---|
| `logo.png` | 診所原始 logo（含正確英文名 Ven-Shin United Dental Clinic）|
| `favicon.ico` / `apple-touch-icon.png` | 診所原始網站圖示 |
| `hero-family.jpg` | 首頁主視覺 |
| `dr-lee/wang/chen.jpg` | 診所自製的三位醫師識別圖 |
| `smile.jpg`, `teen.jpg` | 隱適美／齒顎矯正卡片 |
| `brushing.jpg`, `kids.jpg`, `baby.jpg` | 關於頁與兒童牙科 |
| `schedule.jpg` | 原始門診表（已改寫為 HTML 表格，此檔留存備查）|
| `og-cover.jpg` | 分享到 LINE／Facebook 的預覽圖 |

部分舊圖有燒進去的標語文字。這些沒有去背重製，而是用 CSS `object-position`（`.photo-card__media--right` 等）把文字移出取景範圍，原始檔案保持不動。

### 門診時間（已採用診所實際資料）

轉錄自診所原始門診表：

- **早診** 09:00–12:00　**午診** 15:00–17:30　**晚診** 18:10–21:00
- 週六僅早診，**週日與國定例假日休診**
- 每一診的值班醫師已做成 HTML 表格（`build.js` 的 `ROSTER`），不再是一張看不懂也搜尋不到的圖片

時間若有異動，要同步更新三個地方：

| 位置 | 檔案 |
|---|---|
| 看診狀態判斷、預約可選時段 | `assets/js/main.js` 的 `CLINIC_HOURS` |
| 門診表格與值班醫師 | `build.js` 的 `ROSTER` |
| Google 搜尋顯示的營業時間 | `index.html` 的 `openingHoursSpecification` |

改完 `build.js` 後執行 `node build.js` 重新產生頁面。

## 文章搬遷（舊站全部內容）

舊站文章已全部搬遷，共 **259 篇**，版權屬診所所有、經客戶同意。

| 分頁 | 分類 | 篇數 |
|---|---|---|
| `articles.html` 牙齒知識 | 醫師專欄 202、矯正案例分享 23、矯正知識 10、牙齒衛教 8 | 243 |
| `news.html` 最新消息 | 訊息動態 13、門診公告 3 | 16 |

### 抓取方式的坑

舊站的分頁超過真實頁數後會回傳重複內容，不會回傳空白，所以「抓到空頁就停」的
判斷永遠不會觸發。必須改用**內容去重**判斷才能測出真實頁數：

| 清單 | 真實頁數 |
|---|---|
| `teeth/list`（牙齒知識總表）| 26 |
| `teeth/list-3`（醫師專欄）| 23 |
| `teeth/list-1`（矯正案例分享）| 3 |
| `news/list` | 3 |
| 其餘各分類 | 1–2 |

### ⚠️ 需要客戶確認授權的部分

醫師專欄中有部分早期文章，原本外連中華日報（`care.cdnnews.com.tw`）伺服器上的
圖片，推測是醫師在報紙專欄的轉載。那些圖片連結在舊站早已失效，搬遷時一併移除
（另有 3 張指向編輯者電腦本機路徑 `file:///E:/...`，同樣失效）。

**文字本身仍照客戶指示搬遷**，但若那些專欄是報紙刊載版本，建議客戶確認轉載授權。
受影響的 13 篇可用 `grep -l "care.cdnnews" ` 在舊站原始碼中查出。

### 301 轉址

`redirects.txt` 共 **268 條**對應。上正式主機時務必套用。

## 版面結構## 版面結構

- **首頁 banner**：滿版照片 + 白色漸層，文字壓在左側
- **每個分頁都有 banner**：照片式 banner 共 11 頁；404、隱私權、網站地圖與文章內頁使用品牌色 banner
- **門診時間**：僅首頁呈現，做成一天一張的輪播（桌機六欄並列、手機可滑動，自動開在今天）。
  聯絡頁不再重複，改以連結指向首頁
- **LINE 懸浮按鈕**：右下角常駐，桌機為帶文字藥丸、手機縮為圓形並浮在底部快捷列上方
- **關於文心**：上中下三張圖（刷牙親子、醫師團隊、診所孩童）

## ⚠️ 仍需確認的一件事

### 預約表單要接到哪裡

目前沒有後端，送出後的流程是：**把預約內容整理成文字 → 自動複製到剪貼簿 → 引導患者貼到官方 LINE**。這樣可以立刻上線，櫃檯在 LINE 會收到格式完整的預約訊息。

要改成直接進信箱或表單服務，打開 `assets/js/booking.js`，填入 `ENDPOINT`：

```js
var ENDPOINT = "https://formspree.io/f/你的ID";   // 留空則維持 LINE 流程
```

送出的 JSON 欄位：`service`、`visit`、`date`、`dateISO`、`time`、`name`、`phone`、`email`、`note`。

## 比舊官網改善了什麼

### 預約
| | 舊站 | 新站 |
|---|---|---|
| 線上預約 | 只有 LINE 連結 + 外部 Google 表單 | 站內三步驟表單，約 60 秒完成 |
| 時段選擇 | 無 | 未來 21 天日期軸 + 自動產生時段，休診日自動停用 |
| 當天預約 | 無 | 自動排除 2 小時內的時段，避免無效預約 |
| 中途離開 | 資料全失 | 自動存草稿，重新整理不會不見 |
| 手機操作 | 需進選單才找得到 | 底部常駐「打電話／LINE／線上預約」快捷列 |
| 表單驗證 | 無 | 即時驗證手機格式，錯誤就地顯示 |

### SEO
- 每頁獨立的 title、description、canonical、OG / Twitter 卡片
- 完整結構化資料：`Dentist`（含營業時間、可預約動作）、`Physician`（三位醫師）、`MedicalProcedure`、`FAQPage`、`BreadcrumbList`、`WebSite`
- **FAQPage 標記**讓常見問題有機會直接出現在 Google 搜尋結果中
- 三個主力療程各有獨立內頁（隱適美、齒顎矯正、植牙），針對「台南隱適美」「台南植牙」「台南矯正」等在地關鍵字撰寫
- `sitemap.xml` + `robots.txt` 已產生
- 語意化 HTML、每頁單一 `<h1>`、麵包屑導覽、完整 `alt` 與 `iframe title`
- 自架字型預連線、圖片延遲載入，減少載入時間

### 設計與使用體驗
- 暖色系視覺（取自診所 Logo 的赤陶色），襯線體標題帶出溫度，和一般診所網站的冷藍白拉開差異
- 中文排版針對 CJK 調校：行高 1.85、大標題負字距、小字正字距
- 自動深色模式
- 完整支援 `prefers-reduced-motion`（前庭敏感）、`prefers-reduced-transparency`、`prefers-contrast`
- 所有動態以彈簧物理實作，可隨時中斷與反向；手機選單可用手指拖曳關閉，含邊界阻尼與速度投射
- 鍵盤可完整操作，焦點框清晰，有跳至主內容連結

---

## 檔案結構

```
文心牙醫官網/
├── index.html              首頁（手工維護）
├── about.html              關於文心
├── team.html               醫師團隊
├── services.html           診療項目總覽
├── service-invisalign.html 隱適美隱形矯正
├── service-orthodontics.html 齒顎矯正
├── service-implant.html    數位人工植牙
├── booking.html            線上預約
├── faq.html                常見問題
├── contact.html            門診時間與交通
├── privacy.html            隱私權政策
├── sitemap.html            網站地圖
├── 404.html                找不到頁面
├── sitemap.xml / robots.txt
├── build.js                頁面產生器
└── assets/
    ├── css/style.css       全站樣式與設計變數
    ├── js/main.js          動態、選單、門診狀態
    ├── js/booking.js       預約流程
    └── img/favicon.svg
```

### 怎麼改內容

除了 `index.html` 之外的頁面都由 `build.js` 產生，**直接改 .html 會在下次重建時被覆蓋**。
改 `build.js` 裡對應的頁面區塊，然後執行：

```bash
node build.js
```

頁首、頁尾、手機選單、底部快捷列只定義在 `build.js` 的 `header()` 與 `footer()` 裡一份，
改一次全站生效（`index.html` 需另外手動同步）。

### 本機預覽

```bash
cd /Users/jimsu/文心牙醫官網 && python3 -m http.server 8911
```

然後打開 http://localhost:8911

---

## 上線後建議做的事

1. **Google Search Console** 提交 `sitemap.xml`，並確認舊網址的 301 轉址（舊站的 `/zh-tw/service/1-service1` 等網址應導向新的對應頁面，否則既有排名會流失）
2. **Google Business Profile** 的營業時間、地址、電話與網站欄位要和網站一致，這是在地 SEO 最大的單一因素
3. 把 `SITE` 常數（`build.js` 第 12 行）確認為正式網域
4. 加上 Google Analytics 或其他分析工具（目前未安裝任何追蹤碼）
5. 既有的部落格文章（矯正知識、醫師專欄）值得搬過來，持續產出在地關鍵字內容

---

## 已驗證項目

- 13 個頁面無死連結、JSON-LD 皆可正確解析、每頁單一 h1、meta 完整
- 預約流程完整走過：空值擋下 → 選療程 → 選時段（休診日自動停用、當天僅顯示 2 小時後時段）→ 手機格式驗證 → 未勾同意擋下 → 送出 → 產生 LINE 訊息並清除草稿
- 手機選單開關、捲動鎖定、底部快捷列、門診狀態判斷、頁首材質切換皆正常
- 375px 寬度無水平溢出

## 尚未處理

- 舊網址的 301 轉址需在正式主機上設定（對應表見 `redirects.txt`）
- 35 篇純圖片公告／證書未搬遷
- 診所實景與醫師本人照片仍缺
