import { db } from "@/utils/data/db"
import { getMe } from "./user"

export async function getMailbox(mailboxId: string) {
    const mailbox = await db.mailboxes.get(mailboxId)
    return mailbox
}

export async function getMailboxName(mailboxId: string) {
    const mailboxAliases = await db.mailboxAliases.where("mailboxId").equals(mailboxId).and(mailboxAlias => mailboxAlias.default == 1).first()
    return mailboxAliases?.alias
}

export async function getMailboxAliases(mailboxId: string) {
    const mailboxAliases = await db.mailboxAliases.where("mailboxId").equals(mailboxId).toArray()
    return mailboxAliases
}

export async function getMailboxDefaultAlias(mailboxId: string) {
    const mailboxAliases = await db.mailboxAliases.where("mailboxId").equals(mailboxId).and(mailboxAlias => mailboxAlias.default == 1).first()
    return mailboxAliases
}

export async function getUserMailboxes() {
    // return [{id: "demo", name: "demo@emailthing.app", role: "DEMO", isDefault: true}]
    const mailboxes = await db.mailboxes.toArray()
    const mailboxAliases = await db.mailboxAliases.toArray()
    return mailboxes.map(mailbox => ({
        id: mailbox.id,
        name: mailboxAliases.find(alias => alias.mailboxId === mailbox.id && alias.default == 1)?.alias,
        // role: "ADMIN",
    }))
}

export async function getMailboxCustomDomains(mailboxId: string) {
    const customDomains = await db.mailboxCustomDomains.where("mailboxId").equals(mailboxId).toArray()
    return customDomains
}

export async function getMailboxTokens(mailboxId: string) {
    const tokens = await db.mailboxTokens.where("mailboxId").equals(mailboxId).toArray()
    return tokens
}

export async function getMailboxUsers(mailboxId: string) {
    const users = await db.mailboxForUser.where("mailboxId").equals(mailboxId).toArray()
    return users
}


export async function getCurrentUserMailbox(mailboxId: string) {
    const currentUser = await getMe()
    if (!currentUser) return null
    const mailboxForUser = await db.mailboxForUser.where("userId").equals(currentUser.id).and(mailboxForUser => mailboxForUser.mailboxId === mailboxId).first()
    return mailboxForUser
}
