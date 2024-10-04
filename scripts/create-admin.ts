import { Mailbox, MailboxAlias, MailboxForUser, User, db } from "@/db";
import { createPasswordHash } from "@/utils/password";
import { createId } from "@paralleldrive/cuid2";

const username = prompt("Enter username:");
const password = prompt("Enter password:");

if (!(username && password)) {
    console.log("Username and password are required");
    process.exit(1);
}

const userId = createId();
const mailboxId = createId();

await db.batch([
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

console.log("User created successfully");
