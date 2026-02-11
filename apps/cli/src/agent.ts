#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { EmailThingCLI } from "@/api/client";
import { getDB, loadAuth } from "@/utils/config";
import { syncData } from "@/utils/sync";

async function main() {
    // Stage 1: Global options & subcommand detection
    const { values: globalValues, positionals: rootPositionals } = parseArgs({
        options: {
            help: { type: "boolean", short: "h", default: false },
            sync: { type: "boolean", default: false },
        },
        allowPositionals: true,
        strict: false,
        allowNegative: true,
    });
    const agentIndex = rootPositionals.findIndex(arg => arg === "--agent" || arg === "agent");
    const subcmd = rootPositionals[agentIndex + 1];
    const subcmdArgs = rootPositionals.slice(agentIndex + 2);

    // Stage 2: Subcommand-specific option parsing

    // Show help if global help or no valid subcommand
    if (globalValues.help || !subcmd || !["list", "email", "sync"].includes(subcmd)) {
        const nowIso = new Date().toISOString();
        console.log(`
EmailThing CLI - Agent Mode

AI-friendly command-line interface for email automation.

Usage:
  bunx @emailthing/cli agent <subcommand> [options]

Subcommands:
  list          List recent emails (default: 25)
  email <id>    Show full email by ID (body, etc)
  sync          Force fresh sync from server

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

agent list [filters]:
  --unread          Show only unread emails
  --read            Show only read emails
  --starred         Show only starred emails
  --from=<email>    Filter by sender
  --subject=<text>  Search subject only
  --search=<query>  Search subject, from, and body
  --categoryid=<id> Filter by category
  --before=<date>   Emails before ISO date
  --after=<date>    Emails after ISO date
  --limit=<n>       Number of emails to return (default: 25)
  --offset=<n>      Skip first N emails (pagination)
  --json            Output as JSON (default: plain text)
  --count           Only show count of matching emails
  --fields=a,b,c    Show only specific fields (id,from,subject,date,snippet)
  --sync            Force a sync of emails before listing (recommended if new mail expected)

agent email <id>:
  --json            Output complete email as JSON
  --fields=a,b,c    Show only those fields
  --sync            Force sync before showing email details

agent sync:
  Triggers sync with server to update local cache
  (No other options needed)

Global Options:
  -h, --help        Show this help message
  --sync            Force fresh sync before any subcommand

Examples:
  bunx @emailthing/cli agent list --unread --limit=10 --sync
  bunx @emailthing/cli agent email abc123xyz789example456id --json --sync
  bunx @emailthing/cli agent sync

Output Format:
  List mode:
    Email 1:
      ID: abc123           # Use this ID with 'agent email <id>'
      From: sender@example.com
      Subject: Your 2FA code
      Date: ${nowIso}
      Read: No
      Category: Security (cat123)
      Snippet: Your code is 123456...
  Detail mode:
    Email Details:
      ID: abc123
      From: sender@example.com
      To: you@example.com
      CC: (none)
      Subject: Your 2FA code
      Date: ${nowIso}
      Read: Yes
      Starred: No
      Body:
        Your verification code is: 123456
        This code expires in 10 minutes.
`);
        process.exit(0);
    }

    // Start setup
    const db = getDB();
    const client = new EmailThingCLI();

    const auth = loadAuth(db);

    if (!auth) {
        console.error("Error: Not authenticated. Please run the CLI first to login.");
        process.exit(1);
    }

    client.setAuth(auth.token, auth.refreshToken, auth.tokenExpiresAt);

    // Check if we need to sync (if last sync was > 10 minutes ago or --sync flag)
    const syncState = db
        .query("SELECT lastSync FROM sync_state WHERE id = 1")
        .get() as { lastSync: string | null } | undefined;
    const lastSyncTime = syncState?.lastSync
        ? new Date(syncState.lastSync).getTime()
        : 0;
    const TEN_MINUTES_MS = 600000;
    const tenMinutesAgo = Date.now() - TEN_MINUTES_MS;

    if (globalValues.sync || lastSyncTime < tenMinutesAgo) {
        try {
            await syncData(client, db, false);
        } catch (error) {
            console.error("Sync failed:", error instanceof Error ? error.message : error);
            console.error("Showing stale cached data...");
            // Continue anyway to show cached data
        }
    }

    // Command routing
    if (subcmd === "sync") {
        // Only sync, then exit
        const db = getDB();
        const client = new EmailThingCLI();
        const auth = loadAuth(db);
        if (!auth) {
            console.error("Error: Not authenticated. Please run the CLI first to login.");
            process.exit(1);
        }
        client.setAuth(auth.token, auth.refreshToken, auth.tokenExpiresAt);
        await syncData(client, db, false);
        console.log("Sync complete. Local cache updated.");
        db.close();
        process.exit(0);
    }

    if (subcmd === "email") {
        // agent email <id> [flags]
        const parseResult = parseArgs({
            options: {
                json: { type: "boolean", default: false },
                fields: { type: "string" },
                sync: { type: "boolean", default: false },
            },
            // args: subcmdArgs,
            allowPositionals: true,
            strict: true,
            allowNegative: true,
        });
        const values = { ...parseResult.values };
        const positionals = parseResult.positionals;
        const emailId = positionals[positionals.findIndex(arg => arg === "email") + 1];
        const syncFlag = globalValues.sync || values.sync;
        const db = getDB();
        const client = new EmailThingCLI();
        const auth = loadAuth(db);
        if (!auth) {
            console.error("Error: Not authenticated. Please run the CLI first to login.");
            process.exit(1);
        }
        client.setAuth(auth.token, auth.refreshToken, auth.tokenExpiresAt);
        if (syncFlag) {
            await syncData(client, db, false);
        }
        if (!emailId) {
            console.error("Error: You must provide an email ID.\nUsage: bunx @emailthing/cli agent email <id>");
            process.exit(1);
        }
        const jsonOutput = values.json;
        const fields = values.fields ? values.fields.split(",") : undefined;
        const email = db.query(`
          SELECT
            e.*,
            c.name as categoryName
          FROM emails e
            LEFT JOIN categories c
              ON e.categoryId = c.id AND c.isDeleted = 0
          WHERE e.id = ?
        `).get(emailId) as any;
        if (!email) {
            console.error(`Error: Email ${emailId} not found`);
            process.exit(1);
        }
        if (jsonOutput) {
            const emailData = {
                id: email.id,
                mailboxId: email.mailboxId,
                mailboxAddress: email.mailboxAddress,
                from: email.from_addr,
                to: email.to_addr,
                cc: email.cc,
                bcc: email.bcc,
                replyTo: email.replyTo,
                subject: email.subject,
                body: email.body,
                html: email.html,
                snippet: email.snippet,
                isRead: email.isRead === 1,
                isStarred: email.isStarred === 1,
                createdAt: email.createdAt,
                categoryId: email.categoryId,
                categoryName: email.categoryName,
                headers: email.headers ? JSON.parse(email.headers) : null,
            };
            let output = emailData;
            if (fields) {
                output = fields.reduce((acc, f) => {
                    if (f in emailData) acc[f] = (emailData as Record<string, any>)[f];
                    return acc;
                }, {} as any);
            }
            console.log(JSON.stringify(output, null, 2));
        } else {
            let lines = [
                `Email Details:`,
                `  ID: ${email.id}`,
                `  From: ${email.from_addr}`,
                `  To: ${email.to_addr}`,
                `  CC: ${email.cc || "(none)"}`,
                `  Subject: ${email.subject || "(no subject)"}`,
                `  Date: ${email.createdAt}`,
                `  Read: ${email.isRead === 1 ? "Yes" : "No"}`,
                `  Starred: ${email.isStarred === 1 ? "Yes" : "No"}`,
                email.categoryName ? `  Category: ${email.categoryName} (${email.categoryId})` :
                    "",
                `  Body:`,
            ];
            const body = ((email.body || email.html || "(empty)") as string).split("\n").map(line => "    " + line).join("\n");
            lines.push(body);
            if (fields) {
                lines = [`Email Details:`];
                fields.forEach(f => {
                    if (f === "body") lines.push(`Body:\n${body}`);
                    else if (f in email) lines.push(`  ${f}: ${(email as Record<string, any>)[f]}`);
                });
            }
            console.log(lines.join("\n"));
        }
        db.close();
        return;
    }

    if (subcmd === "list") {
        // agent list [flags]
        const parseResult = parseArgs({
            options: {
                unread: { type: "boolean" },
                read: { type: "boolean" },
                starred: { type: "boolean" },
                from: { type: "string" },
                subject: { type: "string" },
                search: { type: "string" },
                categoryid: { type: "string" },
                before: { type: "string" },
                after: { type: "string" },
                limit: { type: "string", default: "25" },
                offset: { type: "string", default: "0" },
                json: { type: "boolean", default: false },
                count: { type: "boolean", default: false },
                fields: { type: "string" },
                sync: { type: "boolean", default: false },
            },
            // args: subcmdArgs,
            allowPositionals: true,
            strict: true,
            allowNegative: true,
        });
        const values = { ...parseResult.values };

        const db = getDB();
        const client = new EmailThingCLI();
        const auth = loadAuth(db);
        if (!auth) {
            console.error("Error: Not authenticated. Please run the CLI first to login.");
            process.exit(1);
        }
        client.setAuth(auth.token, auth.refreshToken, auth.tokenExpiresAt);
        const limit = values.limit ? parseInt(values.limit) : 25;
        const offset = values.offset ? parseInt(values.offset) : 0;
        const fields = values.fields ? values.fields.split(",") : undefined;
        let query = `
          SELECT
        e.id,
        e.subject,
        e.from_addr,
        e.snippet,
        e.isRead,
        e.isStarred,
        e.createdAt,
        e.categoryId,
        c.name as categoryName
          FROM emails e
            LEFT JOIN categories c
                ON e.categoryId = c.id AND c.isDeleted = 0
          WHERE 1=1
        `;
        const extraFilters = { query: "", params: [] as string[] };
        const params: any[] = [];
        if (values.before) {
            extraFilters.query += ` AND e.createdAt < ?`;
            extraFilters.params.push(values.before);
        }
        if (values.after) {
            extraFilters.query += ` AND e.createdAt > ?`;
            extraFilters.params.push(values.after);
        }
        if (values.search) {
            extraFilters.query += ` AND (e.subject LIKE ? OR e.from_addr LIKE ? OR e.body LIKE ?)`;
            const searchPattern = `%${values.search}%`;
            extraFilters.params.push(searchPattern, searchPattern, searchPattern);
        }
        if (values.categoryid) {
            extraFilters.query += ` AND e.categoryId = ?`;
            extraFilters.params.push(values.categoryid);
        }
        if (values.unread !== undefined) {
            extraFilters.query += ` AND e.isRead = 0`;
        }
        if (values.read !== undefined) {
            extraFilters.query += ` AND e.isRead = 1`;
        }
        if (values.starred !== undefined) {
            extraFilters.query += ` AND e.isStarred = 1`;
        }
        if (values.from) {
            extraFilters.query += ` AND e.from_addr LIKE ?`;
            extraFilters.params.push(`%${values.from}%`);
        }
        if (values.subject) {
            extraFilters.query += ` AND e.subject LIKE ?`;
            extraFilters.params.push(`%${values.subject}%`);
        }
        query += extraFilters.query;
        params.push(...extraFilters.params);
        query += ` ORDER BY e.createdAt DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        const emails = db.query(query).all(...params) as any[];
        // Get total count for pagination info
        let countQuery = `SELECT COUNT(*) as total FROM emails e WHERE 1=1`;
        countQuery += extraFilters.query;
        const totalResult = db.query(countQuery).get(...extraFilters.params) as { total: number; };
        const totalPages = Math.ceil(totalResult.total / limit);
        const currentPage = Math.floor(offset / limit) + 1;
        const hasMore = offset + emails.length < totalResult.total;
        if (values.count) {
            if (values.json) {
                console.log(JSON.stringify({ count: totalResult.total }));
            } else {
                console.log(totalResult.total);
            }
            db.close();
            return;
        }
        if (values.json) {
            const emailsData = emails.map((e) => {
                const baseEmail: any = {
                    id: e.id,
                    from: e.from_addr,
                    subject: e.subject,
                    date: e.createdAt,
                    isRead: e.isRead === 1,
                    isStarred: e.isStarred === 1,
                    snippet: e.snippet,
                };
                if (e.categoryName) {
                    baseEmail.category = { id: e.categoryId, name: e.categoryName };
                }
                if (fields) {
                    const filtered: any = {};
                    fields.forEach((field) => {
                        if (field in baseEmail) filtered[field] = baseEmail[field];
                    });
                    return filtered;
                }
                return baseEmail;
            });
            console.log(JSON.stringify({
                count: emails.length,
                total: totalResult.total,
                limit,
                offset,
                hasMore,
                emails: emailsData,
            }, null, 2));
            db.close();
            return;
        }
        const aliases = db.query(`SELECT * FROM mailbox_aliases WHERE \`default\` = 1 AND isDeleted = 0`).all() as any[];
        console.log(`Email List:\n\nFor mailboxes: ${aliases.map((a) => a.alias).join(", ")} (default aliases)\n\nShowing ${emails.length} of ${totalResult.total} emails (page ${currentPage}/${totalPages})\n${hasMore ? `Next page: --offset=${offset + limit} --limit=${limit}` : "No more emails"}\n`);

        emails.forEach((email, idx) => {
            const absoluteNumber = offset + idx + 1;
            if (fields) {
                const output = [`Email ${absoluteNumber}:`];
                if (fields.includes("id")) output.push(`  ID: ${email.id}`);
                if (fields.includes("from")) output.push(`  From: ${email.from_addr}`);
                if (fields.includes("subject")) output.push(`  Subject: ${email.subject || "(no subject)"}`);
                if (fields.includes("date")) output.push(`  Date: ${email.createdAt}`);
                if (fields.includes("snippet")) output.push(`  Snippet: ${email.snippet?.replaceAll("\n", " ")?.trim() || "(no preview)"}`);
                console.log(output.join("\n") + "\n");
                return;
            }
            const categoryInfo = email.categoryName ? `\n  Category: ${email.categoryName} (${email.categoryId})` : "";
            console.log(`Email ${absoluteNumber}:\n  ID: ${email.id}\n  From: ${email.from_addr}\n  Subject: ${email.subject || "(no subject)"}\n  Date: ${email.createdAt}\n  Read: ${email.isRead === 1 ? "Yes" : "No"}\n  Starred: ${email.isStarred === 1 ? "Yes" : "No"}${categoryInfo}\n  Snippet: ${email.snippet?.replaceAll("\n", " ")?.trim() || "(no preview)"}\n\n`);
        });
        db.close();
        return;
    }
}

main().catch((error) => {
    console.error("Error:", error.message, error instanceof Error ? error.stack : error);
    process.exit(1);
});
