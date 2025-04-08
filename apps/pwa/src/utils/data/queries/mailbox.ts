import { db } from "@/utils/data/db"
import { getMe } from "./user"
import { createId } from "@paralleldrive/cuid2"

export async function getMailbox(mailboxId: string) {
    const mailbox = await db.mailboxes.get(mailboxId)
    return mailbox
}

export async function getMailboxName(mailboxId: string) {
    const mailboxAliases = await db.mailboxAliases.where("[mailboxId+default]").equals([mailboxId, 1]).first()
    return mailboxAliases?.alias
}

export async function getMailboxAliases(mailboxId: string) {
    const mailboxAliases = await db.mailboxAliases.where("mailboxId").equals(mailboxId).toArray()
    return mailboxAliases
}

export async function getMailboxDefaultAlias(mailboxId: string) {
    const mailboxAliases = await db.mailboxAliases.where("[mailboxId+default]").equals([mailboxId, 1]).first()
    return mailboxAliases
}

export async function getUserMailboxes() {
    // return [{id: "demo", name: "demo@emailthing.app", role: "DEMO", isDefault: true}]
    const [mailboxes, mailboxAliases, mailboxForUser] = await Promise.all([
        db.mailboxes.toArray(),
        db.mailboxAliases.toArray(),
        db.mailboxForUser.toArray(),
    ])
    return mailboxes.map(mailbox => ({
        id: mailbox.id,
        name: mailboxAliases.find(alias => alias.mailboxId === mailbox.id && alias.default == 1)?.alias,
        role: mailboxForUser.find(m => m.mailboxId === mailbox.id)?.role ?? "ADMIN",
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


/////////////////////////////////////////////
/////////////////////////////////////////////
/////////////////////////////////////////////

export async function getCategories(mailboxId: string) {
    return db.mailboxCategories.where('mailboxId').equals(mailboxId).and(item => item.isDeleted !== 1).toArray();
}


export async function createCategory(mailboxId: string, name: string, color?: string | null) {
    const categoryId = createId();
    await db.mailboxCategories.add({
        id: categoryId,
        mailboxId,
        name,
        color: color ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: 0,
        isNew: true,
    })

    if (mailboxId !== 'demo') {
        // intentionally not awaited
        db.sync()
    }

    return categoryId;
}

export async function deleteCategory(mailboxId: string, categoryId: string) {
    await db.transaction('rw', [db.mailboxCategories], () =>
        db.mailboxCategories.where("id").equals(categoryId).and(item => item.mailboxId === mailboxId).modify({
            isDeleted: 1,
            updatedAt: new Date(),
            name: "<deleted>",
            color: 0,
            needsSync: 1,
        })
    )

    if (mailboxId !== 'demo') {
        // intentionally not awaited
        db.sync()
    }
}

export async function updateCategory(mailboxId: string, categoryId: string, name: string, color?: string | null) {
    await db.transaction('rw', [db.mailboxCategories], () =>
        db.mailboxCategories.where("id").equals(categoryId).and(item => item.mailboxId === mailboxId).modify({
            name,
            color: color ?? 0,
            needsSync: 1,
        })
    )
    if (mailboxId !== 'demo') {
        // intentionally not awaited
        db.sync()
    }

}

