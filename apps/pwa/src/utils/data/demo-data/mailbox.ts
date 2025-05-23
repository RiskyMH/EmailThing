import type { DBMailbox, DBMailboxAlias, DBMailboxCategory } from "../types";

export const demoMailboxId = "demo";

export const demoMailbox: DBMailbox = {
  id: demoMailboxId,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  storageUsed: 1000 * 1000 * 12.3, // 12.3MB (lazy using 1000 instead of 1024 because "storage used" isn't smart enough to use 1024)
  plan: "DEMO",
  isDeleted: 0,
};

export const demoMailboxAliases: DBMailboxAlias[] = [
  {
    id: "1",
    mailboxId: demoMailboxId,
    alias: "demo@emailthing.app",
    default: 1,
    name: "Demo",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    isDeleted: 0,
  },
];

export const demoCategories: DBMailboxCategory[] = [
  {
    id: "1",
    mailboxId: demoMailboxId,
    name: "Work",
    color: "#FFA500", // orange
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    isDeleted: 0,
  },
  {
    id: "2",
    mailboxId: demoMailboxId,
    name: "Personal",
    color: "#008000", // green
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    isDeleted: 0,
  },
];
