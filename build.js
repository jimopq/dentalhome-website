#!/usr/bin/env node
/* ==========================================================================
   文心牙醫官網 — 靜態頁面產生器
   Header / footer / dock 只在這裡定義一次，避免各頁面版本不同步。

   用法：  node build.js
   產出：  專案根目錄的 .html 檔（index.html 為手工維護，不由此產生）
   ========================================================================== */
const fs = require("fs");
const path = require("path");

const SITE = "https://www.dentalhome.com.tw";
const TEL = "+88662156600";
const TEL_TEXT = "06-2156600";
const LINE = "https://page.line.me/884xwoxp?openQrModal=true";
const FB = "https://www.facebook.com/profile.php?id=100075711318797";
const ADDR_Q = encodeURIComponent("台南市南區大同路二段166號");

/* ---------------------------------------------------------------- icons */
const ico = {
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  line: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.9 3 3 6.5 3 10.7c0 3.8 3.1 7 7.3 7.6.3.1.7.2.8.5.1.3 0 .7 0 1l-.1.8c0 .3-.2 1 .9.6s5.8-3.4 7.9-5.8c1.4-1.5 2.2-3.1 2.2-4.7C21 6.5 17.1 3 12 3Z"/></svg>`,
  fb: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1Z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  caret: `<svg class="nav__caret" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M1 1.5 6 6.5 11 1.5"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  car: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17h14M6.5 17v2M17.5 17v2"/><path d="M4 13l1.5-5A2 2 0 0 1 7.4 6.5h9.2A2 2 0 0 1 18.5 8L20 13v4H4v-4Z"/><circle cx="7.5" cy="14" r="1"/><circle cx="16.5" cy="14" r="1"/></svg>`,
  mark: `<img src="assets/img/logo.png" width="340" height="140" alt="文心牙醫聯合診所 Ven-Shin United Dental Clinic">`
};

const linkArrow = (t) => `<span class="link-arrow">${t}${ico.arrow}</span>`;

/* ---------------------------------------------------------------- header */
const header = () => `<a class="skip-link" href="#main">跳到主要內容</a>

<header class="header" data-nav>
  <div class="header__inner">
    <a class="brand" href="index.html" aria-label="文心牙醫聯合診所 首頁">
      ${ico.mark}
    </a>

    <nav class="nav" aria-label="主選單">
      <div class="nav__item">
        <a class="nav__link" href="about.html">關於文心${ico.caret}</a>
        <div class="nav__menu">
          <a href="about.html">診所理念</a>
          <a href="team.html">醫師團隊</a>
          <a href="contact.html">門診時間與交通</a>
        </div>
      </div>
      <div class="nav__item">
        <a class="nav__link" href="services.html">診療項目${ico.caret}</a>
        <div class="nav__menu">
          <a href="service-invisalign.html">隱適美隱形矯正</a>
          <a href="service-orthodontics.html">齒顎矯正</a>
          <a href="service-implant.html">數位人工植牙</a>
          <a href="services.html#all">全部診療項目</a>
        </div>
      </div>
      <div class="nav__item"><a class="nav__link" href="faq.html">常見問題</a></div>
      <div class="nav__item"><a class="nav__link" href="contact.html">聯絡我們</a></div>
    </nav>

    <div class="header__actions">
      <a class="header__tel" href="tel:${TEL}">${ico.phone}${TEL_TEXT}</a>
      <a class="btn btn--primary btn--sm header__cta" href="booking.html">線上預約</a>
      <button class="burger" data-burger type="button" aria-expanded="false" aria-controls="mobile-sheet" aria-label="開啟選單">
        <span class="burger__box"><span class="burger__line"></span><span class="burger__line"></span><span class="burger__line"></span></span>
      </button>
    </div>
  </div>
</header>

<div class="scrim" data-scrim></div>
<aside class="sheet" id="mobile-sheet" data-sheet aria-hidden="true" aria-label="行動選單">
  <div class="sheet__grip" aria-hidden="true"></div>
  <div class="sheet__body">
    <div class="sheet__group">
      <p class="sheet__title">關於文心</p>
      <div class="sheet__links"><a href="about.html">診所理念</a><a href="team.html">醫師團隊</a></div>
    </div>
    <div class="sheet__group">
      <p class="sheet__title">診療項目</p>
      <div class="sheet__links">
        <a href="service-invisalign.html">隱適美隱形矯正</a>
        <a href="service-orthodontics.html">齒顎矯正</a>
        <a href="service-implant.html">數位人工植牙</a>
        <a href="services.html">全部診療項目</a>
      </div>
    </div>
    <div class="sheet__group">
      <p class="sheet__title">更多</p>
      <div class="sheet__links"><a href="faq.html">常見問題</a><a href="contact.html">門診時間與交通</a></div>
    </div>
  </div>
  <div class="sheet__foot">
    <a class="btn btn--primary btn--block" href="booking.html">線上預約看診</a>
    <a class="btn btn--ghost btn--block" href="tel:${TEL}">撥打 ${TEL_TEXT}</a>
  </div>
</aside>`;

/* ---------------------------------------------------------------- footer */
const footer = () => `<footer class="footer">
  <div class="shell">
    <div class="footer__grid">
      <div>
        <a class="brand" href="index.html">${ico.mark}</a>
        <p class="footer__blurb">從「心」出發，成為全家人笑容的守護者。深耕台南在地 20 年。</p>
        <div class="footer__social">
          <a href="${FB}" target="_blank" rel="noopener" aria-label="文心牙醫 Facebook 粉絲專頁">${ico.fb}</a>
          <a href="${LINE}" target="_blank" rel="noopener" aria-label="文心牙醫官方 LINE">${ico.line}</a>
          <a href="tel:${TEL}" aria-label="撥打電話 ${TEL_TEXT}">${ico.phone}</a>
        </div>
      </div>
      <div>
        <p class="footer__title">診療項目</p>
        <ul class="footer__links">
          <li><a href="service-invisalign.html">隱適美隱形矯正</a></li>
          <li><a href="service-orthodontics.html">齒顎矯正</a></li>
          <li><a href="service-implant.html">數位人工植牙</a></li>
          <li><a href="services.html#reconstruction">全口重建</a></li>
          <li><a href="services.html#kids">兒童牙科</a></li>
          <li><a href="services.html">全部項目</a></li>
        </ul>
      </div>
      <div>
        <p class="footer__title">關於我們</p>
        <ul class="footer__links">
          <li><a href="about.html">診所理念</a></li>
          <li><a href="team.html">醫師團隊</a></li>
          <li><a href="faq.html">常見問題</a></li>
          <li><a href="contact.html">聯絡與交通</a></li>
          <li><a href="booking.html">線上預約</a></li>
        </ul>
      </div>
      <div>
        <p class="footer__title">聯絡資訊</p>
        <dl class="info-list" style="gap:var(--sp-4)">
          <div class="info-item" style="gap:var(--sp-3)"><div><dt>地址</dt><dd style="font-size:0.9375rem">台南市南區大同路二段166號</dd></div></div>
          <div class="info-item" style="gap:var(--sp-3)"><div><dt>電話</dt><dd style="font-size:0.9375rem"><a href="tel:${TEL}">${TEL_TEXT}</a></dd></div></div>
          <div class="info-item" style="gap:var(--sp-3)"><div><dt>門診</dt><dd style="font-size:0.9375rem">週一至週五 09:00–21:00<br>週六 09:00–12:00</dd></div></div>
        </dl>
      </div>
    </div>
    <div class="footer__bottom">
      <p>© 2026 文心牙醫聯合診所 Ven-Shin United Dental Clinic. All rights reserved.</p>
      <nav aria-label="頁尾連結"><a href="privacy.html">隱私權政策</a><a href="sitemap.html">網站地圖</a></nav>
    </div>
  </div>
</footer>

<nav class="dock" data-dock aria-label="快速聯絡">
  <a href="tel:${TEL}">${ico.phone}打電話</a>
  <a class="is-line" href="${LINE}" target="_blank" rel="noopener">${ico.line}LINE</a>
  <a class="is-primary" href="booking.html">${ico.cal}線上預約</a>
</nav>`;


/* ---------------------------------------------------------------- 門診表
   轉錄自診所原始門診表圖，含每一診的值班醫師。
   時間若有異動，請同步更新 assets/js/main.js 的 CLINIC_HOURS。      */
const ROSTER = {
  "早": { label: "早診", time: "09:00 – 12:00",
    d: { 1: ["李俊茂","王媛儀"], 2: ["陳柏群"], 3: ["李俊茂"], 4: ["王媛儀","陳柏群"], 5: ["李俊茂","王媛儀"], 6: ["李俊茂","王媛儀","陳柏群"] } },
  "午": { label: "午診", time: "15:00 – 17:30",
    d: { 1: ["李俊茂","陳柏群"], 2: ["王媛儀"], 3: ["李俊茂","陳柏群"], 4: ["李俊茂"], 5: ["李俊茂","陳柏群"], 6: [] } },
  "晚": { label: "晚診", time: "18:10 – 21:00",
    d: { 1: ["李俊茂","陳柏群"], 2: ["王媛儀","陳柏群"], 3: ["陳柏群"], 4: ["李俊茂","王媛儀"], 5: ["李俊茂","陳柏群"], 6: [] } }
};
const DAYS = [["1","一"],["2","二"],["3","三"],["4","四"],["5","五"],["6","六"]];

function hoursTable() {
  const head = DAYS.map(([n, z]) => `<th scope="col" data-day="${n}">週${z}</th>`).join("");
  const rows = Object.values(ROSTER).map(sess => {
    const cells = DAYS.map(([n]) => {
      const docs = sess.d[n] || [];
      return docs.length
        ? `<td data-day="${n}">${docs.map(x => `<span class="dr">${x}</span>`).join("")}</td>`
        : `<td class="off" data-day="${n}">休診</td>`;
    }).join("");
    return `<tr><th scope="row">${sess.label}<b>${sess.time}</b></th>${cells}</tr>`;
  }).join("");
  return `<div class="hours-wrap">
        <table class="hours" data-hours-table>
          <caption>每一診的值班醫師如下，週日與國定例假日休診。</caption>
          <thead><tr><th scope="col">診次</th>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
}

/* ---------------------------------------------------------------- CTA band */
const ctaBand = (heading, text) => `<section class="cta-band">
  <div class="shell center">
    <h2 data-reveal>${heading}</h2>
    <p class="lede mt-4" style="max-width:40rem;margin-inline:auto" data-reveal data-reveal-delay="60">${text}</p>
    <div class="btn-row btn-row--center" data-reveal data-reveal-delay="120">
      <a class="btn btn--primary btn--lg" href="booking.html">線上預約看診</a>
      <a class="btn btn--on-dark btn--lg" href="${LINE}" target="_blank" rel="noopener">用 LINE 詢問</a>
    </div>
  </div>
</section>`;

/* ---------------------------------------------------------------- page head */
function pageHead(eyebrow, h1, lede, crumbs) {
  const items = crumbs.map((c, i) =>
    i === crumbs.length - 1
      ? `<li aria-current="page">${c.name}</li>`
      : `<li><a href="${c.url}">${c.name}</a></li>`
  ).join("");
  return `<section class="page-head">
  <div class="shell">
    <nav class="crumbs" aria-label="麵包屑"><ol>${items}</ol></nav>
    <p class="eyebrow mt-4">${eyebrow}</p>
    <h1>${h1}</h1>
    ${lede ? `<p class="lede">${lede}</p>` : ""}
  </div>
</section>`;
}

function breadcrumbLd(crumbs) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: SITE + "/" + (c.url === "index.html" ? "" : c.url)
    }))
  };
}

/* ---------------------------------------------------------------- layout */
function layout(p) {
  const url = SITE + "/" + (p.slug === "index.html" ? "" : p.slug);
  const graph = [{ "@type": "WebPage", "@id": url + "#page", url, name: p.title, inLanguage: "zh-TW",
                   isPartOf: { "@id": SITE + "/#website" },
                   about: { "@id": SITE + "/#clinic" },
                   description: p.desc }];
  if (p.crumbs) graph.push(breadcrumbLd(p.crumbs));
  if (p.ld) graph.push(...(Array.isArray(p.ld) ? p.ld : [p.ld]));

  return `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
${p.keywords ? `<meta name="keywords" content="${p.keywords}">` : ""}
<link rel="canonical" href="${url}">
<meta name="robots" content="${p.noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1"}">
<meta name="author" content="文心牙醫聯合診所">
<meta name="geo.region" content="TW-TNN">
<meta name="geo.placename" content="台南市南區">

<meta property="og:type" content="website">
<meta property="og:locale" content="zh_TW">
<meta property="og:site_name" content="文心牙醫聯合診所">
<meta property="og:title" content="${p.ogTitle || p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/img/og-cover.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${p.ogTitle || p.title}">
<meta name="twitter:description" content="${p.desc}">
<meta name="twitter:image" content="${SITE}/assets/img/og-cover.jpg">

<meta name="theme-color" content="#FBF8F3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#14110E" media="(prefers-color-scheme: dark)">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@500;600;700&display=swap">
<link rel="stylesheet" href="assets/css/style.css">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<script>document.documentElement.classList.add("js");</script>

<script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)}
</script>
</head>
<body>
${header()}

<main id="main">
${p.body}
</main>

${footer()}

<script src="assets/js/main.js" defer></script>
${p.scripts || ""}
</body>
</html>
`;
}

/* ========================================================================
   PAGES
   ======================================================================== */
const pages = [];
const C = { home: { name: "首頁", url: "index.html" } };

/* ------------------------------------------------------------ 關於文心 */
pages.push({
  slug: "about.html",
  title: "關於文心｜台南南區牙醫診所 — 深耕在地 20 年的家庭牙科",
  desc: "文心牙醫聯合診所 2003 年創立於台南，深耕在地 20 年、累積服務超過 60,000 人次。我們相信關懷比技術與設備更難得，提供從兒童到長輩的全家庭牙科照護。",
  keywords: "台南牙醫,台南南區牙醫,文心牙醫,家庭牙科,台南牙醫推薦",
  crumbs: [C.home, { name: "關於文心", url: "about.html" }],
  body: `
${pageHead("關於文心", "把牙科，做回一件「關於人」的事", "2003 年，我們離開大型醫學中心，在台南開了第一間文心。二十年過去，當初那些坐在診療椅上的孩子，有些已經帶著自己的孩子回來。", [C.home, { name: "關於文心", url: "about.html" }])}

<section class="section">
  <div class="shell">
    <div class="grid grid-2" style="align-items:start;gap:var(--sp-8)">
      <div class="prose" data-reveal>
        <p class="eyebrow">我們的理念</p>
        <h2 class="mt-4">牙齒治療不只是處理一個病例</h2>
        <p class="mt-5">坐在診療椅上的，是一個會緊張、會怕痛、會擔心費用、會想知道「這樣到底要不要做」的人。</p>
        <p>所以在文心，我們把「溫馨」跟「專業」放在同樣的位置。精良的設備與材料是基本功，但真正讓一間診所值得被記住的，往往是人與人之間的那份關懷——醫師願意多講兩句、助理記得你怕打針、櫃檯知道你下班時間比較晚。</p>
        <p>這些事不會出現在任何一張證書上，卻是我們從 2003 年堅持到現在的原因。</p>
      </div>

      <div data-reveal data-reveal-delay="90">
        <div class="card" style="background:var(--brand-tint);border-color:transparent">
          <h3>二十年，一些數字</h3>
          <dl class="hero__trust" style="margin-top:var(--sp-5);border:0;padding:0">
            <div class="hero__stat"><strong>2003</strong><span>創立於台南大林</span></div>
            <div class="hero__stat"><strong>20<span style="font-size:.6em">年</span></strong><span>深耕在地從未搬離</span></div>
            <div class="hero__stat"><strong>60,000<span style="font-size:.6em">+</span></strong><span>累積服務人次</span></div>
            <div class="hero__stat"><strong>376<span style="font-size:.6em">+</span></strong><span>Google 真實好評</span></div>
          </dl>
        </div>
        <div class="notice mt-5">${ico.info}<p>數字只是結果。我們更在意的是，這些人次背後，有多少人後來願意把家人也帶來。</p></div>
      </div>
    </div>
  </div>
</section>

<section class="section section--sunk">
  <div class="shell">
    <div class="section-head" data-reveal>
      <p class="eyebrow">我們怎麼看診</p>
      <h2>四件我們不打折扣的事</h2>
    </div>
    <div class="grid grid-2">
      <div class="card" data-reveal>
        <span class="card__icon">01</span>
        <h3>治療計畫，先講清楚再開始</h3>
        <p>需要做什麼、為什麼要做、大概的費用區間、有沒有其他選擇、不做會怎麼樣。這些在動手之前就會跟你說明白，不會做到一半才冒出新項目。</p>
      </div>
      <div class="card" data-reveal data-reveal-delay="70">
        <span class="card__icon">02</span>
        <h3>一位主治醫師負責到底</h3>
        <p>你的狀況由同一位醫師從頭跟到尾，不會每次來換一個人、每次都要重講一遍。遇到複雜案例，才由團隊共同會診討論。</p>
      </div>
      <div class="card" data-reveal data-reveal-delay="140">
        <span class="card__icon">03</span>
        <h3>看不見的地方更不能省</h3>
        <p>每位患者使用獨立滅菌器械包，採高溫高壓滅菌並定期監測。診間消毒、手部衛生、感控流程，全面且完善地落實。</p>
      </div>
      <div class="card" data-reveal data-reveal-delay="210">
        <span class="card__icon">04</span>
        <h3>長期記錄，陪你走過不同階段</h3>
        <p>我們保留你每一次的治療紀錄。三年前補的那顆牙、去年拍的 X 光，下次來都還在。從孩子的乳牙到長輩的假牙，一家人的牙齒狀況都在同一份脈絡裡。</p>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="shell shell--narrow prose" data-reveal>
    <p class="eyebrow">診療環境</p>
    <h2 class="mt-4">一個讓人沒那麼緊張的空間</h2>
    <p class="mt-5">很多人怕看牙，怕的其實不只是痛，還有那種被動、不知道接下來會發生什麼的感覺。</p>
    <p>我們盡量讓環境舒適一點、燈光柔和一點、等待的時間短一點。診療椅旁有螢幕，醫師會把你的口內照跟 X 光直接秀出來講給你聽——當你看得懂自己的狀況，緊張就會少一半。</p>
    <!-- 📷 PHOTO SLOT：此處可插入診所實景照片（候診區／診間／消毒室），建議 3 張橫式 1600×1000 -->
    <div class="notice mt-6">${ico.info}<p>若你對看牙有特別的恐懼或過去有不好的經驗，預約時可以先告訴我們，醫師會調整看診的節奏與說明方式。</p></div>
  </div>
</section>

${ctaBand("想先認識我們，再決定要不要來？", "歡迎先用 LINE 問問題，或直接預約一次完整的檢查與諮詢。")}
`
});

/* ------------------------------------------------------------ 醫師團隊 */
const doctors = [
  {
    key: "lee", surname: "李", name: "李俊茂", badge: "院長",
    role: "假牙贋復專科醫師",
    spec: "人工植牙 · 固定假牙 · 活動假牙 · 全口重建",
    intro: "二十多年來，李醫師看過最多的，是「牙齒掉了一段時間，不知道還能不能救」的患者。全口重建不是單純把缺牙補起來，而是要把咬合、齒槽骨條件、臉型與長期維護一起算進去。從醫學中心牙科部主任到自己開業，他習慣先把整張地圖畫出來，再決定從哪一顆牙開始。",
    creds: ["高雄醫學大學牙醫學士", "成功大學 EMBA 高階企管碩士", "中華民國衛福部家庭牙醫專科醫師", "台灣牙周補綴學會專科醫師", "全人照護牙醫學會專科醫師", "台灣植牙聯盟醫學會植牙專科醫師", "中華民國植牙醫學會植牙專科醫師", "曾任署立醫院牙科部主任"]
  },
  {
    key: "wang", surname: "王", name: "王媛儀", badge: "副院長",
    role: "齒顎矯正專科醫師",
    spec: "齒顎矯正 · 成人及兒童隱形矯正 · 齒顎及顏面發育生長評估",
    intro: "王醫師是衛福部認證的齒顎矯正專科醫師，也是隱適美認證醫師，同時在奇美醫學中心矯正科兼任主治。她特別關注兒童的齒顎與顏面發育——很多成年後難處理的骨性問題，在換牙期就看得出端倪。成人矯正則強調把生活型態算進計畫：你的工作要不要常見客戶、能不能配合配戴時間，都會影響方案選擇。",
    creds: ["高雄醫學大學牙醫學士", "新加坡國立大學商學院高階企管碩士", "中華民國衛福部齒顎矯正專科醫師", "隱適美 Invisalign 認證醫師", "美國矯正學會（AAO）國際會員", "世界矯正醫師聯盟（WFO）會員", "中華民國舌側矯正醫學會會員", "奇美醫學中心矯正科兼任主治醫師"]
  },
  {
    key: "chen", surname: "陳", name: "陳柏群", badge: "主治醫師",
    role: "主治醫師",
    spec: "牙齒美白 · 根管治療 · 牙周病治療 · 一般及複雜拔牙 · 假牙贋復",
    intro: "陳醫師處理的多半是「現在很不舒服」的狀況：半夜痛醒的牙髓炎、咬到就痛的裂齒、卡住拔不出來的智齒。曾任職奇美醫學中心，並赴美國紐約大學進行植牙專科研究。他的原則是先止痛、先把發炎控制下來，再談後續怎麼做比較好。",
    creds: ["台北醫學大學牙醫學士", "美國紐約大學（NYU）植牙專科研究", "台灣口腔矯正醫學會會員", "曾任奇美醫學中心醫師"]
  }
];

pages.push({
  slug: "team.html",
  title: "醫師團隊｜台南牙醫 — 衛福部齒顎矯正、假牙贋復專科醫師",
  desc: "文心牙醫醫師團隊：李俊茂院長（假牙贋復專科）、王媛儀副院長（衛福部齒顎矯正專科、隱適美認證醫師）、陳柏群主治醫師。完整學經歷與專長介紹。",
  keywords: "台南矯正醫師,台南植牙醫師,齒顎矯正專科醫師,隱適美認證醫師,王媛儀,李俊茂,陳柏群",
  crumbs: [C.home, { name: "醫師團隊", url: "team.html" }],
  ld: doctors.map(d => ({
    "@type": "Physician",
    name: d.name,
    jobTitle: d.role,
    medicalSpecialty: "Dentistry",
    worksFor: { "@id": SITE + "/#clinic" },
    knowsAbout: d.spec.split(" · ")
  })),
  body: `
${pageHead("醫師團隊", "看診前，先認識為你看診的人", "證書可以列很長，但真正重要的是：這位醫師處理過多少跟你一樣的狀況，以及他願不願意花時間讓你聽懂。", [C.home, { name: "醫師團隊", url: "team.html" }])}

<section class="section">
  <div class="shell">
    ${doctors.map((d, i) => `
    <article class="card" id="${d.key}" style="padding:0;overflow:hidden;margin-bottom:var(--sp-6)" data-reveal${i ? ` data-reveal-delay="${i * 60}"` : ""}>
      <div class="grid" style="grid-template-columns:minmax(0,1fr);gap:0">
        <div style="display:grid;grid-template-columns:minmax(0,1fr);">
          <div class="doctor__portrait">
            <span class="doctor__badge">${d.badge}</span>
            <img src="assets/img/dr-${d.key}.jpg" width="420" height="420" loading="lazy" alt="${d.name}醫師－${d.role}">
          </div>
          <div style="padding:var(--sp-6)">
            <div class="doctor__name"><h2 style="font-size:var(--step-3)">${d.name}</h2><span class="doctor__role">${d.role}</span></div>
            <p class="doctor__spec">${d.spec}</p>
            <p class="mt-5" style="color:var(--ink-2)">${d.intro}</p>
            <div class="doctor__creds mt-5">
              <p class="sheet__title" style="margin-bottom:var(--sp-3)">學歷與認證</p>
              <ul>${d.creds.map(c => `<li>${c}</li>`).join("")}</ul>
            </div>
            <div class="btn-row mt-6">
              <a class="btn btn--primary btn--sm" href="booking.html">預約 ${d.name} 醫師</a>
            </div>
          </div>
        </div>
      </div>
    </article>`).join("")}

    <div class="notice" data-reveal>${ico.info}<p>每位醫師的看診時段不同，預約時可以註明希望由哪一位醫師看診，我們會盡量安排。若遇到需要跨專科處理的複雜案例，團隊會共同會診後再提出建議。</p></div>
  </div>
</section>

${ctaBand("想找哪一位醫師？", "預約時註明醫師與想處理的問題，我們會安排合適的時段長度。")}
`
});

/* ------------------------------------------------------------ 診療項目 */
const services = [
  { id: "invisalign", name: "隱適美隱形矯正", href: "service-invisalign.html",
    desc: "透明牙套，幾乎看不出來，可自行取下吃飯與刷牙。適合在意外觀、工作需要常與人接觸的成人與青少年。" },
  { id: "ortho", name: "齒顎矯正", href: "service-orthodontics.html",
    desc: "處理齒列擁擠、暴牙、戽斗、深咬與咬合不正。由衛福部齒顎矯正專科醫師評估與執行，含兒童early treatment。" },
  { id: "implant", name: "數位人工植牙", href: "service-implant.html",
    desc: "術前以 3D 電腦斷層評估骨質條件，數位導板規劃植體位置與角度，降低手術的不確定性。" },
  { id: "reconstruction", name: "全口重建", href: "services.html#reconstruction",
    desc: "大範圍缺牙、牙齒嚴重磨耗或咬合崩壞時，重新建立穩定的咬合與咀嚼功能，而不只是把牙齒補回去。" },
  { id: "denture", name: "假牙贋復", href: "services.html#denture",
    desc: "固定式牙橋、全瓷冠、活動假牙與植體支撐假牙。依缺牙位置、齒槽骨狀況與維護難易度選擇合適方式。" },
  { id: "endo", name: "根管治療", href: "services.html#endo",
    desc: "牙髓發炎或壞死造成的劇烈疼痛，透過根管清創與封填保留自然牙，後續多半需要製作牙冠保護。" },
  { id: "perio", name: "牙周病治療", href: "services.html#perio",
    desc: "刷牙流血、牙齦萎縮、牙齒搖動。從基本的牙結石清除到牙周翻瓣手術，重點在長期的維護與回診。" },
  { id: "whitening", name: "牙齒美白", href: "services.html#whitening",
    desc: "診間冷光美白與居家美白牙托。先排除蛀牙與牙周問題，再評估適合的美白方式與可達到的色階。" },
  { id: "kids", name: "兒童牙科", href: "services.html#kids",
    desc: "乳牙蛀牙治療、窩溝封填、塗氟與口腔衛教。重點是讓孩子不害怕看牙，建立可以持續一輩子的習慣。" },
  { id: "cosmetic", name: "美容牙科", href: "services.html#cosmetic",
    desc: "陶瓷貼片、全瓷冠與牙齦修整。在維持牙齒健康與咬合功能的前提下，改善前牙的形態、顏色與排列。" }
];

pages.push({
  slug: "services.html",
  title: "診療項目｜台南牙醫 — 矯正、植牙、全口重建、兒童牙科",
  desc: "文心牙醫提供隱適美隱形矯正、齒顎矯正、數位人工植牙、全口重建、假牙贋復、根管治療、牙周病治療、牙齒美白、兒童牙科與美容牙科，一處照顧全家人的牙齒。",
  keywords: "台南牙醫診療項目,台南植牙,台南矯正,全口重建,根管治療,牙周病,兒童牙科,牙齒美白",
  crumbs: [C.home, { name: "診療項目", url: "services.html" }],
  ld: { "@type": "ItemList", name: "診療項目", itemListElement: services.map((s, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "MedicalProcedure", name: s.name, url: SITE + "/" + s.href } })) },
  body: `
${pageHead("診療項目", "一個診所，照顧全家人的牙齒", "從定期洗牙到全口重建，從孩子的第一次看診到長輩的假牙。不必為了不同的治療，在不同診所之間奔波。", [C.home, { name: "診療項目", url: "services.html" }])}

<section class="section" id="all">
  <div class="shell">
    <div class="grid grid-2">
      ${services.map((s, i) => `
      <article class="card card--linked" id="${s.id}" data-reveal${i ? ` data-reveal-delay="${Math.min(i * 40, 200)}"` : ""}>
        <h2 style="font-size:var(--step-2)">${s.name}</h2>
        <p>${s.desc}</p>
        <p class="card__foot">
          ${s.href.startsWith("service-") ? `<a href="${s.href}">${linkArrow("詳細介紹")}</a>` : `<a href="booking.html?service=${s.id}">${linkArrow("預約諮詢")}</a>`}
        </p>
      </article>`).join("")}
    </div>

    <div class="notice mt-7" data-reveal>${ico.info}<p>以上說明僅供參考。實際是否適合、需要哪些療程、療程長度與費用，都需要經過口腔檢查與必要的影像評估後，由醫師依個人狀況判斷。</p></div>
  </div>
</section>

<section class="section section--sunk">
  <div class="shell">
    <div class="section-head section-head--center" data-reveal>
      <p class="eyebrow eyebrow--center">看診流程</p>
      <h2>第一次來，會發生什麼事</h2>
    </div>
    <div class="grid grid-4">
      <div class="step" data-reveal><span class="step__num">1</span><h4>預約與報到</h4><p>線上預約或來電。初診請攜帶健保卡，提早 5 分鐘到櫃檯填寫基本資料。</p></div>
      <div class="step" data-reveal data-reveal-delay="70"><span class="step__num">2</span><h4>檢查與影像</h4><p>口內檢查、必要的 X 光或 3D 掃描，建立你目前的口腔狀況紀錄。</p></div>
      <div class="step" data-reveal data-reveal-delay="140"><span class="step__num">3</span><h4>說明與討論</h4><p>醫師用螢幕秀出你的影像，說明問題、可行方案、大致時程與費用區間。</p></div>
      <div class="step" data-reveal data-reveal-delay="210"><span class="step__num">4</span><h4>你決定要不要開始</h4><p>需要時間考慮完全沒問題。確定後再安排後續療程的時間。</p></div>
    </div>
  </div>
</section>

${ctaBand("不確定自己需要哪一種治療？", "先來做一次完整檢查與諮詢，醫師會告訴你有哪些選擇，以及各自的差別。")}
`
});

/* ------------------------------------------------------------ 服務內頁 */
function servicePage(cfg) {
  const crumbs = [C.home, { name: "診療項目", url: "services.html" }, { name: cfg.crumb, url: cfg.slug }];
  return {
    slug: cfg.slug,
    title: cfg.title,
    desc: cfg.desc,
    keywords: cfg.keywords,
    crumbs,
    ld: [
      { "@type": "MedicalProcedure", name: cfg.crumb, description: cfg.desc,
        procedureType: "https://schema.org/NoninvasiveProcedure",
        bodyLocation: "口腔", provider: { "@id": SITE + "/#clinic" } },
      { "@type": "FAQPage", mainEntity: cfg.faq.map(f => ({
          "@type": "Question", name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a.replace(/<[^>]+>/g, "") } })) }
    ],
    body: `
${pageHead(cfg.eyebrow, cfg.h1, cfg.lede, crumbs)}

<section class="section">
  <div class="shell">
    <div class="grid" style="grid-template-columns:minmax(0,1fr);gap:var(--sp-8)">
      <div class="prose" style="max-width:48rem" data-reveal>
        ${cfg.intro}
      </div>
    </div>
  </div>
</section>

<section class="section section--sunk">
  <div class="shell">
    <div class="section-head" data-reveal><p class="eyebrow">適合對象</p><h2>${cfg.fitTitle}</h2></div>
    <div class="grid grid-2">
      ${cfg.fit.map((f, i) => `<div class="card" data-reveal${i ? ` data-reveal-delay="${i * 60}"` : ""}>
        <span class="card__icon card__icon--calm">${ico.check}</span>
        <h3 style="font-size:var(--step-2)">${f.t}</h3><p>${f.d}</p></div>`).join("")}
    </div>
  </div>
</section>

<section class="section">
  <div class="shell">
    <div class="section-head" data-reveal><p class="eyebrow">療程步驟</p><h2>${cfg.stepsTitle}</h2></div>
    <div class="grid grid-2">
      ${cfg.steps.map((s, i) => `<div class="step" data-reveal${i ? ` data-reveal-delay="${i * 60}"` : ""}>
        <span class="step__num">${i + 1}</span><h4>${s.t}</h4><p>${s.d}</p></div>`).join("")}
    </div>
    <div class="notice mt-7" data-reveal>${ico.info}<p>${cfg.caveat}</p></div>
  </div>
</section>

<section class="section section--sunk">
  <div class="shell shell--narrow">
    <div class="section-head section-head--center" data-reveal><p class="eyebrow eyebrow--center">常見問題</p><h2>${cfg.crumb}的常見疑問</h2></div>
    <div class="accordion" data-reveal>
      ${cfg.faq.map((f, i) => `
      <div class="acc" data-acc>
        <h3 style="margin:0"><button class="acc__btn" type="button" aria-expanded="false" aria-controls="${cfg.id}-f${i}">${f.q}<span class="acc__sign" aria-hidden="true"></span></button></h3>
        <div class="acc__panel" id="${cfg.id}-f${i}"><div class="acc__inner">${f.a}</div></div>
      </div>`).join("")}
    </div>
    <div class="btn-row btn-row--center mt-6" data-reveal><a class="btn btn--ghost" href="faq.html">看全部常見問題</a></div>
  </div>
</section>

${ctaBand(cfg.ctaTitle, cfg.ctaText)}
`
  };
}

pages.push(servicePage({
  id: "inv", slug: "service-invisalign.html", crumb: "隱適美隱形矯正",
  title: "台南隱適美隱形矯正｜透明牙套療程、適合對象與常見問題 — 文心牙醫",
  desc: "台南隱適美隱形矯正，由衛福部齒顎矯正專科暨隱適美認證醫師王媛儀親自評估。說明隱形牙套療程步驟、適合對象、配戴時間與常見疑問，線上預約矯正諮詢。",
  keywords: "台南隱適美,台南隱形矯正,隱形牙套,透明牙套,台南矯正推薦,隱適美費用,隱適美附件",
  eyebrow: "隱適美隱形矯正",
  h1: "把牙套戴在臉上，不等於把生活停下來",
  lede: "隱適美用一系列透明牙套，分階段把牙齒移動到規劃好的位置。幾乎看不出來、可以自己取下，吃飯與刷牙都跟平常一樣。",
  intro: `
    <h2>隱適美到底是什麼</h2>
    <p>隱適美（Invisalign）是一套數位化的隱形矯正系統。醫師先用 3D 口掃取得你的齒列模型，在電腦中規劃每一顆牙要往哪裡移動、分幾個階段完成，接著依照這份計畫製作一系列客製化的透明牙套。</p>
    <p>你每天配戴約 <strong>20 至 22 小時</strong>，每一副牙套配戴一到兩週後換下一副，牙齒就會沿著規劃好的路徑逐步移動。吃東西、刷牙、重要場合都可以自行取下——這是它跟傳統固定式矯正器最大的差別。</p>
    <h3>和傳統矯正器比起來</h3>
    <p>療程長度主要取決於齒列狀況的複雜度，而不是器材本身。單純的齒列擁擠，兩者時間差異通常不大；若涉及骨性問題、需要大幅度拔牙退縮，傳統矯正在某些移動類型上仍有其優勢。</p>
    <p>隱適美真正的差別在於：<strong>外觀幾乎看不出來、可自行取下清潔、沒有金屬線磨破嘴的問題、回診間隔通常較長</strong>。相對地，它非常依賴配戴的自律度——每天少戴幾小時，整個療程就會延後。</p>
    <h3>為什麼要由矯正專科醫師評估</h3>
    <p>隱形牙套只是工具，真正決定結果的是背後的診斷與移動規劃。文心的矯正由衛福部認證的齒顎矯正專科醫師、同時也是隱適美認證醫師的<a href="team.html#wang">王媛儀副院長</a>親自評估與執行，不轉介、不外包。</p>`,
  fitTitle: "什麼樣的狀況適合考慮隱適美",
  fit: [
    { t: "在意矯正期間的外觀", d: "工作需要常與人接觸、面對鏡頭，或單純不想讓人一眼看出在矯正。透明牙套在一般社交距離下幾乎不明顯。" },
    { t: "齒列擁擠、有縫隙、輕中度咬合問題", d: "牙齒排列不整齊、前牙有縫、輕中度的深咬或錯咬，多半是隱適美可以處理的範圍。" },
    { t: "無法配合固定矯正器的生活型態", d: "需要吹奏樂器、從事接觸性運動，或工作上不方便有金屬矯正器的人。" },
    { t: "能夠配合每天 20 小時以上配戴", d: "這點很關鍵。隱適美的效果完全建立在配戴時數上，無法自律配戴的人反而不適合。" }
  ],
  stepsTitle: "從諮詢到完成，大致會經過這些階段",
  steps: [
    { t: "初次諮詢與完整檢查", d: "口內檢查、環口 X 光、3D 口掃建立數位模型。醫師評估你的咬合、齒列擁擠程度與臉型比例。" },
    { t: "治療計畫與 3D 模擬", d: "醫師規劃移動方式與階段，你可以在螢幕上看到預期的齒列變化，確認方向後再決定是否開始。" },
    { t: "牙套製作與配戴指導", d: "客製牙套製作完成後，醫師說明配戴方式、取戴技巧與清潔保養。必要時會在牙齒上黏附小附件協助特定移動。" },
    { t: "定期回診追蹤", d: "依醫師安排回診，確認牙齒是否照計畫移動、牙套是否密合，並領取後續階段的牙套。" },
    { t: "細修與完成", d: "主要移動完成後，可能需要再追加幾副牙套做細部調整，讓咬合更穩定。" },
    { t: "維持器配戴", d: "矯正結束不代表結束。牙齒有回到原位的傾向，必須依醫師指示配戴維持器，否則前面的努力可能白費。" }
  ],
  caveat: "是否適合隱適美、需要多少副牙套、療程大約多長、費用範圍為何，都必須經過實際的口腔檢查與影像評估後，由矯正專科醫師依個人狀況判斷。網路上的資訊僅能作為初步了解，不能取代專業診斷。",
  faq: [
    { q: "第一次諮詢隱適美會做什麼？一定要 3D 口掃、拍 X 光嗎？", a: "<p>初次諮詢通常包含口內檢查、環口 X 光與 3D 口掃。X 光可以看到牙根、齒槽骨與是否有阻生齒，口掃則建立精確的數位齒列模型——這兩項是規劃移動路徑的基礎，少了任何一項，計畫都只能靠猜。實際檢查項目仍會依個人口腔狀況由醫師判斷。</p>" },
    { q: "隱形矯正的附件是什麼？會掉嗎、會痛嗎、影響美觀嗎？", a: "<p>附件是黏在牙齒表面的小塊樹脂，顏色接近牙齒，用來讓牙套更有效地抓住牙齒、完成旋轉或壓入這類比較困難的移動。</p><p>它不會痛，但剛黏上時舌頭可能會覺得卡卡的，通常幾天就習慣。附件有可能在取戴牙套或吃硬物時脫落，發現掉了請聯絡診所安排重黏，不要自行放著不管，否則該顆牙的移動會跟不上計畫。</p>" },
    { q: "隱適美跟傳統牙套哪個比較快？", a: "<p>主要取決於齒列狀況，不是器材。單純擁擠兩者差異不大；複雜的骨性問題或大幅度拔牙空間關閉，傳統矯正在某些移動上仍有優勢。另一個關鍵變數是配戴時數——隱適美每天少戴幾小時，療程就會往後延。</p>" },
    { q: "矯正期間可以正常吃東西嗎？", a: "<p>可以。吃東西時請把牙套取下，這也是隱適美相對於固定矯正器的優點之一：沒有不能吃的食物清單。但要注意兩件事：取下後務必刷牙再戴回去，以及取下的時間要算進每天的「不配戴時數」裡。</p>" },
    { q: "成人年紀大了還可以矯正嗎？", a: "<p>可以。牙齒移動的生理機制並不會因為成年而消失，臨床上四、五十歲開始矯正的案例並不少見。成人矯正要特別注意的是牙周狀況——若有牙周病必須先控制穩定，才能開始移動牙齒。</p>" },
    { q: "矯正完成後牙齒會跑回去嗎？", a: "<p>有這個傾向，所以維持器非常重要。牙齒周圍的牙周韌帶具有記憶性，矯正後若沒有依指示配戴維持器，牙齒確實可能逐漸位移。維持器的配戴時間與方式請依主治醫師的指示執行。</p>" }
  ],
  ctaTitle: "想知道自己適不適合隱適美？",
  ctaText: "預約一次矯正諮詢，由矯正專科醫師檢查後告訴你可行的方案與差別。"
}));

pages.push(servicePage({
  id: "ort", slug: "service-orthodontics.html", crumb: "齒顎矯正",
  title: "台南齒顎矯正｜傳統矯正、兒童早期矯正與咬合問題 — 文心牙醫",
  desc: "台南齒顎矯正由衛福部齒顎矯正專科醫師評估執行。處理齒列擁擠、暴牙、戽斗、深咬與咬合不正，並提供兒童齒顎發育評估與早期矯正。線上預約矯正諮詢。",
  keywords: "台南矯正,台南齒顎矯正,台南牙齒矯正,兒童矯正,暴牙,戽斗,咬合不正,矯正專科醫師",
  eyebrow: "齒顎矯正",
  h1: "矯正處理的不只是牙齒，是整組咬合",
  lede: "齒列不整除了外觀，還會影響清潔難易、咀嚼效率與顳顎關節。矯正的目的是把牙齒排整齊，也是把咬合關係調到一個能長期穩定運作的位置。",
  intro: `
    <h2>什麼時候該考慮矯正</h2>
    <p>最常見的理由是外觀——牙齒不整齊、笑起來不好看。但在臨床上，我們更在意的是這些狀況帶來的長期影響：</p>
    <ul>
      <li><strong>清潔死角</strong>：牙齒重疊的地方刷不乾淨，長期下來容易蛀牙與牙周問題。</li>
      <li><strong>咬合受力不均</strong>：某幾顆牙承受過多力量，造成異常磨耗、牙齒裂開或牙周負擔。</li>
      <li><strong>咀嚼效率下降</strong>：上下排咬不到一起，食物磨碎得不夠完全。</li>
      <li><strong>顳顎關節不適</strong>：部分咬合問題會伴隨張口困難、關節疼痛或聲響。</li>
    </ul>
    <h3>常見的矯正適應症</h3>
    <p>齒列擁擠、牙縫過大、暴牙（上顎前突）、戽斗（下顎前突）、深咬、開咬、錯咬、中線偏移、阻生齒導致的排列問題。各種狀況的處理難度與所需時間差異很大。</p>
    <h3>兒童的早期矯正</h3>
    <p>國際上普遍建議在 <strong>7 歲左右</strong>做一次齒顎發育評估。這個年紀恆牙開始萌發，可以看出齒弓寬度、上下顎生長方向是否出現偏差。</p>
    <p>早期矯正的目的通常不是把牙齒排整齊，而是<strong>引導顎骨往正確的方向生長</strong>、保留恆牙的萌發空間。有些在換牙期用簡單裝置就能改善的骨性問題，等到成年後往往就只剩下正顎手術這個選項。</p>`,
  fitTitle: "這些狀況建議安排一次矯正評估",
  fit: [
    { t: "牙齒重疊、刷不乾淨", d: "齒列擁擠造成的清潔死角，是長期蛀牙與牙周問題的主要來源之一。排整齊之後，清潔會容易很多。" },
    { t: "暴牙、戽斗或咬合不正", d: "影響的不只是側臉輪廓，還有咀嚼效率與咬合受力。成人與兒童的處理策略不同，需由專科醫師判斷。" },
    { t: "孩子 7 歲左右的發育評估", d: "即使看起來還好，也建議做一次檢查。早期發現骨性生長偏差，處理方式通常比成年後單純得多。" },
    { t: "準備做假牙或植牙前", d: "缺牙太久，鄰牙會往空隙傾倒、對咬牙會往下長。有時需要先用矯正把空間與角度調整回來，後續的贋復才做得好。" }
  ],
  stepsTitle: "矯正療程的進行方式",
  steps: [
    { t: "初診檢查與資料蒐集", d: "口內檢查、環口與側顱 X 光、齒列模型或 3D 口掃、口內外照片。這些是診斷分析的原始資料。" },
    { t: "診斷分析與方案討論", d: "醫師分析骨性關係與齒列狀況，說明需不需要拔牙、有哪些器材選擇、預估時程與費用區間。" },
    { t: "療程前的準備", d: "若有蛀牙、牙周問題或需要拔牙，必須先處理完成。牙周狀況不穩定時不適合開始移動牙齒。" },
    { t: "裝置矯正器並開始移動", d: "依選定方案裝置固定式矯正器或配戴隱形牙套，正式開始齒列移動。" },
    { t: "定期回診調整", d: "固定矯正通常每月回診調整一次，隱形矯正的回診間隔多半較長。每次回診確認移動是否符合計畫。" },
    { t: "拆除與維持器", d: "達成目標後拆除矯正器，進入維持期。維持器必須依醫師指示配戴，這一步跟矯正本身一樣重要。" }
  ],
  caveat: "需不需要拔牙、適合哪一種矯正方式、大約需要多久、費用範圍為何，都必須在完整的檢查與影像分析之後，由齒顎矯正專科醫師依個人狀況判斷。",
  faq: [
    { q: "成人牙齒矯正前要做哪些檢查？", a: "<p>一般包含口內檢查、環口 X 光（看牙根、齒槽骨與阻生齒）、側顱 X 光（分析骨性關係與側臉輪廓）、齒列模型或 3D 口掃，以及口內外照片。若有牙周疑慮，會另外做牙周檢查。成人矯正特別需要確認牙周狀況穩定，才能安全地移動牙齒。</p>" },
    { q: "矯正一定要拔牙嗎？", a: "<p>不一定。是否拔牙取決於齒列擁擠的嚴重程度、嘴唇的突度、以及齒弓還有多少空間可以利用。輕度擁擠常可用鄰面去釉或齒弓擴張解決；但嚴重擁擠或明顯暴牙時，拔牙往往是讓結果穩定的必要條件。醫師會說明拔與不拔各自的差別，再一起決定。</p>" },
    { q: "矯正會很痛嗎？", a: "<p>多數人形容為「痠脹」而不是尖銳的痛，通常出現在剛裝上矯正器或每次調整後的二到三天，之後逐漸緩解。固定矯正初期可能會磨到嘴唇內側，使用矯正蠟可以改善。疼痛明顯時可依醫師建議使用止痛藥。</p>" },
    { q: "小孩幾歲開始矯正比較好？", a: "<p>建議 7 歲左右先做一次齒顎發育評估，但這不等於要立刻開始矯正。多數孩子只需要定期追蹤，等換牙完成後再處理；少數有明顯骨性偏差或嚴重空間不足的，早期介入可以大幅簡化後續的治療。</p>" },
    { q: "矯正期間可以洗牙嗎？", a: "<p>可以，而且更應該洗。戴矯正器期間清潔難度提高，牙結石與牙菌斑累積得更快。建議依醫師建議的頻率回診洗牙，並搭配齒間刷與沖牙機加強清潔。</p>" },
    { q: "矯正中途可以換醫師或換診所嗎？", a: "<p>技術上可以，但不建議。矯正是一個連續的計畫，中途接手的醫師需要重新評估目前的進度與原先的規劃，有時候甚至需要調整方向。若確實有搬遷等需求，請事先與主治醫師討論，並取得完整的病歷與影像資料。</p>" }
  ],
  ctaTitle: "不確定自己或孩子需不需要矯正？",
  ctaText: "一次完整的矯正評估，就能知道目前的狀況、有哪些選擇，以及現在是不是適合的時機。"
}));

pages.push(servicePage({
  id: "imp", slug: "service-implant.html", crumb: "數位人工植牙",
  title: "台南植牙｜數位導板人工植牙、3D斷層評估與療程說明 — 文心牙醫",
  desc: "台南數位人工植牙，術前以 3D 電腦斷層評估齒槽骨條件，數位導板規劃植體位置與角度。由假牙贋復專科醫師李俊茂院長主持，說明植牙療程、適合對象與術後維護。",
  keywords: "台南植牙,台南人工植牙,數位植牙,植牙導板,缺牙,植牙費用,全口重建,台南植牙推薦",
  eyebrow: "數位人工植牙",
  h1: "植體要植在哪裡，先在電腦裡確認過",
  lede: "人工植牙是在齒槽骨中植入人工牙根，再在上面製作假牙。成敗的關鍵不在手術當天，而在術前對骨頭條件與植體位置的評估有多確實。",
  intro: `
    <h2>為什麼強調「數位」</h2>
    <p>傳統植牙的位置判斷，很大程度仰賴醫師的經驗與平面 X 光。但平面影像看不出骨頭的厚度、也看不清神經管與鼻竇的立體位置。</p>
    <p>數位植牙的流程是：先用 <strong>3D 錐狀射束電腦斷層（CBCT）</strong>取得齒槽骨的立體影像，結合 3D 口掃的齒列資料，在電腦中模擬植體要植入的位置、深度與角度——同時考慮骨量是否足夠、是否安全避開重要解剖構造，以及<strong>未來假牙做出來的受力方向是否正確</strong>。</p>
    <p>確認計畫後製作手術導板，手術時依導板執行。這麼做的意義是把不確定性盡量移到手術之前，而不是在翻開牙齦之後才臨場判斷。</p>
    <h3>從假牙倒推植體位置</h3>
    <p>一個常被忽略的觀念是：植體的位置應該由<strong>最終假牙要長在哪裡</strong>決定，而不是哪裡骨頭多就種哪裡。角度不對的植體，後續做出來的假牙受力會偏，清潔也更困難，長期下來容易出問題。</p>
    <p>這也是為什麼文心的植牙由<a href="team.html#lee">假牙贋復專科的李俊茂院長</a>主持——把贋復端的考量放進一開始的規劃裡。</p>`,
  fitTitle: "什麼狀況可以考慮植牙",
  fit: [
    { t: "單顆或多顆缺牙", d: "植牙不需要像傳統牙橋那樣修磨兩側的健康鄰牙，可以保留原本完好的牙齒。" },
    { t: "不想配戴活動假牙", d: "活動假牙需要每天取戴清潔，部分人會有異物感或咀嚼力不足的問題。植體支撐的假牙在穩定度上通常較佳。" },
    { t: "全口或大範圍缺牙重建", d: "可搭配全口重建計畫，以數顆植體支撐固定式或半固定式假牙，重新建立咬合。" },
    { t: "齒槽骨條件足夠或可補骨", d: "骨量不足不代表不能做，但可能需要先進行補骨或鼻竇增高，療程時間會相應延長。" }
  ],
  stepsTitle: "植牙療程的完整流程",
  steps: [
    { t: "檢查與 3D 斷層掃描", d: "評估全口狀況、拍攝 CBCT 取得齒槽骨立體資料，確認骨量、骨質與神經血管位置。" },
    { t: "數位規劃與導板製作", d: "在電腦中規劃植體位置、深度與角度，並從最終假牙的角度反推最佳方案，製作手術導板。" },
    { t: "前置治療", d: "若有蛀牙、牙周病或殘根需要處理，會先完成。牙周發炎的狀態下植牙風險明顯較高。" },
    { t: "植體植入手術", d: "局部麻醉下進行，依導板植入植體。手術本身多在一小時內完成，過程中不會感到疼痛。" },
    { t: "等待骨整合", d: "植體與齒槽骨結合通常需要 3 至 6 個月，視骨質條件而定。期間可依狀況配戴臨時假牙。" },
    { t: "製作與裝戴假牙", d: "骨整合完成後取模製作假牙，調整咬合後裝戴。之後需要定期回診檢查植體周圍的健康狀況。" }
  ],
  caveat: "能否植牙、需不需要補骨、總共需要多久、費用範圍為何，都必須經過口腔檢查與 3D 影像評估後由醫師判斷。糖尿病、骨質疏鬆用藥、吸菸習慣與牙周狀況都會影響評估結果，請在諮詢時主動告知病史與用藥。",
  faq: [
    { q: "植牙會很痛嗎？手術要多久？", a: "<p>植體植入手術在局部麻醉下進行，過程中不會感到疼痛。單顆植牙的手術時間多在一小時內。術後的不適主要是腫脹與輕微痠痛，通常數日內緩解，可依醫師處方使用止痛與消炎藥物。</p>" },
    { q: "植牙總共要花多久時間？", a: "<p>從植入到裝上假牙，一般約需 3 至 6 個月，主要是等待植體與齒槽骨完成整合。若骨量不足需要先補骨或進行鼻竇增高，整體時間會再延長數個月。實際時程依個人骨質條件而定。</p>" },
    { q: "骨頭不夠可以植牙嗎？", a: "<p>多數情況可以，但需要先進行補骨。常見的做法包括齒槽脊增高、引導骨再生與上顎鼻竇增高術。是否需要、用哪一種方式，必須依 3D 斷層的評估結果判斷。</p>" },
    { q: "植牙可以用多久？", a: "<p>植體本身不會蛀牙，但植體周圍的牙齦與齒槽骨仍可能因為清潔不良而發炎，也就是「植體周圍炎」——這是植牙失敗最常見的原因。能用多久，很大程度取決於日常清潔與是否規律回診維護。吸菸會明顯提高失敗風險。</p>" },
    { q: "植牙和牙橋、活動假牙怎麼選？", a: "<p>三者各有適應症。牙橋需要修磨兩側健康鄰牙；活動假牙取戴方便、費用較低但穩定度與咀嚼力通常較弱；植牙不動鄰牙、穩定度佳，但療程長、費用高，且需要足夠的骨頭條件。醫師會依缺牙位置、數量、骨質狀況與你的生活習慣說明各自的差別。</p>" },
    { q: "有糖尿病或在吃骨質疏鬆藥可以植牙嗎？", a: "<p>需要個別評估。血糖控制穩定的糖尿病患者多數仍可植牙，但癒合速度較慢、感染風險較高。部分骨質疏鬆藥物（特別是雙磷酸鹽類與長期注射型）與顎骨壞死風險有關，務必在諮詢時詳實告知所有用藥，必要時會與您的主治醫師聯繫討論。</p>" }
  ],
  ctaTitle: "缺牙拖久了，鄰牙也會跟著受影響",
  ctaText: "先來做一次評估，看看目前的骨頭條件與可行的方案有哪些。"
}));

/* ------------------------------------------------------------ 預約 */
pages.push({
  slug: "booking.html",
  title: "線上預約看診｜台南牙醫 — 60 秒完成預約 — 文心牙醫聯合診所",
  desc: "文心牙醫線上預約系統，選擇療程、挑選時段、填寫資料三步驟完成，24 小時皆可送出。也可透過官方 LINE 或電話 06-2156600 預約。",
  keywords: "台南牙醫預約,線上預約牙醫,台南牙科掛號,文心牙醫預約",
  crumbs: [C.home, { name: "線上預約", url: "booking.html" }],
  scripts: `<script src="assets/js/booking.js" defer></script>`,
  body: `
${pageHead("線上預約", "三個步驟，大概一分鐘", "不用等電話接通，也不必配合上班時間。送出後我們會在門診時間內以電話或 LINE 與你確認。", [C.home, { name: "線上預約", url: "booking.html" }])}

<section class="section">
  <div class="shell">
    <div class="booking">
      <form data-booking novalidate>
        <p class="sr-only" role="status" aria-live="polite" data-live></p>

        <div class="progress" data-progress>
          <div class="progress__track"><div class="progress__fill" data-progress-fill></div></div>
          <div class="progress__steps">
            <span class="progress__step is-active" data-progress-step>1 · 選擇療程</span>
            <span class="progress__step" data-progress-step>2 · 挑選時段</span>
            <span class="progress__step" data-progress-step>3 · 填寫資料</span>
          </div>
        </div>

        <div data-steps>

          <!-- STEP 1 -->
          <section class="step-pane is-active" aria-label="第一步：選擇療程">
            <h2 style="font-size:var(--step-3)">想處理什麼問題？</h2>
            <p class="muted mt-4">選一個最接近的就好，到診後醫師會做完整檢查。</p>

            <fieldset class="field mt-6" style="border:0;padding:0;margin-inline:0" data-require-group="service" data-require-msg="請選擇一個診療項目">
              <legend class="field__label">診療項目<span class="req" aria-hidden="true">*</span></legend>
              <div class="options options--2">
                ${[
                  ["invisalign", "隱適美隱形矯正", "透明牙套，想了解適不適合"],
                  ["ortho", "齒顎矯正", "傳統矯正、兒童矯正評估"],
                  ["implant", "人工植牙", "缺牙想了解植牙"],
                  ["denture", "假牙贋復", "牙橋、全瓷冠、活動假牙"],
                  ["general", "一般牙科／洗牙", "檢查、洗牙、補蛀牙"],
                  ["endo", "牙痛／根管治療", "正在痛，需要盡快處理"],
                  ["perio", "牙周病治療", "刷牙流血、牙齦萎縮"],
                  ["kids", "兒童牙科", "孩子的檢查、塗氟、蛀牙"],
                  ["whitening", "牙齒美白", "診間美白或居家美白"],
                  ["other", "其他／不確定", "先做檢查再討論"]
                ].map(([v, t, d]) => `
                <label class="opt">
                  <input type="radio" name="service" value="${v}">
                  <span class="opt__box"><span class="opt__tick">${ico.check}</span>
                    <span class="opt__text"><strong>${t}</strong><span>${d}</span></span></span>
                </label>`).join("")}
              </div>
              <p class="field__err"></p>
            </fieldset>

            <fieldset class="field" style="border:0;padding:0;margin-inline:0" data-require-group="visit" data-require-msg="請選擇初診或複診">
              <legend class="field__label">是第一次來嗎？<span class="req" aria-hidden="true">*</span></legend>
              <div class="options options--2">
                <label class="opt"><input type="radio" name="visit" value="first">
                  <span class="opt__box"><span class="opt__tick">${ico.check}</span>
                  <span class="opt__text"><strong>初診</strong><span>第一次來文心，請攜帶健保卡</span></span></span></label>
                <label class="opt"><input type="radio" name="visit" value="return">
                  <span class="opt__box"><span class="opt__tick">${ico.check}</span>
                  <span class="opt__text"><strong>複診</strong><span>之前看過診，接續治療或回診</span></span></span></label>
              </div>
              <p class="field__err"></p>
            </fieldset>

            <div class="form-nav">
              <button class="btn btn--primary btn--lg" type="button" data-next>下一步：挑選時段</button>
            </div>
          </section>

          <!-- STEP 2 -->
          <section class="step-pane" aria-label="第二步：挑選時段">
            <h2 style="font-size:var(--step-3)">希望哪一天來？</h2>
            <p class="muted mt-4">以下為一般門診時段。實際看診時間將由櫃檯與你確認後確定。</p>

            <div class="field mt-6" data-require-group="date" data-require-msg="請選擇一個日期">
              <span class="field__label">選擇日期<span class="req" aria-hidden="true">*</span></span>
              <div class="rail" data-date-rail role="radiogroup" aria-label="選擇預約日期"></div>
              <p class="field__err"></p>
            </div>

            <div class="field" data-require-group="time" data-require-msg="請選擇一個時段">
              <span class="field__label">選擇時段<span class="req" aria-hidden="true">*</span></span>
              <div data-slots role="radiogroup" aria-label="選擇預約時段"></div>
              <p class="muted small" data-slots-empty hidden>這一天沒有門診，請選擇其他日期。</p>
              <p class="field__err"></p>
            </div>

            <div class="notice">${ico.info}<p>臨時牙痛需要當天處理，請直接來電 <a href="tel:${TEL}">${TEL_TEXT}</a>，我們會盡量安排加掛。</p></div>

            <div class="form-nav">
              <button class="btn btn--ghost btn--lg" type="button" data-prev>上一步</button>
              <button class="btn btn--primary btn--lg" type="button" data-next>下一步：填寫資料</button>
            </div>
          </section>

          <!-- STEP 3 -->
          <section class="step-pane" aria-label="第三步：填寫資料">
            <h2 style="font-size:var(--step-3)">最後，留個聯絡方式</h2>
            <p class="muted mt-4">我們會在門診時間內與你聯絡確認。</p>

            <div class="summary mt-6">
              <dl>
                <div><dt>診療項目</dt><dd data-sum="service">—</dd></div>
                <div><dt>初診／複診</dt><dd data-sum="visit">—</dd></div>
                <div><dt>希望時段</dt><dd data-sum="when">—</dd></div>
              </dl>
            </div>

            <div class="field mt-6">
              <label class="field__label" for="bk-name">姓名<span class="req" aria-hidden="true">*</span></label>
              <input class="input" id="bk-name" name="name" type="text" autocomplete="name" required placeholder="請填寫真實姓名，以便核對健保卡">
              <p class="field__err"></p>
            </div>

            <div class="field">
              <label class="field__label" for="bk-phone">手機號碼<span class="req" aria-hidden="true">*</span></label>
              <input class="input" id="bk-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" required placeholder="09xxxxxxxx">
              <span class="field__hint">我們會以這支號碼與你確認預約。</span>
              <p class="field__err"></p>
            </div>

            <div class="field">
              <label class="field__label" for="bk-email">Email<span class="muted" style="font-weight:400">（選填）</span></label>
              <input class="input" id="bk-email" name="email" type="email" autocomplete="email" placeholder="example@mail.com">
              <p class="field__err"></p>
            </div>

            <div class="field">
              <label class="field__label" for="bk-note">想先讓醫師知道的事<span class="muted" style="font-weight:400">（選填）</span></label>
              <textarea class="textarea" id="bk-note" name="note" placeholder="例如：右下大臼齒咬到會痛、曾經矯正過、對麻藥會不舒服、怕看牙希望慢慢來⋯⋯"></textarea>
              <span class="field__hint">先告訴我們，醫師可以預留合適的看診時間與說明方式。</span>
            </div>

            <div class="field">
              <label class="opt__box" style="cursor:pointer;align-items:center">
                <input type="checkbox" data-consent style="width:20px;height:20px;accent-color:var(--brand);flex:none">
                <span class="small" style="line-height:1.7">我同意文心牙醫使用上述資料與我聯絡預約事宜，並已閱讀<a href="privacy.html" style="color:var(--brand-deep);text-decoration:underline">隱私權政策</a>。</span>
              </label>
              <p class="field__err"></p>
            </div>

            <div class="form-nav">
              <button class="btn btn--ghost btn--lg" type="button" data-prev>上一步</button>
              <button class="btn btn--primary btn--lg" type="submit" data-submit>送出預約</button>
            </div>
          </section>
        </div>

        <!-- 完成 -->
        <div class="booking-done" data-done hidden>
          <span class="booking-done__mark">${ico.check}</span>
          <h2>預約資料已送出</h2>
          <p class="lede mt-4">你選擇的時段是<br><strong data-done-when></strong></p>
          <p class="muted mt-4">我們會在門診時間內以電話或 LINE 與你確認。<br>為了加快確認速度，建議你把預約內容貼給我們的官方 LINE。</p>

          <div class="summary mt-6" style="text-align:left">
            <p class="small muted" style="margin-bottom:var(--sp-3)">預約內容（已複製到剪貼簿）</p>
            <pre data-copy-target style="white-space:pre-wrap;font:inherit;margin:0"></pre>
          </div>

          <div class="btn-row btn-row--center mt-6">
            <a class="btn btn--line btn--lg" data-line-link href="${LINE}" target="_blank" rel="noopener">${ico.line} 貼到官方 LINE</a>
            <button class="btn btn--ghost btn--lg" type="button" data-copy>再複製一次</button>
          </div>
          <p class="mt-6"><a class="link-arrow" href="index.html">回到首頁 ${ico.arrow}</a></p>
        </div>
      </form>

      <div class="hr"></div>

      <div class="grid grid-2">
        <div class="card" data-reveal>
          <span class="card__icon card__icon--calm">${ico.line}</span>
          <h3 style="font-size:var(--step-2)">用 LINE 直接問</h3>
          <p>想先問問題、傳照片給醫師看，或需要更改已預約的時間，走 LINE 最快。</p>
          <p class="card__foot"><a class="btn btn--line btn--sm" href="${LINE}" target="_blank" rel="noopener">加入官方 LINE</a></p>
        </div>
        <div class="card" data-reveal data-reveal-delay="80">
          <span class="card__icon">${ico.phone}</span>
          <h3 style="font-size:var(--step-2)">臨時牙痛請打電話</h3>
          <p>需要當天處理的急症，電話仍然是最快的方式。門診時間內都有專人接聽。</p>
          <p class="card__foot"><a class="btn btn--primary btn--sm" href="tel:${TEL}">撥打 ${TEL_TEXT}</a></p>
        </div>
      </div>
    </div>
  </div>
</section>
`
});

/* ------------------------------------------------------------ FAQ */
const faqGroups = [
  {
    title: "第一次看診",
    items: [
      { q: "初診需要帶什麼？", a: "<p>請攜帶健保卡。若有慢性病用藥、過去的 X 光片或其他診所的病歷資料，也歡迎一併帶來，有助於醫師判斷。建議提早 5 到 10 分鐘到櫃檯填寫基本資料與病史表。</p>" },
      { q: "第一次看診大概要多久？", a: "<p>初診通常包含口內檢查、必要的 X 光攝影與醫師說明，整體約 30 至 50 分鐘。如果是矯正或植牙諮詢，因為需要較完整的影像與討論，時間會再長一些，建議預留一小時。</p>" },
      { q: "我很怕看牙，可以先說嗎？", a: "<p>非常歡迎，而且請一定要說。預約時或到診時告訴我們，醫師會調整看診的節奏、增加說明與確認的次數，必要時也可以分次進行，不一次做完。過去有不好的看牙經驗，也請直接告訴我們是哪個環節讓你不舒服。</p>" },
      { q: "有健保給付嗎？", a: "<p>一般檢查、洗牙、蛀牙填補、根管治療、拔牙與牙周基本治療等項目多屬健保給付範圍。矯正、植牙、全瓷冠、陶瓷貼片與牙齒美白等則屬自費項目。實際給付範圍依健保署規定，櫃檯會在治療前向你說明。</p>" }
    ]
  },
  {
    title: "預約與門診",
    items: [
      { q: "怎麼預約最快？", a: "<p>三種方式都可以：<a href='booking.html'>線上預約</a>（24 小時皆可送出，約一分鐘完成）、<a href='" + LINE + "' target='_blank' rel='noopener'>官方 LINE</a>（適合同時想問問題）、或來電 <a href='tel:" + TEL + "'>" + TEL_TEXT + "</a>（臨時急症最快）。</p>" },
      { q: "需要改期或取消怎麼辦？", a: "<p>請盡早透過 LINE 或電話告知，讓時段可以留給其他需要的患者。矯正與植牙這類需要預留較長時間的療程，建議至少提前一天通知。</p>" },
      { q: "可以指定醫師嗎？", a: "<p>可以。預約時註明希望由哪一位醫師看診，我們會依該醫師的門診時段安排。矯正相關療程由齒顎矯正專科醫師負責，植牙與全口重建則由院長主持。</p>" },
      { q: "國定假日有看診嗎？", a: "<p>國定假日與連假的門診時間會另行公告，請留意官方 LINE 或 Facebook 的最新公告，或直接來電確認。</p>" }
    ]
  },
  {
    title: "矯正相關",
    items: [
      { q: "成人牙齒矯正前要做哪些檢查？", a: "<p>一般包含口內檢查、環口 X 光、側顱 X 光、齒列模型或 3D 口掃與口內外照片。成人矯正特別需要先確認牙周狀況穩定，才能安全地移動牙齒。</p>" },
      { q: "隱形矯正附件是什麼？會掉嗎？", a: "<p>附件是黏在牙齒表面、顏色接近牙齒的小塊樹脂，用來協助牙套完成旋轉或壓入這類較困難的移動。不會痛，但剛黏上時舌頭會覺得卡。若脫落請聯絡診所重黏，不要放著不處理。</p>" },
      { q: "隱適美跟傳統牙套哪個比較快？", a: "<p>主要取決於齒列狀況的複雜度而非器材本身。單純擁擠兩者差異不大，複雜的骨性問題傳統矯正仍有優勢。隱適美額外受配戴時數影響，每天少戴幾小時療程就會延後。</p>" },
      { q: "矯正費用大概多少？", a: "<p>矯正屬自費項目，費用會因矯正方式、齒列複雜度與療程長度而有明顯差異。我們會在完整評估後提供書面的治療計畫與費用說明，確認你清楚了解之後再決定是否開始。請以實際諮詢後的報價為準。</p>" }
    ]
  },
  {
    title: "植牙與假牙",
    items: [
      { q: "植牙總共要多久？", a: "<p>從植體植入到裝上假牙，一般約 3 至 6 個月，主要是等待骨整合。若需要補骨或鼻竇增高，時間會再延長。</p>" },
      { q: "缺牙不補會怎樣？", a: "<p>缺牙的空間會讓鄰牙逐漸往空隙傾倒、對咬的牙齒往下生長，咬合關係慢慢跑掉。時間久了，不只是補一顆牙的問題，可能需要先用矯正把空間與角度調回來才能進行贋復。此外，該區域的齒槽骨也會隨時間萎縮。</p>" },
      { q: "植牙可以用多久？", a: "<p>植體本身不會蛀牙，但周圍的牙齦與齒槽骨仍可能因清潔不良而發炎（植體周圍炎），這是植牙失敗最常見的原因。能用多久很大程度取決於日常清潔與規律回診維護，吸菸會明顯提高失敗風險。</p>" },
      { q: "牙橋、活動假牙和植牙怎麼選？", a: "<p>牙橋需要修磨兩側健康鄰牙；活動假牙費用較低但穩定度與咀嚼力通常較弱；植牙不動鄰牙、穩定度佳，但療程長、費用高且需足夠骨頭條件。醫師會依缺牙位置、數量、骨質與生活習慣說明差別。</p>" }
    ]
  },
  {
    title: "兒童與日常照護",
    items: [
      { q: "小朋友幾歲適合第一次看牙？", a: "<p>建議在長出第一顆乳牙後、約一歲左右就可以第一次就診，目的是建立習慣與衛教，而非治療。矯正評估則建議在 7 歲左右做一次齒顎發育檢查。</p>" },
      { q: "乳牙蛀牙反正會換，需要治療嗎？", a: "<p>需要。乳牙蛀牙會痛、會影響咀嚼與營養攝取，嚴重時感染可能波及下方正在發育的恆牙牙胚。乳牙也負責替恆牙保留萌發的空間，太早脫落會造成恆牙排列問題。</p>" },
      { q: "多久該洗一次牙？", a: "<p>健保給付一般成人每六個月一次洗牙。若有牙周病史、戴矯正器或牙結石累積較快，醫師可能建議縮短回診間隔。</p>" },
      { q: "刷牙會流血正常嗎？", a: "<p>不正常。刷牙流血通常是牙齦發炎的徵兆，多數與牙菌斑和牙結石堆積有關。早期的牙齦炎在清除牙結石與改善清潔習慣後多可恢復，但若放著不管，可能進展為牙周病並造成齒槽骨流失，那就不可逆了。建議盡早安排檢查。</p>" }
    ]
  }
];

pages.push({
  slug: "faq.html",
  title: "常見問題｜台南牙醫 — 初診、預約、矯正、植牙疑問解答 — 文心牙醫",
  desc: "文心牙醫常見問題整理：初診要帶什麼、怎麼預約最快、健保給付範圍、矯正與植牙的療程與費用、兒童看牙時機與日常口腔照護。由台南文心牙醫醫師團隊整理。",
  keywords: "牙醫常見問題,台南牙醫初診,牙醫預約,矯正費用,植牙時間,乳牙蛀牙,刷牙流血",
  crumbs: [C.home, { name: "常見問題", url: "faq.html" }],
  ld: { "@type": "FAQPage", mainEntity: faqGroups.flatMap(g => g.items).map(f => ({
    "@type": "Question", name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a.replace(/<[^>]+>/g, "") } })) },
  body: `
${pageHead("常見問題", "你可能想問的，我們先寫在這裡", "如果這裡沒有回答到你的問題，直接用 LINE 問我們就好。", [C.home, { name: "常見問題", url: "faq.html" }])}

<section class="section">
  <div class="shell shell--narrow">
    <div class="chips" data-reveal style="margin-bottom:var(--sp-7)">
      ${faqGroups.map((g, i) => `<a class="chip${i === 0 ? " chip--brand" : ""}" href="#g${i}">${g.title}</a>`).join("")}
    </div>

    ${faqGroups.map((g, gi) => `
    <div id="g${gi}" style="margin-bottom:var(--sp-8)" data-reveal>
      <h2 style="font-size:var(--step-3);margin-bottom:var(--sp-4)">${g.title}</h2>
      <div class="accordion">
        ${g.items.map((f, i) => `
        <div class="acc" data-acc>
          <h3 style="margin:0"><button class="acc__btn" type="button" aria-expanded="false" aria-controls="q${gi}-${i}">${f.q}<span class="acc__sign" aria-hidden="true"></span></button></h3>
          <div class="acc__panel" id="q${gi}-${i}"><div class="acc__inner">${f.a}</div></div>
        </div>`).join("")}
      </div>
    </div>`).join("")}

    <div class="notice" data-reveal>${ico.info}<p>本頁內容為一般性的衛教說明，不能取代醫師的臨床診斷。實際的治療方式、療程長度與費用，仍需經過口腔檢查與必要的影像評估後由醫師判斷。</p></div>
  </div>
</section>

${ctaBand("還是有問題想問？", "用 LINE 傳訊息給我們，或直接預約一次檢查與諮詢。")}
`
});

/* ------------------------------------------------------------ 聯絡我們 */
pages.push({
  slug: "contact.html",
  title: "門診時間與交通｜台南市南區大同路二段166號 — 文心牙醫聯合診所",
  desc: "文心牙醫聯合診所位於台南市南區大同路二段166號，電話 06-2156600。門診時間週一至週五早午晚三診 09:00–21:00、週六上午 09:00–12:00。提供交通與停車資訊、Google 地圖導航。",
  keywords: "台南牙醫地址,南區牙醫,大同路牙醫,文心牙醫電話,台南牙醫門診時間",
  crumbs: [C.home, { name: "聯絡我們", url: "contact.html" }],
  body: `
${pageHead("聯絡我們", "台南市南區大同路二段 166 號", "位於大同路二段，鄰近台南火車站與市區主要幹道。開車、騎車或搭公車都方便抵達。", [C.home, { name: "聯絡我們", url: "contact.html" }])}

<section class="section">
  <div class="shell">
    <div class="grid grid-2" style="align-items:start;gap:var(--sp-8)">
      <div data-reveal>
        <p class="eyebrow">聯絡方式</p>
        <h2 class="mt-4">怎麼找到我們</h2>
        <p class="mt-4"><span class="status" data-status><span class="status__dot"></span><span data-status-text>查詢中</span></span></p>

        <dl class="info-list mt-6">
          <div class="info-item">
            <span class="info-item__icon">${ico.pin}</span>
            <div><dt>診所地址</dt><dd>台南市南區大同路二段166號</dd></div>
          </div>
          <div class="info-item">
            <span class="info-item__icon">${ico.phone}</span>
            <div><dt>預約專線</dt><dd><a href="tel:${TEL}">06-2156600</a></dd></div>
          </div>
          <div class="info-item">
            <span class="info-item__icon">${ico.line}</span>
            <div><dt>官方 LINE</dt><dd><a href="${LINE}" target="_blank" rel="noopener">加入好友並傳訊</a></dd></div>
          </div>
          <div class="info-item">
            <span class="info-item__icon">${ico.fb}</span>
            <div><dt>Facebook</dt><dd><a href="${FB}" target="_blank" rel="noopener">文心牙醫粉絲專頁</a></dd></div>
          </div>
        </dl>

        <div class="btn-row mt-6">
          <a class="btn btn--primary" href="booking.html">線上預約看診</a>
          <a class="btn btn--ghost" href="https://www.google.com/maps/search/?api=1&query=${ADDR_Q}" target="_blank" rel="noopener">開啟 Google 導航</a>
        </div>
      </div>

      <div data-reveal data-reveal-delay="90">
        <div class="map-frame">
          <div class="map-frame__fallback">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <p>台南市南區大同路二段166號</p>
              <a class="btn btn--primary btn--sm" href="https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8D%97%E5%B8%82%E5%8D%97%E5%8D%80%E5%A4%A7%E5%90%8C%E8%B7%AF%E4%BA%8C%E6%AE%B5166%E8%99%9F" target="_blank" rel="noopener">在 Google 地圖開啟</a>
            </div>
            <iframe title="文心牙醫聯合診所位置地圖"
            src="https://maps.google.com/maps?q=${ADDR_Q}&output=embed&hl=zh-TW"
            loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section--sunk" id="hours">
  <div class="shell">
    <div class="section-head" data-reveal><p class="eyebrow">門診時間</p><h2>每週看診時段</h2></div>
    <div class="card" data-reveal style="padding:var(--sp-6)">
${hoursTable()}
      <p class="small muted mt-5">國定假日與連假門診時間另行公告。急症請先來電 <a href="tel:${TEL}" style="color:var(--brand-deep)">${TEL_TEXT}</a> 確認。</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="shell">
    <div class="section-head" data-reveal><p class="eyebrow">交通方式</p><h2>開車、騎車或搭車前來</h2></div>
    <div class="grid grid-3">
      <div class="card" data-reveal>
        <span class="card__icon">${ico.car}</span>
        <h3 style="font-size:var(--step-2)">開車</h3>
        <p>診所位於大同路二段上，沿大同路行駛即可抵達。周邊設有路邊停車格，鄰近亦有收費停車場。若停車位不易尋找，可先來電詢問櫃檯當日的建議停車地點。</p>
      </div>
      <div class="card" data-reveal data-reveal-delay="70">
        <span class="card__icon">${ico.pin}</span>
        <h3 style="font-size:var(--step-2)">機車</h3>
        <p>大同路沿線設有機車停車區，診所門口附近即可停放。騎乘機車前來通常是最方便的方式。</p>
      </div>
      <div class="card" data-reveal data-reveal-delay="140">
        <span class="card__icon">${ico.clock}</span>
        <h3 style="font-size:var(--step-2)">大眾運輸</h3>
        <p>自台南火車站搭乘行經大同路的市區公車，於鄰近站牌下車後步行即可抵達。建議出發前以 Google 地圖查詢即時班次與下車站點。</p>
      </div>
    </div>
    <div class="notice mt-7" data-reveal>${ico.info}<p>第一次前來找不到診所或停車位時，歡迎直接撥打 <a href="tel:${TEL}" style="color:var(--brand-deep)">${TEL_TEXT}</a>，櫃檯會為你指引。</p></div>
  </div>
</section>

${ctaBand("準備好要來了嗎？", "線上預約只要一分鐘，我們會在門診時間內與你確認。")}
`
});

/* ------------------------------------------------------------ 隱私權 */
pages.push({
  slug: "privacy.html",
  title: "隱私權政策｜文心牙醫聯合診所",
  desc: "文心牙醫聯合診所隱私權政策，說明我們如何蒐集、處理與利用你在本網站提供的個人資料，以及你所擁有的權利。",
  crumbs: [C.home, { name: "隱私權政策", url: "privacy.html" }],
  body: `
${pageHead("隱私權政策", "隱私權政策", "最後更新日期：2026 年 1 月", [C.home, { name: "隱私權政策", url: "privacy.html" }])}

<section class="section">
  <div class="shell shell--narrow prose" data-reveal>
    <h2>一、適用範圍</h2>
    <p>本政策適用於你在文心牙醫聯合診所網站（${SITE}）上所提供的個人資料，不適用於本網站以外的連結網站，各連結網站有其各自的隱私權政策。</p>

    <h2>二、蒐集的資料與目的</h2>
    <p>我們僅在必要範圍內蒐集下列資料：</p>
    <ul>
      <li><strong>線上預約表單</strong>：姓名、手機號碼、Email（選填）、希望的看診時段、診療項目與你主動填寫的備註。蒐集目的為聯繫並確認你的預約，以及安排合適的看診時間與醫師。</li>
      <li><strong>瀏覽紀錄</strong>：伺服器可能自動記錄 IP 位址、瀏覽器類型與瀏覽頁面等非個人化的統計資料，僅用於改善網站品質。</li>
    </ul>

    <h2>三、資料的利用與保存</h2>
    <p>你提供的預約資料僅由本診所內部人員用於聯絡與預約安排，不會提供、交換、出租或出售給任何第三方，但依法律規定或配合司法機關調查者除外。</p>
    <p>預約資料在完成聯繫與看診安排後，依醫療機構相關規範保存；你也可以隨時要求我們刪除尚未轉為病歷的預約資料。</p>

    <h2>四、你的權利</h2>
    <p>依據《個人資料保護法》，你就本診所保有的個人資料得行使下列權利：查詢或請求閱覽、請求製給複製本、請求補充或更正、請求停止蒐集處理或利用、請求刪除。</p>
    <p>欲行使上述權利，請來電 <a href="tel:${TEL}">${TEL_TEXT}</a> 或透過官方 LINE 與我們聯繫，我們會在確認身分後處理。</p>

    <h2>五、Cookie 與第三方服務</h2>
    <p>本網站使用 Google Fonts 提供字型、並嵌入 Google 地圖以顯示診所位置。這些第三方服務可能依其自身政策蒐集技術性資料，詳情請參閱 Google 的隱私權政策。本網站本身不以 Cookie 進行個人化追蹤或廣告投放。</p>

    <h2>六、資料安全</h2>
    <p>我們以合理的技術與管理措施保護所蒐集的個人資料，避免遭受竊取、竄改、毀損、滅失或洩漏。</p>

    <h2>七、政策修訂</h2>
    <p>本政策如有修訂，將於本網站公告，不另行個別通知。</p>

    <div class="notice mt-7">${ico.info}<p>如對本政策有任何疑問，歡迎來電 <a href="tel:${TEL}" style="color:var(--brand-deep)">${TEL_TEXT}</a> 洽詢。</p></div>
  </div>
</section>
`
});

/* ------------------------------------------------------------ 網站地圖 */
pages.push({
  slug: "sitemap.html",
  title: "網站地圖｜文心牙醫聯合診所",
  desc: "文心牙醫聯合診所網站地圖，快速找到診所介紹、醫師團隊、各項診療項目、常見問題、聯絡資訊與線上預約。",
  crumbs: [C.home, { name: "網站地圖", url: "sitemap.html" }],
  body: `
${pageHead("網站地圖", "網站地圖", "", [C.home, { name: "網站地圖", url: "sitemap.html" }])}

<section class="section">
  <div class="shell">
    <div class="grid grid-3">
      <div class="card" data-reveal>
        <h2 style="font-size:var(--step-2)">關於文心</h2>
        <ul class="footer__links mt-4">
          <li><a href="index.html">首頁</a></li>
          <li><a href="about.html">診所理念</a></li>
          <li><a href="team.html">醫師團隊</a></li>
          <li><a href="contact.html">門診時間與交通</a></li>
        </ul>
      </div>
      <div class="card" data-reveal data-reveal-delay="70">
        <h2 style="font-size:var(--step-2)">診療項目</h2>
        <ul class="footer__links mt-4">
          <li><a href="services.html">全部診療項目</a></li>
          ${services.map(s => `<li><a href="${s.href}">${s.name}</a></li>`).join("")}
        </ul>
      </div>
      <div class="card" data-reveal data-reveal-delay="140">
        <h2 style="font-size:var(--step-2)">預約與其他</h2>
        <ul class="footer__links mt-4">
          <li><a href="booking.html">線上預約</a></li>
          <li><a href="faq.html">常見問題</a></li>
          <li><a href="${LINE}" target="_blank" rel="noopener">官方 LINE</a></li>
          <li><a href="${FB}" target="_blank" rel="noopener">Facebook 粉絲專頁</a></li>
          <li><a href="privacy.html">隱私權政策</a></li>
        </ul>
      </div>
    </div>
  </div>
</section>
`
});

/* ------------------------------------------------------------ 404 */
pages.push({
  slug: "404.html",
  title: "找不到這個頁面｜文心牙醫聯合診所",
  desc: "很抱歉，你要找的頁面不存在或已經移除。",
  noindex: true,
  body: `
<section class="section" style="padding-top:calc(var(--header-h) + var(--sp-9))">
  <div class="shell shell--narrow center">
    <p class="eyebrow eyebrow--center">404</p>
    <h1 class="mt-4">這個頁面找不到了</h1>
    <p class="lede mt-5">可能是網址輸入有誤，或這個頁面已經搬家。<br>你可以從下面幾個地方繼續。</p>
    <div class="btn-row btn-row--center mt-6">
      <a class="btn btn--primary btn--lg" href="index.html">回到首頁</a>
      <a class="btn btn--ghost btn--lg" href="booking.html">線上預約</a>
    </div>
    <div class="chips mt-7" style="justify-content:center">
      <a class="chip" href="services.html">診療項目</a>
      <a class="chip" href="team.html">醫師團隊</a>
      <a class="chip" href="faq.html">常見問題</a>
      <a class="chip" href="contact.html">門診時間與交通</a>
    </div>
  </div>
</section>
`
});

/* ========================================================================
   WRITE
   ======================================================================== */
const out = __dirname;
pages.forEach(p => {
  fs.writeFileSync(path.join(out, p.slug), layout(p), "utf8");
  console.log("✓ " + p.slug);
});

/* sitemap.xml */
const urls = [
  { loc: "/", pri: "1.0", freq: "weekly" },
  { loc: "/booking.html", pri: "0.9", freq: "monthly" },
  { loc: "/service-invisalign.html", pri: "0.9", freq: "monthly" },
  { loc: "/service-orthodontics.html", pri: "0.9", freq: "monthly" },
  { loc: "/service-implant.html", pri: "0.9", freq: "monthly" },
  { loc: "/services.html", pri: "0.8", freq: "monthly" },
  { loc: "/team.html", pri: "0.8", freq: "monthly" },
  { loc: "/about.html", pri: "0.7", freq: "monthly" },
  { loc: "/faq.html", pri: "0.7", freq: "monthly" },
  { loc: "/contact.html", pri: "0.7", freq: "monthly" },
  { loc: "/sitemap.html", pri: "0.3", freq: "yearly" },
  { loc: "/privacy.html", pri: "0.2", freq: "yearly" }
];
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(out, "sitemap.xml"),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join("\n")}
</urlset>
`, "utf8");
console.log("✓ sitemap.xml");

fs.writeFileSync(path.join(out, "robots.txt"),
`User-agent: *
Allow: /
Disallow: /404.html

Sitemap: ${SITE}/sitemap.xml
`, "utf8");
console.log("✓ robots.txt");

console.log("\n完成：共 " + pages.length + " 個頁面。");
