import { Mailbox, MailboxAlias, MailboxForUser, User, db } from "@emailthing/db/connect";
import { createPasswordHash } from "../apps/web/app/utils/password";
import { createId } from "@paralleldrive/cuid2";

const username = prompt("Enter username:");
const password = prompt("Enter password:");

if (!(username && password)) {
    console.error("Username and password are required");
    process.exit(1);
}

const userId = createId();
const mailboxId = createId();

await db.batchUpdate([
    db.insert(User).values({
        id: userId,
        username,
        password: await createPasswordHash(password),
        email: `${username}@emailthing.xyz`,
        admin: true,
    }),

    db.insert(Mailbox).values({
        id: mailboxId,
    }),

    db.insert(MailboxForUser).values({
        mailboxId,
        userId,
    }),

    db.insert(MailboxAlias).values({
        mailboxId,
        alias: `${username}@emailthing.xyz`,
        default: true,
        name: username,
    }),
]);

console.info("User created successfully");
