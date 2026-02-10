import { describe, test, expect } from "bun:test";
import { initDB } from "./schema";

const TEST_DB = ":memory:";

describe("Database Schema", () => {
  test("should initialize database with all tables", () => {
    const db = initDB(TEST_DB);
    
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map((t: any) => t.name);
    
    expect(tableNames).toContain("auth");
    expect(tableNames).toContain("emails");
    expect(tableNames).toContain("mailboxes");
    expect(tableNames).toContain("categories");
    expect(tableNames).toContain("drafts");
    
    db.close();
  });

  test("should create proper indexes", () => {
    const db = initDB(TEST_DB);
    
    const indexes = db.query("SELECT name FROM sqlite_master WHERE type='index'").all();
    const indexNames = indexes.map((i: any) => i.name);
    
    expect(indexNames).toContain("idx_emails_mailbox");
    expect(indexNames).toContain("idx_emails_created");
    expect(indexNames).toContain("idx_categories_mailbox");
    
    db.close();
  });

  test("should allow inserting auth data", () => {
    const db = initDB(TEST_DB);
    
    db.run(`
      INSERT INTO auth (id, token, refreshToken, tokenExpiresAt, refreshTokenExpiresAt, userId, mailboxes)
      VALUES (1, 'token', 'refresh', '2025-12-31', '2025-12-31', 'user1', '["mb1"]')
    `);
    
    const auth = db.query("SELECT * FROM auth WHERE id = 1").get();
    expect(auth).toBeDefined();
    expect((auth as any).token).toBe("token");
    
    // Use Bun.deepEquals for deep comparison
    const expected = { token: "token" };
    expect(Bun.deepEquals({ token: (auth as any).token }, expected)).toBe(true);
    
    db.close();
  });

  test("should have sync_state table", () => {
    const db = initDB(TEST_DB);
    
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map((t: any) => t.name);
    
    expect(tableNames).toContain("sync_state");
    
    db.close();
  });

  test("should allow inserting sync state", () => {
    const db = initDB(TEST_DB);
    
    db.run("INSERT INTO sync_state (id, lastSync) VALUES (1, '2025-10-06T00:00:00.000Z')");
    
    const syncState = db.query("SELECT * FROM sync_state WHERE id = 1").get();
    expect(syncState).toBeDefined();
    expect((syncState as any).lastSync).toBe("2025-10-06T00:00:00.000Z");
    
    db.close();
  });

  test("should enforce single sync_state row", () => {
    const db = initDB(TEST_DB);
    
    db.run("INSERT INTO sync_state (id, lastSync) VALUES (1, '2025-10-06T00:00:00.000Z')");
    
    // Second insert with id=1 should fail or replace
    db.run("INSERT OR REPLACE INTO sync_state (id, lastSync) VALUES (1, '2025-10-07T00:00:00.000Z')");
    
    const count = db.query("SELECT COUNT(*) as count FROM sync_state").get() as any;
    expect(count.count).toBe(1);
    
    const syncState = db.query("SELECT * FROM sync_state WHERE id = 1").get() as any;
    expect(syncState.lastSync).toBe("2025-10-07T00:00:00.000Z");
    
    db.close();
  });

  test("should support email categoryId column", () => {
    const db = initDB(TEST_DB);
    
    // Check that emails table has categoryId column
    const columns = db.query("PRAGMA table_info(emails)").all() as any[];
    const columnNames = columns.map(c => c.name);
    
    expect(columnNames).toContain("categoryId");
    
    db.close();
  });
});
