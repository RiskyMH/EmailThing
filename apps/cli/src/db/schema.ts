import { Database } from "bun:sqlite";

export interface AuthData {
  token: string;
  refreshToken: string;
  tokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  userId: string;
  mailboxes: string;
}

export interface Email {
  id: string;
  mailboxId: string;
  subject: string | null;
  from: string;
  to: string;
  cc: string | null;
  bcc: string | null;
  replyTo: string | null;
  body: string | null;
  html: string | null;
  snippet: string | null;
  isRead: boolean;
  isStarred: boolean;
  createdAt: string;
  headers: string | null;
  raw: string | null;
  isDeleted?: number;
  categoryId?: string | null;
}

export interface Mailbox {
  id: string;
  isDeleted?: boolean;
}

export interface Category {
  id: string;
  mailboxId: string;
  name: string;
  color: string | null;
  order: number;
  isDeleted?: boolean;
}

export interface Draft {
  id: string;
  mailboxId: string;
  subject: string | null;
  body: string | null;
  html: string | null;
  to: string | null;
  cc: string | null;
  bcc: string | null;
  from: string | null;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface MailboxAlias {
  id: string;
  mailboxId: string;
  alias: string;
  name?: string | null;
  createdAt: string;
  updatedAt: string;
  default: boolean;
  isDeleted?: boolean;
}

export function initDB(dbPath: string) {
  const db = new Database(dbPath);
  db.run("PRAGMA journal_mode = WAL;");

  const userVersion = db.query("PRAGMA user_version").get() as { user_version: number };
  const currentVersion = userVersion.user_version;

  db.run(`
    CREATE TABLE IF NOT EXISTS auth (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      token TEXT NOT NULL,
      refreshToken TEXT NOT NULL,
      tokenExpiresAt TEXT NOT NULL,
      refreshTokenExpiresAt TEXT NOT NULL,
      userId TEXT NOT NULL,
      mailboxes TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      mailboxId TEXT NOT NULL,
      subject TEXT,
      from_addr TEXT,
      to_addr TEXT,
      cc TEXT,
      bcc TEXT,
      replyTo TEXT,
      body TEXT,
      html TEXT,
      snippet TEXT,
      isRead BOOLEAN DEFAULT FALSE,
      isStarred BOOLEAN DEFAULT FALSE,
      createdAt TEXT NOT NULL,
      headers TEXT,
      raw TEXT,
      categoryId TEXT,
      isDeleted BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS mailboxes (
      id TEXT PRIMARY KEY,
      isDeleted BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      mailboxId TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      order_num INTEGER DEFAULT 0,
      isDeleted BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      mailboxId TEXT NOT NULL,
      subject TEXT,
      body TEXT,
      html TEXT,
      to_addr TEXT,
      cc TEXT,
      bcc TEXT,
      from_addr TEXT,
      updatedAt TEXT NOT NULL,
      isDeleted BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS mailbox_aliases (
      id TEXT PRIMARY KEY,
      mailboxId TEXT NOT NULL,
      alias TEXT NOT NULL,
      name TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      "default" BOOLEAN DEFAULT FALSE,
      isDeleted BOOLEAN DEFAULT FALSE
    );
    CREATE INDEX IF NOT EXISTS idx_aliases_mailboxId ON mailbox_aliases(mailboxId);

    CREATE TABLE IF NOT EXISTS sync_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      lastSync TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_emails_mailbox ON emails(mailboxId);
    CREATE INDEX IF NOT EXISTS idx_emails_created ON emails(createdAt);
    CREATE INDEX IF NOT EXISTS idx_categories_mailbox ON categories(mailboxId);
  `);

  if (currentVersion < 1) {
    try {
      db.run("ALTER TABLE emails ADD COLUMN categoryId TEXT");
    } catch (e) {
    }
    db.run("PRAGMA user_version = 1");
  }

  return db;
}
