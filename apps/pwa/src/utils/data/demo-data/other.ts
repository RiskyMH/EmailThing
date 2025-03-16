import type { DBDefaultDomain, DBMailboxForUser, DBPasskeyCredentials, DBUser, DBUserNotification } from "../types"

export const demoUser = {
    id: "demo",
    createdAt: new Date(),
    updatedAt: new Date(),
    username: "demo",
    email: "demo@emailthing.app",
    admin: false,
    backupEmail: "demo@emailthing.app",
    onboardingStatus: { initial: true },
    publicEmail: "demo@emailthing.app",
    publicContactPage: false,
} satisfies DBUser

export const demoPasskeyCredentials: DBPasskeyCredentials[] = []

export const demoUserNotifications: DBUserNotification[] = []

export const demoDefaultDomains = [
    {
        id: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        domain: "emailthing.xyz",
        available: true,
        tempDomain: null,
    }, {
        id: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        domain: "temp.emailthing.xyz",
        available: true,
        tempDomain: true,
    }
] satisfies DBDefaultDomain[]



export const demoMailboxTokens = []

export const demoMailboxCustomDomains = []

export const demoMailboxForUser = [{
    userId: "demo",
    mailboxId: "demo",
    joinedAt: new Date(),
    role: "OWNER",
    updatedAt: new Date(),
    isDeleted: false,
}] satisfies DBMailboxForUser[]


