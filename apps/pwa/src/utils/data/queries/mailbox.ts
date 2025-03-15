import { db } from "@/utils/data/db"

export async function getMailbox(mailboxId: string) {
    const mailbox = await db.mailboxes.get(mailboxId)
    return mailbox
}

export async function getMailboxName(mailboxId: string) {
    const mailboxAliases = await db.mailboxAliases.where("mailboxId").equals(mailboxId).and(mailboxAlias => mailboxAlias.default).first()
    return mailboxAliases?.alias
}

export async function getMailboxAliases(mailboxId: string) {
    const mailboxAliases = await db.mailboxAliases.where("mailboxId").equals(mailboxId).toArray()
    return mailboxAliases
}

export async function getMailboxDefaultAlias(mailboxId: string) {
    const mailboxAliases = await db.mailboxAliases.where("mailboxId").equals(mailboxId).and(mailboxAlias => mailboxAlias.default).first()
    console.log(await db.mailboxAliases.toArray())
    return mailboxAliases
}

export async function getUserMailboxes() {
    // return [{id: "demo", name: "demo@emailthing.app", role: "DEMO", isDefault: true}]
    const mailboxes = await db.mailboxes.toArray()
    const mailboxAliases = await db.mailboxAliases.toArray()
    return mailboxes.map(mailbox => ({
        id: mailbox.id,
        name: mailboxAliases.find(alias => alias.mailboxId === mailbox.id)?.alias,
        // role: "ADMIN",
    }))
}

