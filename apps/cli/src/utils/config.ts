import { join } from "node:path";
import { homedir } from "node:os";
import { existsSync, mkdirSync } from "node:fs";
import type { Database } from "bun:sqlite";
import { initDB } from "@/db/schema";

export const CONFIG_DIR = join(homedir(), ".emailthing");
export const DB_PATH = join(CONFIG_DIR, "data.db");

export function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getDB(): Database {
  ensureConfigDir();
  return initDB(DB_PATH);
}

export function loadAuth(db: Database) {
  const auth = db.query("SELECT * FROM auth WHERE id = 1").get() as any;
  return auth ? {
    token: auth.token,
    refreshToken: auth.refreshToken,
    tokenExpiresAt: auth.tokenExpiresAt,
    refreshTokenExpiresAt: auth.refreshTokenExpiresAt,
    userId: auth.userId,
    mailboxes: JSON.parse(auth.mailboxes),
  } : null;
}

export function saveAuth(db: Database, auth: {
  token: string;
  refreshToken: string;
  tokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  userId: string;
  mailboxes: string[];
}) {
  db.run(`
    INSERT OR REPLACE INTO auth (id, token, refreshToken, tokenExpiresAt, refreshTokenExpiresAt, userId, mailboxes)
    VALUES (1, ?, ?, ?, ?, ?, ?)
  `, [
    auth.token,
    auth.refreshToken,
    auth.tokenExpiresAt,
    auth.refreshTokenExpiresAt,
    auth.userId,
    JSON.stringify(auth.mailboxes),
  ]);
}

export function clearAuth(db: Database) {
  db.run("DELETE FROM auth WHERE id = 1");
}

export function resetDB(db: Database) {
  db.run("DELETE FROM auth");
  db.run("DELETE FROM emails");
  db.run("DELETE FROM mailboxes");
  db.run("DELETE FROM categories");
  db.run("DELETE FROM drafts");
  db.run("DELETE FROM mailbox_aliases");
  db.run("DELETE FROM sync_state");
}