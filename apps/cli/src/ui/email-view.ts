import { TerminalRenderer, colors, Key, readKeys } from "./renderer";
import { markdownHighlight } from "./markdown-highlight";
import type { Database } from "bun:sqlite";


interface Email {
  id: string;
  subject: string | null;
  from_addr: string;
  to_addr: string;
  body: string | null;
  html: string | null;
  createdAt: string;
  isRead: boolean;
  isStarred: boolean;
}

export async function emailViewScreen(
  db: Database,
  mailboxId: string,
  emailId: string,
  modifyEmail?: (updates: { id: string; mailboxId: string; isRead?: boolean; isStarred?: boolean }) => Promise<void>
): Promise<"back" | "quit" | "next" | "prev"> {

  using renderer = new TerminalRenderer();

  const _rawEmail = db
    .query("SELECT * FROM emails WHERE id = ? AND mailboxId = ?")
    .get(emailId, mailboxId) as any | null;
  const email = _rawEmail && {
    ..._rawEmail,
    isRead: _rawEmail.isRead === 1,
    isStarred: _rawEmail.isStarred === 1,
  } as Email | null;

  if (!email) {
    renderer.cleanup();
    return "back";
  }

  if (!email.isRead) db.run("UPDATE emails SET isRead = 1 WHERE id = ?", [emailId]);

  let scrollOffset = 0;

  const bodyText = email.body || email.html || "(empty)";
  const bodyMarkdowned = markdownHighlight(bodyText);
  const getBodyLines = (width: number) => Bun.wrapAnsi(bodyMarkdowned, width - 2, { hard: true, ambiguousIsNarrow: false, trim: false }).split('\n');


  const renderEmail = () => {
    const { width, height } = renderer.getSize();
    const lines: string[] = [];

    lines.push(colors.bright + (email.subject || "(no subject)") + colors.reset);
    lines.push(" ".repeat(width));
    lines.push(colors.dim + "From: " + colors.reset + email.from_addr);
    lines.push(colors.dim + "To: " + colors.reset + email.to_addr);
    lines.push(colors.dim + "Date: " + colors.reset + new Date(email.createdAt).toLocaleString());
    // lines.push("");
    lines.push(colors.dim + "─".repeat(Math.min(width, 60)) + colors.reset);

    const bodyLines = getBodyLines(width);


    const headerHeight = 8;
    const viewHeight = height - headerHeight;
    const visibleStart = scrollOffset;
    const visibleEnd = Math.min(scrollOffset + viewHeight, bodyLines.length);

    const showScrollbar = bodyLines.length > viewHeight || scrollOffset > 0;
    const scrollbarHeight = viewHeight;
    const scrollbarThumbSize = Math.max(1, Math.floor((viewHeight / bodyLines.length) * scrollbarHeight));
    const scrollbarThumbPosition = Math.floor((scrollOffset / bodyLines.length) * scrollbarHeight);

    for (let i = visibleStart; i < visibleEnd; i++) {
      let line = bodyLines[i] || "";
      const lineIndex = i - visibleStart;

      let scrollbarChar = " ";
      if (showScrollbar) {
        if (lineIndex >= scrollbarThumbPosition && lineIndex < scrollbarThumbPosition + scrollbarThumbSize) {
          scrollbarChar += colors.reset + colors.dim + "█" + colors.reset;
        } else {
          scrollbarChar += colors.reset + colors.dim + "│" + colors.reset;
        }
      }
      // lines.push(line + scrollbarChar);


      const plainLength = Bun.stringWidth(line, { ambiguousIsNarrow: false, countAnsiEscapeCodes: false });
      const padding = " ".repeat(Math.max(0, width - 2 - plainLength));
      lines.push(line + padding + scrollbarChar);

    }

    while (lines.length < height - 1) {
      lines.push(" ".repeat(width));
    }

    const starStatus = email.isStarred ? "Unstar" : "Star";
    const readStatus = email.isRead ? "Mark Unread (u)" : "Mark Read (u)";

    const statusBarText = `↑/↓: Scroll | ←/→: Prev/Next | Enter×2: Browser | s: ${starStatus} | u: ${readStatus} | Esc: Back | q: Quit`;
    const statusBarTruncated = Bun.stringWidth(statusBarText, { ambiguousIsNarrow: false, countAnsiEscapeCodes: false }) > width
      ? statusBarText.substring(0, width - 1) + "…"
      : statusBarText;

    const statusBar = colors.dim +
      statusBarTruncated
        .replace("Esc: Back", colors.bright + colors.fg.cyan + "Esc: Back" + colors.reset + colors.dim)
    // .replace(starEmoji, colors.bright + colors.fg.yellow + starEmoji + colors.reset + colors.dim) +
    colors.reset;

    lines.push(statusBar);

    renderer.render({ lines });
  };

  try {
    renderEmail();
    renderer.watchResize(renderEmail)

    const DOUBLE_PRESS_THRESHOLD_MS = 500;
    let lastEnterTime = 0;

    for await (const key of readKeys()) {
      if (key === "q" || key === Key.CTRL_C) {
        renderer.cleanup();
        return "quit";
      }

      if (key === Key.ESCAPE || key === Key.BACKSPACE) {
        return "back";
      }

      if (key === Key.ENTER) {
        const now = Date.now();
        const timeSinceLastEnter = now - lastEnterTime;

        if (timeSinceLastEnter < DOUBLE_PRESS_THRESHOLD_MS) {
          // Double enter - open in browser
          const url = `https://emailthing.app/mail/${mailboxId}/${emailId}`;
          const platform = process.platform;
          const openCmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";

          try {
            Bun.spawn([openCmd, url], { stdout: "inherit", stderr: "inherit" });
          } catch (error) {
            // Ignore errors (browser might not be available)
          }

          lastEnterTime = 0; // Reset
        } else {
          // Single enter - just track the time
          lastEnterTime = now;
        }
      }

      if (key === Key.LEFT) {
        return "prev";
      }

      if (key === Key.RIGHT) {
        return "next";
      }

      if (key === "s" && modifyEmail) {
        const newStarred = !email.isStarred;
        email.isStarred = newStarred;
        db.run("UPDATE emails SET isStarred = ? WHERE id = ?", [newStarred ? 1 : 0, emailId]);
        modifyEmail({ id: emailId, mailboxId, isStarred: newStarred });
      }

      if (key === "u" && modifyEmail) {
        const newRead = !email.isRead;
        email.isRead = newRead;
        db.run("UPDATE emails SET isRead = ? WHERE id = ?", [newRead ? 1 : 0, emailId]);
        modifyEmail({ id: emailId, mailboxId, isRead: newRead });
      }

      const FAST_SCROLL_AMOUNT = 5;

      if (key === Key.UP && scrollOffset > 0) {
        scrollOffset--;
      }

      if (key === Key.CTRL_UP && scrollOffset > 0) {
        scrollOffset = Math.max(0, scrollOffset - FAST_SCROLL_AMOUNT);
      }

      if (key === Key.DOWN) {
        const { width, height } = renderer.getSize();
        const bodyLines = getBodyLines(width);
        const maxScroll = Math.max(0, bodyLines.length - (height - 9));
        if (scrollOffset < maxScroll) {
          scrollOffset++;
        }
      }

      if (key === Key.CTRL_DOWN) {
        const { width, height } = renderer.getSize();
        const bodyLines = getBodyLines(width);
        const maxScroll = Math.max(0, bodyLines.length - (height - 9));
        scrollOffset = Math.min(maxScroll, scrollOffset + FAST_SCROLL_AMOUNT);
      }

      if (key === Key.PAGEUP) {
        const { width, height } = renderer.getSize();
        const pageSize = height - 9;
        scrollOffset = Math.max(0, scrollOffset - pageSize);
      }

      if (key === Key.PAGEDOWN) {
        const { width, height } = renderer.getSize();
        const bodyLines = getBodyLines(width);
        const pageSize = height - 9;
        const maxScroll = Math.max(0, bodyLines.length - pageSize);
        scrollOffset = Math.min(maxScroll, scrollOffset + pageSize);
      }

      if (key === Key.HOME) {
        scrollOffset = 0;
      }

      if (key === Key.END) {
        const { width, height } = renderer.getSize();
        const bodyLines = getBodyLines(width);
        const maxScroll = Math.max(0, bodyLines.length - (height - 9));
        scrollOffset = maxScroll;
      }

      renderEmail();
    }
    throw new Error("Unexpected end of input");
  } finally {
    renderer.cleanup();
  }
}
