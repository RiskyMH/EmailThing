import type { DBMailbox, DBMailboxCategory, DBMailboxAlias } from "../types";

export const demoMailboxId = "demo";

export const demoMailbox: DBMailbox = {
    id: demoMailboxId,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    storageUsed: 1024 * 1024, // 1MB
    plan: "FREE",
};

export const demoMailboxAliases: DBMailboxAlias[] = [
    {
        id: "1",
        mailboxId: demoMailboxId,
        alias: "demo@emailthing.app",
        default: true,
        name: "Demo",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
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
    },
    {
        id: "2",
        mailboxId: demoMailboxId,
        name: "Personal",
        color: "#008000", // green
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
    },
]; 