import { API_URL } from "@emailthing/const/urls";
import { db } from "../db";
import { getMailboxAliases, getUserMailboxes } from "./mailbox";

export async function getUser(userId: string) {
  const user = await db.user.get(userId);
  return user;
}

export async function getMe() {
  // just get first user as in theory only one user exists
  const users = await db.user.filter((user) => user.id !== "demo").first();
  return users;
}

export async function getAllAliases() {
  const user = await getMe();
  const mailboxes = await getUserMailboxes();
  const aliases = await Promise.all(
    mailboxes.map(async (mailbox) => {
      const aliases = await getMailboxAliases(mailbox.id);
      return aliases.map((alias) => ({
        mailboxId: mailbox.id,
        alias: alias.alias,
      }));
    }),
  );
  return aliases.flat();
}

export async function getLogedInUserApi() {
  // return the api url + token + customisations
  const user = await getMe();
  if (!user) return;
  const session = await db.localSyncData.where("userId").equals(user.id).first();
  if (!session) return {
    apiUrl: API_URL,
    token: null,
    notificationsPublicKey: null,
    tokenNeedsRefresh: false,
    tokenFullyExpired: false,
    userId: user.id,
    username: user.username,
    isSyncing: false,
  };
  session.apiUrl ||= API_URL;
  const apiUrl = await db.apiCustomisations.get(session.apiUrl);

  return {
    apiUrl: session.apiUrl,
    token: session.token,
    notificationsPublicKey: apiUrl?.notificationsPublicKey,
    tokenNeedsRefresh: session.tokenExpiresAt < new Date(),
    tokenFullyExpired: session.refreshTokenExpiresAt < new Date(),
    userId: user.id,
    username: user.username,
    isSyncing: session.isSyncing,
  };
}