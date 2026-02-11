import { TerminalRenderer, colors, truncate, formatDate, Key, readKeys } from "./renderer";
import { AnsiFg } from "@/utils/colors";
import type { Database } from "bun:sqlite";

interface Email {
  id: string;
  subject: string | null;
  from_addr: string;
  snippet: string | null;
  isRead: boolean;
  isStarred: boolean;
  createdAt: string;
  categoryId: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface EmailListState {
  emails: Email[];
  categories: Map<string, Category>;
  selectedEmailId: string | null;
  scrollOffset: number;
  mailboxName: string;
  syncDots: number;
}

export async function emailListScreen(
  db: Database,
  mailboxId: string,
  syncCallback: (() => Promise<void>) | null = null,
  restoreId?: string,
  modifyEmail?: (updates: { id: string; mailboxId: string; isRead?: boolean; isStarred?: boolean }) => Promise<void>
): Promise<{ action: "view" | "compose" | "refresh" | "quit" | "switch"; emailId?: string, emailIds?: string[] }> {
  using renderer = new TerminalRenderer();

  const loadEmails = (): Email[] => {
    return (db
      .query("SELECT id, subject, from_addr, snippet, isRead, isStarred, createdAt, categoryId FROM emails WHERE mailboxId = ? AND isDeleted = false ORDER BY createdAt DESC")
      .all(mailboxId) as any[]).map(e => ({
        ...e,
        isRead: e.isRead === 1,
        isStarred: e.isStarred === 1
      }));
  };

  const loadCategories = (): Map<string, Category> => {
    const cats = db
      .query("SELECT * FROM categories WHERE mailboxId = ? AND isDeleted = false")
      .all(mailboxId) as Category[];
    return new Map(cats.map((c) => [c.id, c]));
  };

  const mailbox = db.query("SELECT * FROM mailboxes WHERE id = ? AND isDeleted = false").get(mailboxId) as any;

  const emails = loadEmails();

  let isSyncing = false;

  const state: EmailListState = {
    emails,
    categories: loadCategories(),
    selectedEmailId: emails.length > 0 ? (restoreId && emails.find(e => e.id === restoreId)?.id) || emails[0].id : null,
    scrollOffset: restoreId ? Math.max(0, Math.min(emails.findIndex(e => e.id === restoreId) - 1, emails.length - renderer.getSize().height + 4)) : 0,
    mailboxName: mailbox?.address || "Inbox",
    syncDots: 0,
  };

  // Trigger initial sync on open
  if (syncCallback && !restoreId) {
    isSyncing = true;
    syncCallback().then(() => {
      isSyncing = false;
      state.emails = loadEmails();
      state.categories = loadCategories();
      renderEmailList();
    });
  }

  const renderEmailList = () => {
    const { width, height } = renderer.getSize();
    const lines: string[] = [];

    const header = `${colors.bright}${state.mailboxName}${colors.reset} (${state.emails.length} emails)`;
    lines.push(header);
    lines.push("─".repeat(width));

    const listHeight = height - 4;
    const needsScroll = state.emails.length > listHeight;
    const visibleStart = needsScroll ? state.scrollOffset : 0;
    const visibleEnd = Math.min(visibleStart + listHeight, state.emails.length);

    const scrollbarHeight = listHeight;
    const scrollbarThumbSize = Math.max(1, Math.floor((listHeight / state.emails.length) * scrollbarHeight));
    const scrollbarThumbPosition = Math.floor((visibleStart / state.emails.length) * scrollbarHeight);

    if (state.emails.length === 0) {
      lines.push("");
      lines.push(colors.dim + "No emails" + colors.reset);
    } else {
      for (let i = visibleStart; i < visibleEnd; i++) {
        const email = state.emails[i];
        const isSelected = email.id === state.selectedEmailId;

        // const readMark = ;
        const from = truncate(email.from_addr.split("<")[0].trim() || email.from_addr, 20);
        const subject = truncate(email.subject || "(no subject)", width - 37);
        const date = formatDate(email.createdAt);

        let icon = " ";
        const dot = email.isStarred ? "✪" : "●";
        if (email.categoryId) {
          const category = state.categories.get(email.categoryId);
          if (category?.color) {
            const color = Bun.color(category.color, "ansi");
            if (email.isRead) {
              icon = `${colors.dim}${color}${dot}${colors.reset}`;
            } else {
              icon = `${color}${dot}${colors.reset}`;
            }
          }
        } else if (!email.isRead) {
          icon = email.isStarred ? `${AnsiFg.YELLOW}${dot}` : dot;
        } else if (email.isStarred) {
          icon = `${colors.dim}${AnsiFg.YELLOW}★`;
        }

        const bg = isSelected ? colors.bg.blue : "";
        const fg = email.isStarred
          ? (email.isRead ? colors.fg.yellow + colors.dim : colors.bright + colors.fg.yellow)
          : (email.isRead ? colors.dim : colors.bright);
        // const star = email.isStarred ? `${colors.bright}${colors.fg.yellow}✪${colors.reset}${bg}${fg} ` : "  ";
        const reset = colors.reset;

        let scrollbarChar = " ";
        if (needsScroll) {
          const lineIndex = i - visibleStart;
          if (lineIndex >= scrollbarThumbPosition && lineIndex < scrollbarThumbPosition + scrollbarThumbSize) {
            scrollbarChar = colors.dim + "█" + colors.reset;
          } else {
            scrollbarChar = colors.dim + "│" + colors.reset;
          }
        }

        const line =
          bg +
          // fg +
          // readMark +
          " " +
          icon +
          fg +
          bg +
          " " +
          // star +
          from.padEnd(20) +
          " " +
          subject.padEnd(width - 52) +
          " " +
          date.padStart(10) +
          reset +
          " " +
          scrollbarChar;

        lines.push(line);
      }
    }

    lines.push("─".repeat(width));

    const statusLine = "Enter: View | s: Star | u: Read/Unread | c: Compose | r: Refresh | m: Mailbox | q: Quit";
    let syncIndicator = "";
    if (isSyncing) {
      const dots = ".".repeat(state.syncDots + 1) + " ".repeat(3 - state.syncDots - 1);
      syncIndicator = "  Syncing" + dots
    }

    // const _truncate = (text: string) => text.length > width ? text.substring(0, width - 1) + "…" : text;
    // if (syncIndicator.length) {

    // }
    const _truncate = (text: string, length: number) => text.length > length ? text.substring(0, length - 1) + "…" : text.padEnd(length, ' ');
    lines.push(colors.dim + _truncate(statusLine, width - syncIndicator.length) + syncIndicator + colors.reset);

    renderer.render({ lines });
  };

  const animInterval = setInterval(() => {
    if (isSyncing) {
      state.syncDots = (state.syncDots + 1) % 3;
    }
    renderEmailList();
  }, 500);

  try {
    // Trigger initial sync on open
    if (syncCallback && !restoreId) {
      isSyncing = true;
      syncCallback().then(() => {
        isSyncing = false;
        state.emails = loadEmails();
        state.categories = loadCategories();
        renderEmailList();
      });
    }

    renderEmailList();
    renderer.watchResize(renderEmailList)

    for await (const key of readKeys()) {
      if (key === "q" || key === Key.CTRL_C) {
        renderer.cleanup();
        return { action: "quit" };
      }

      if (key === "c") {
        return { action: "compose" };
      }

      if (key === "r") {
        if (syncCallback && !isSyncing) {
          isSyncing = true;
          syncCallback().then(() => {
            isSyncing = false;
            state.emails = loadEmails();
            state.categories = loadCategories();
            renderEmailList();
          });
        }
        continue;
      }

      if (key === "m") {
        return { action: "switch" };
      }

      if (key === "s" && modifyEmail && state.emails.length > 0 && state.selectedEmailId) {
        const idx = state.emails.findIndex(e => e.id === state.selectedEmailId);
        if (idx !== -1) {
          const email = state.emails[idx];
          const newStarred = !email.isStarred;
          db.run("UPDATE emails SET isStarred = ? WHERE id = ?", [newStarred ? 1 : 0, email.id]);
          state.emails[idx].isStarred = newStarred;
          modifyEmail({ id: email.id, mailboxId, isStarred: newStarred });
        }
      }

      if (key === "u" && modifyEmail && state.emails.length > 0 && state.selectedEmailId) {
        const idx = state.emails.findIndex(e => e.id === state.selectedEmailId);
        if (idx !== -1) {
          const email = state.emails[idx];
          const newRead = !email.isRead;
          db.run("UPDATE emails SET isRead = ? WHERE id = ?", [newRead ? 1 : 0, email.id]);
          state.emails[idx].isRead = newRead;
          modifyEmail({ id: email.id, mailboxId, isRead: newRead });
        }
      }

      const FAST_SCROLL_AMOUNT = 5;

      if (key === Key.UP && state.emails.length > 0 && state.selectedEmailId) {
        const idx = state.emails.findIndex(e => e.id === state.selectedEmailId);
        if (idx > 0) {
          state.selectedEmailId = state.emails[idx - 1].id;
          const { height } = renderer.getSize();
          const listHeight = height - 4;
          if ((idx - 1) < state.scrollOffset + 1 && state.scrollOffset > 0) {
            state.scrollOffset = Math.max(0, (idx - 1) - 1);
          }
        }
      }

      if (key === Key.CTRL_UP && state.emails.length > 0 && state.selectedEmailId) {
        const idx = state.emails.findIndex(e => e.id === state.selectedEmailId);
        if (idx > 0) {
          const newIdx = Math.max(0, idx - FAST_SCROLL_AMOUNT);
          state.selectedEmailId = state.emails[newIdx].id;
          const { height } = renderer.getSize();
          const listHeight = height - 4;
          state.scrollOffset = Math.max(0, newIdx - Math.floor(listHeight / 2));
        }
      }

      if (key === Key.DOWN && state.emails.length > 0 && state.selectedEmailId) {
        const idx = state.emails.findIndex(e => e.id === state.selectedEmailId);
        if (idx < state.emails.length - 1) {
          state.selectedEmailId = state.emails[idx + 1].id;
          const { height } = renderer.getSize();
          const listHeight = height - 4;
          if ((idx + 1) >= state.scrollOffset + listHeight - 1) {
            state.scrollOffset = Math.min(
              state.emails.length - listHeight,
              (idx + 1) - listHeight + 2
            );
          }
        }
      }

      if (key === Key.CTRL_DOWN && state.emails.length > 0 && state.selectedEmailId) {
        const idx = state.emails.findIndex(e => e.id === state.selectedEmailId);
        if (idx < state.emails.length - 1) {
          const newIdx = Math.min(state.emails.length - 1, idx + FAST_SCROLL_AMOUNT);
          state.selectedEmailId = state.emails[newIdx].id;
          const { height } = renderer.getSize();
          const listHeight = height - 4;
          state.scrollOffset = Math.max(0, Math.min(
            state.emails.length - listHeight,
            newIdx - Math.floor(listHeight / 2)
          ));
        }
      }

      if (key === Key.PAGEUP && state.emails.length > 0 && state.selectedEmailId) {
        const idx = state.emails.findIndex(e => e.id === state.selectedEmailId);
        if (idx > 0) {
          const { height } = renderer.getSize();
          const listHeight = height - 4;
          const newIdx = Math.max(0, idx - listHeight);
          state.selectedEmailId = state.emails[newIdx].id;
          state.scrollOffset = Math.max(0, state.scrollOffset - listHeight);
        }
      }

      if (key === Key.PAGEDOWN && state.emails.length > 0 && state.selectedEmailId) {
        const idx = state.emails.findIndex(e => e.id === state.selectedEmailId);
        if (idx < state.emails.length - 1) {
          const { height } = renderer.getSize();
          const listHeight = height - 4;
          const newIdx = Math.min(state.emails.length - 1, idx + listHeight);
          state.selectedEmailId = state.emails[newIdx].id;
          const maxScroll = Math.max(0, state.emails.length - listHeight);
          state.scrollOffset = Math.min(maxScroll, state.scrollOffset + listHeight);
        }
      }

      if (key === Key.HOME && state.emails.length > 0) {
        state.selectedEmailId = state.emails[0].id;
        state.scrollOffset = 0;
      }

      if (key === Key.END && state.emails.length > 0) {
        state.selectedEmailId = state.emails[state.emails.length - 1].id;
        const { height } = renderer.getSize();
        const listHeight = height - 4;
        state.scrollOffset = Math.max(0, state.emails.length - listHeight);
      }

      if (key === Key.ENTER && state.emails.length > 0 && state.selectedEmailId) {
        return {
          action: "view",
          emailId: state.selectedEmailId,
          emailIds: state.emails.map(e => e.id),
        };
      }

      renderEmailList();
    }
    throw new Error("Unexpected end of input");
  } finally {
    clearInterval(animInterval);
    renderer.cleanup();
  }
}
