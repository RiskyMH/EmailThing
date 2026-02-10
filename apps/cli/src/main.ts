#!/usr/bin/env bun

import { EmailThingCLI } from "@/api/client";
import { getDB, loadAuth, saveAuth } from "@/utils/config";
import { syncData } from "@/utils/sync";
import { loginScreen } from "@/ui/login";
import { emailListScreen } from "@/ui/email-list";
import { emailViewScreen } from "@/ui/email-view";
import { composeScreen } from "@/ui/compose";
import { mailboxSwitcher } from "@/ui/mailbox-switcher";
import { AnsiCtrl } from "@/ui/renderer";

const usingProcess = (key: string, fn: () => Promise<void> | void) => {
  process.on(key, fn);
  return {
    [Symbol.dispose]() { process.off(key, fn) },
    getValue() { }
  }
}


// Typed route definition for central router
type Route =
  | { route: 'list'; mailboxId: string; restoreId?: string }
  | { route: 'view'; mailboxId: string; emailId: string }
  | { route: 'compose'; mailboxId: string }
  | { route: 'switch'; mailboxId?: string }
  | { route: 'login' }
  | { route: 'quit' };


if (globalThis.routeCache) {
  // clear all event listeners on hot reload to prevent duplicates
  process.removeAllListeners("SIGINT");
  process.stdin.removeAllListeners("data");
}

async function main() {
  const db = getDB();
  const client = new EmailThingCLI();

  let isExiting = false;
  using _ = usingProcess("SIGINT", () => {
    if (isExiting) return;
    isExiting = true;
    process.stdout.write(AnsiCtrl.SHOW_CURSOR + AnsiCtrl.ALT_SCREEN_OFF);
    db.close();
    process.exit(0);
  });

  const auth = loadAuth(db);

  if (!auth) {
    console.log("Welcome to EmailThing CLI!\n");
    const credentials = await loginScreen();

    if (!credentials) {
      console.log("Login cancelled");
      process.exit(0);
    }

    try {
      const loginData = await client.login(
        credentials.username,
        credentials.password
      );
      saveAuth(db, loginData);
      console.log("Login successful!");
    } catch (error) {
      console.error("Login failed:", error);
      process.exit(1);
    }
  } else {
    client.setAuth(auth.token, auth.refreshToken, auth.tokenExpiresAt);
  }

  const mailboxes = db.query("SELECT * FROM mailboxes").all() as any[];

  if (mailboxes.length === 0) {
    await syncData(client, db);
  }

  const mailboxesWithCounts = db
    .query(
      `
    SELECT m.*, COUNT(e.id) as emailCount 
    FROM mailboxes m 
    LEFT JOIN emails e ON m.id = e.mailboxId 
    GROUP BY m.id 
    ORDER BY emailCount DESC
  `
    )
    .all() as any[];

  if (!mailboxesWithCounts.length) {
    console.error("No mailboxes found");
    process.exit(1);
  }

  const defaultMailbox = mailboxesWithCounts[0];
  let currentMailboxId = defaultMailbox.id;

  const backgroundSync = async () => {
    try {
      await syncData(client, db, true);
    } catch (error) { }
  };

  const modifyEmailFn = async (updates: {
    id: string;
    mailboxId: string;
    isRead?: boolean;
    isStarred?: boolean;
  }) => {
    try {
      await client.modifyEmail(updates);
    } catch (error) {
      console.error("Failed to modify email:", error);
    }
  };

  // Run initial sync asynchronously on open (even if mailboxes exist)
  if (mailboxes.length > 0) {
    backgroundSync();
  }

  // Central router dispatcher
  let route: Route = globalThis.routeCache || { route: 'list', mailboxId: currentMailboxId };

  while (route.route !== 'quit') {
    globalThis.routeCache = route; 
    switch (route.route) {
      case 'list': {
        const result = await emailListScreen(
          db,
          route.mailboxId,
          backgroundSync,
          route.restoreId,
          modifyEmailFn
        );
        if (result.action === "quit") {
          route = { route: 'quit' };
        } else if (result.action === "switch") {
          route = { route: 'switch', mailboxId: route.mailboxId };
        } else if (result.action === "compose") {
          route = { route: 'compose', mailboxId: route.mailboxId };
        } else if (result.action === "view" && result.emailId) {
          route = {
            route: 'view',
            mailboxId: route.mailboxId,
            emailId: result.emailId,
          };
        } else {
          route = { route: 'quit' };
        }
        break;
      }
      case 'switch': {
        const newMailboxId = await mailboxSwitcher(db, route.mailboxId!);
        if (newMailboxId === "switch-user") {
          const { clearAuth, resetDB } = await import("@/utils/config");
          clearAuth(db);
          resetDB(db);
          return main();
        } else if (newMailboxId) {
          route = { route: 'list', mailboxId: newMailboxId };
        } else {
          route = { route: 'list', mailboxId: route.mailboxId! };
        }
        break;
      }
      case 'compose': {
        const composeData = await composeScreen();
        if (composeData) {
          try {
            console.log("Sending email...");
            await client.sendDraft({
              draftId: crypto.randomUUID(),
              mailboxId: route.mailboxId,
              body: composeData.body,
              subject: composeData.subject,
              from: defaultMailbox.address,
              to: [{ address: composeData.to }],
            });
            console.log("Email sent!");
            await syncData(client, db);
          } catch (error) {
            console.error("Send failed:", error);
          }
        }
        route = { route: 'list', mailboxId: route.mailboxId };
        break;
      }
      case 'view': {
        const emails = db
          .query(
            "SELECT id FROM emails WHERE mailboxId = ? AND isDeleted = FALSE ORDER BY createdAt DESC"
          )
          .all(route.mailboxId) as Array<{ id: string }>;

        while (route.route === 'view') {
          const idx = emails.findIndex(e => e.id === route.emailId);
          if (idx === -1) break;
          const currentEmail = emails[idx];

          const viewResult = await emailViewScreen(
            db,
            route.mailboxId,
            currentEmail.id,
            modifyEmailFn
          );

          if (viewResult === "quit") {
            route = { route: 'quit' };
          } else if (viewResult === "back") {
            route = { route: 'list', mailboxId: route.mailboxId, restoreId: currentEmail.id };
          } else if (
            viewResult === "next" &&
            idx < emails.length - 1
          ) {
            route = { route: 'view', mailboxId: route.mailboxId, emailId: emails[idx + 1].id };
          } else if (viewResult === "prev" && idx > 0) {
            route = { route: 'view', mailboxId: route.mailboxId, emailId: emails[idx - 1].id };
          } else {
            route = { route: 'list', mailboxId: route.mailboxId, restoreId: currentEmail.id };
          }
        }
        break;
      }
      case 'quit':
      default: {
        route = { route: 'quit' };
        break;
      }
    }
  }


  process.stdout.write(`${AnsiCtrl.SHOW_CURSOR}${AnsiCtrl.ALT_SCREEN_OFF}`);
  console.log("Goodbye!");
  db.close();
  process.exit(0);
}

main().catch((error) => {
  process.stdout.write(`${AnsiCtrl.SHOW_CURSOR}${AnsiCtrl.ALT_SCREEN_OFF}`);
  console.error("Fatal error:", error);
  process.exit(1);
});
