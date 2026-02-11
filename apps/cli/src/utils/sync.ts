import type { EmailThingCLI } from "@/api/client";
import type { Database } from "bun:sqlite";

export async function syncData(client: EmailThingCLI, db: Database, silent = false) {
  if (!silent) console.error("Syncing...");
  
  try {
    const syncState = db.query("SELECT lastSync FROM sync_state WHERE id = 1").get() as { lastSync: string | null } | undefined;
    const lastSync = syncState?.lastSync;
    
    if (!silent) console.error(`Fetching from server (lastSync: ${lastSync || 'none'})...`);
    const fetchStart = Date.now();
    const syncData = await client.sync(lastSync || undefined, false);
    const fetchTime = Date.now() - fetchStart;
    if (!silent) {
      console.error(`Got ${syncData.emails.length} emails from server (fetch took ${fetchTime}ms)`);
    }

    if (!lastSync) {
      if (!silent) console.error("Clearing old data...");
      db.run("DELETE FROM emails");
      db.run("DELETE FROM mailboxes");
      db.run("DELETE FROM categories");
      db.run("DELETE FROM drafts");
    }

    const dbStart = Date.now();
    db.run("BEGIN TRANSACTION");

    if (!silent) console.error("Inserting emails...");
    const emailStmt = db.prepare(`
      INSERT OR REPLACE INTO emails (id, mailboxId, subject, from_addr, to_addr, cc, bcc, replyTo, body, html, snippet, isRead, isStarred, createdAt, headers, categoryId, isDeleted, isSender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const email of syncData.emails) {
      const from = email.sender?.address || "";
      const to = email.recipients?.[0]?.address || "";
      const cc = email.recipients?.filter((r: any) => r.cc).map((r: any) => r.address).join(", ") || null;
      
      emailStmt.run(
        email.id,
        email.mailboxId,
        email.subject || null,
        from,
        to,
        cc,
        email.bcc || null,
        email.replyTo || null,
        email.body || null,
        email.html || null,
        email.snippet || null,
        !!email.isRead ? true : false,
        !!email.isStarred ? true : false,
        email.createdAt,
        email.headers ? JSON.stringify(email.headers) : null,
        email.categoryId || null,
        email.isDeleted ? true : false,
        email.isSender ? true : false
      );
    }

    if (!silent) console.error("Inserting mailboxes...");
    const mailboxStmt = db.prepare(`
      INSERT OR REPLACE INTO mailboxes (id, isDeleted)
      VALUES (?, ?)
    `);
    
    for (const mailbox of syncData.mailboxes) {
      mailboxStmt.run(
        mailbox.id,
        mailbox.isDeleted ? true : false
      );
    }

    if (!silent) console.error("Inserting categories...");
    const categoryStmt = db.prepare(`
      INSERT OR REPLACE INTO categories (id, mailboxId, name, color, order_num, isDeleted)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const category of syncData.mailboxCategories) {
      categoryStmt.run(
        category.id,
        category.mailboxId,
        category.name,
        category.color || null,
        category.order || 0,
        category.isDeleted ? true : false
      );
    }

    if (!silent) console.error("Inserting mailbox aliases...");
    const aliasStmt = db.prepare(`
      INSERT OR REPLACE INTO mailbox_aliases (id, mailboxId, alias, name, createdAt, updatedAt, "default", isDeleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const alias of syncData.mailboxAliases || []) {
      aliasStmt.run(
        alias.id,
        alias.mailboxId,
        alias.alias,
        alias.name || null,
        alias.createdAt,
        alias.updatedAt,
        alias.default ? true : false,
        alias.isDeleted ? true : false
      );
    }

    db.run("COMMIT");
    const dbTime = Date.now() - dbStart;

    if (syncData.time) {
      db.run("INSERT OR REPLACE INTO sync_state (id, lastSync) VALUES (1, ?)", [syncData.time]);
      if (!silent) {
        console.error(`Synced ${syncData.emails.length} emails, ${syncData.mailboxes.length} mailboxes, ${syncData.mailboxCategories.length} categories (DB took ${dbTime}ms)`);
        console.error(`New lastSync saved: ${syncData.time}`);
      }
    } else {
      if (!silent) {
        console.error(`Synced ${syncData.emails.length} emails, ${syncData.mailboxes.length} mailboxes, ${syncData.mailboxCategories.length} categories (DB took ${dbTime}ms)`);
        console.error(`WARNING: API did not return 'time' field - lastSync not updated!`);
      }
    }
  } catch (error) {
    if (!silent) {
      console.error("Sync failed:", error);
    }
    throw error;
  }
}
