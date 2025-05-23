import type {
  DBDefaultDomain,
  DBMailboxForUser,
  DBPasskeyCredentials,
  DBUser,
  DBUserNotification,
} from "../types";

export const demoUser = {
  id: "demo",
  createdAt: new Date(),
  updatedAt: new Date(),
  username: "demo",
  email: "demo@emailthing.app",
  admin: 0,
  backupEmail: "demo@emailthing.app",
  onboardingStatus: { initial: true },
  publicEmail: "demo@emailthing.app",
  publicContactPage: 0,
} satisfies DBUser;

export const demoPasskeyCredentials: DBPasskeyCredentials[] = [];

export const demoUserNotifications: DBUserNotification[] = [];

export const demoDefaultDomains = [
  {
    id: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: 0,
    domain: "emailthing.xyz",
    available: 1,
    tempDomain: 0,
  },
  {
    id: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: 0,
    domain: "temp.emailthing.xyz",
    available: 1,
    tempDomain: 1,
  },
] satisfies DBDefaultDomain[];

export const demoMailboxTokens = [];

export const demoMailboxCustomDomains = [];

export const demoMailboxForUser = [
  {
    userId: "demo",
    mailboxId: "demo",
    joinedAt: new Date(),
    role: "OWNER",
    updatedAt: new Date(),
    isDeleted: 0,
  },
] satisfies DBMailboxForUser[];
