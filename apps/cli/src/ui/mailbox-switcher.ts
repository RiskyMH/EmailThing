import { TerminalRenderer, readKey, colors, Key, readKeys } from "./renderer";
import type { Database } from "bun:sqlite";

interface Mailbox {
  id: string;
  default_alias: string;
}

export async function mailboxSwitcher(db: Database, currentMailboxId: string): Promise<string | null> {
  const renderer = new TerminalRenderer();

  const mailboxes = db.query(`
    SELECT mailboxId as id, mailbox_aliases.alias AS default_alias
    FROM mailboxes
    INNER JOIN mailbox_aliases
      ON mailboxes.id = mailbox_aliases.mailboxId AND mailbox_aliases.\`default\` = true AND mailbox_aliases.isDeleted = false
    WHERE mailboxes.isDeleted = false
  `).all() as Mailbox[];

  // Append a fake mailbox for switch user
  const options = [
    ...mailboxes,
    { id: "switch-user", default_alias: "(switch user)" }
  ];

  let selectedIndex = options.findIndex((m) => m.id === currentMailboxId);
  if (selectedIndex === -1) selectedIndex = 0;

  const renderMailboxes = () => {
    const { width, height } = renderer.getSize();
    const lines: string[] = [];

    lines.push(colors.bright + "Switch Mailbox" + colors.reset);
    lines.push("─".repeat(width));

    for (let i = 0; i < options.length; i++) {
      const mailbox = options[i];
      const isSelected = i === selectedIndex;
      const isCurrent = mailbox.id === currentMailboxId;
      const isSwitchUser = mailbox.id === "switch-user";

      const marker = !isSwitchUser && isCurrent ? "● " : "  ";
      const bg = isSelected ? colors.bg.blue : "";
      const fg = !isSwitchUser && isCurrent ? colors.bright : "";

      lines.push(
        bg + fg + marker + mailbox.default_alias + colors.reset
      );
    }

    while (lines.length < height - 2) {
      lines.push("");
    }

    lines.push("─".repeat(width));
    lines.push(colors.dim + "Enter: Select | Esc: Cancel | q: Quit" + colors.reset);

    renderer.render({ lines });
  };

  try {
    renderMailboxes();
    renderer.watchResize(renderMailboxes);

    for await (const key of readKeys()) {

      if (key === Key.ESCAPE || key === "q" || key === Key.CTRL_C) {
        if (key === Key.CTRL_C) renderer.cleanup();
        return null;
      }

      if (key === Key.UP && selectedIndex > 0) {
        selectedIndex--;
      }

      if (key === Key.DOWN && selectedIndex < options.length - 1) {
        selectedIndex++;
      }

      if (key === Key.ENTER) {
        return options[selectedIndex].id;
      }

      renderMailboxes();
    }
  } finally {
    renderer.cleanup();
  }
}
