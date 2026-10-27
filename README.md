# 文心牙醫聯合診所 — 新官網

純靜態網站（HTML / CSS / 原生 JavaScript），無框架、無資料庫、無建置相依套件。
整個資料夾上傳到任何虛擬主機即可運作。

---

## ⚠️ 上線前必須確認的三件事

### 1. 門診時間 —— 目前是推測值，不是真的

舊官網、Google 搜尋、台南市衛生局的公開資料都查不到貴診所的門診時段。
我先填入台灣牙醫診所常見的排班（週一至週五三診、週六兩診、週日休診）作為**暫定值**，
但這是推測，**上線前一定要改成實際時間**。

這組時間同時驅動三個地方，必須一起更新：

| 位置 | 檔案 | 說明 |
|---|---|---|
| 「現在看診中／休診」狀態、預約可選時段 | `assets/js/main.js` 的 `CLINIC_HOURS` | 唯一的程式邏輯來源 |
| 門診時間表格 | `index.html`、`build.js` 內 `contact.html` 區塊 | 顯示用的表格 |
| Google 搜尋結果的營業時間 | `index.html` 的 `openingHoursSpecification` | 結構化資料，影響 Google 顯示 |

`main.js` 裡的格式是 `星期: [[開始, 結束], ...]`，用 24 小時制的小數（`14.5` = 14:30）：

```js
var HOURS = window.CLINIC_HOURS = {
  0: [],                                        // 週日休診
  1: [[9, 12], [14.5, 17.5], [18.5, 21]],       // 週一
  // ... 2–5 同上
  6: [[9, 12], [14.5, 17.5]]                    // 週六無晚診
};
```

改完 `build.js` 後執行 `node build.js` 重新產生頁面。

### 2. 預約表單要接到哪裡

目前沒有後端，所以送出後的流程是：**把預約內容整理成文字 → 自動複製到剪貼簿 → 引導患者貼到官方 LINE**。
這樣可以立刻上線使用，櫃檯在 LINE 收到完整格式的預約訊息。

如果要改成直接進信箱或表單服務，打開 `assets/js/booking.js`，填入第 13 行的 `ENDPOINT`：

```js
var ENDPOINT = "https://formspree.io/f/你的ID";   // 留空則維持 LINE 流程
```

送出的 JSON 欄位：`service`、`visit`、`date`、`dateISO`、`time`、`name`、`phone`、`email`、`note`。
Formspree、Getform、Google Apps Script 或貴診所自己的系統都可以接。

### 3. 照片

網站目前用設計過的圖形與漸層代替照片，不是空白佔位圖，所以沒照片也能直接上線。
要換成實景照片時，搜尋原始碼中的 `📷 PHOTO SLOT` 註解，目前標了兩處：

- `index.html` — 首頁主視覺（建議 4:5 直式，1200×1500）
- `about.html`（在 `build.js` 裡）— 診所環境照（建議 3 張橫式，1600×1000）

另外請準備一張 `assets/img/og-cover.jpg`（1200×630），這是分享到 LINE / Facebook 時顯示的預覽圖。
**目前這個檔案還不存在**，分享連結時不會有預覽圖。

---

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

- `assets/img/og-cover.jpg` 分享預覽圖尚未提供
- 舊站的最新消息 / 衛教文章尚未搬遷（新站未建立文章列表頁）
- 門診時間為推測值（見上方第 1 點）
