-- 文心牙醫官網｜初始結構
-- 內容以 D1 為主，每日匯出 JSON 回 GitHub 當備份。

-- ── 後台帳號 ──────────────────────────────────────────────────────────
-- 一組共用帳號即可；之後要分權限再加 role 欄位。
CREATE TABLE admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,          -- pbkdf2$100000$salt$hash
  display_name  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- 登入失敗記錄，用來擋暴力破解
CREATE TABLE login_attempts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT NOT NULL,
  ip         TEXT,
  ok         INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_login_attempts ON login_attempts (username, created_at);

-- ── 文章 ──────────────────────────────────────────────────────────────
-- kind: knowledge（牙齒知識）/ news（最新消息）
CREATE TABLE articles (
  slug        TEXT PRIMARY KEY,
  kind        TEXT NOT NULL DEFAULT 'knowledge',
  cat         TEXT NOT NULL,
  title       TEXT NOT NULL,
  seo_title   TEXT,
  description TEXT,
  date        TEXT NOT NULL,            -- YYYY-MM-DD
  body        TEXT NOT NULL,            -- HTML 或 Markdown，由 render 判斷
  old_path    TEXT,                     -- 舊站路徑，產生 301 對應用
  published   INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_articles_kind_date ON articles (kind, date DESC);
CREATE INDEX idx_articles_cat ON articles (cat);

-- ── 醫師 ──────────────────────────────────────────────────────────────
CREATE TABLE doctors (
  slug       TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 9,
  name       TEXT NOT NULL,
  badge      TEXT,
  role       TEXT,
  photo      TEXT,
  spec       TEXT,
  intro      TEXT,
  creds      TEXT NOT NULL DEFAULT '[]',  -- JSON: [{group, items[]}]
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 網站設定 ───────────────────────────────────────────────────────────
-- key: clinic / schedule / banners / seo，value 直接存 JSON 字串，
-- 與目前 content/settings/*.json 的結構一致，搬遷與回復都單純。
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 上傳的圖片（實體放 R2，這裡只記索引）────────────────────────────────
CREATE TABLE media (
  key         TEXT PRIMARY KEY,         -- R2 物件 key，等同網址路徑
  filename    TEXT NOT NULL,
  content_type TEXT,
  size        INTEGER,
  width       INTEGER,
  height      INTEGER,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 異動稽核 ───────────────────────────────────────────────────────────
-- 離開 Git 之後就沒有 commit 紀錄了，改用這張表記錄誰在何時改了什麼。
CREATE TABLE audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  action     TEXT NOT NULL,             -- create / update / delete
  entity     TEXT NOT NULL,             -- article / doctor / setting / media
  entity_id  TEXT,
  summary    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_audit_created ON audit_log (created_at DESC);
