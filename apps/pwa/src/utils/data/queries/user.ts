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
