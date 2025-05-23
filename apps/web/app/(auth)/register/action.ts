"use server";
import { Email, EmailRecipient, EmailSender, InviteCode, Mailbox, MailboxAlias, MailboxForUser, User, db } from "@/db";
import { addUserTokenToCookie } from "@/utils/jwt";
import { createPasswordHash } from "@/utils/password";
import { userAuthSchema } from "@/validations/auth";
import { impersonatingEmails } from "@/validations/invalid-emails";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, gte, isNull } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const noInvite = {
    error: "You need an invite code to signup. Join the Discord to get it.",
    link: { m: "Get Invite", l: "https://discord.gg/GT9Q2Yz4VS" },
};

export default async function signUp(
    data: FormData,
): Promise<{ error?: string | null; link?: { m: string; l: string } }> {
    const parsedData = userAuthSchema.safeParse({
        username: data.get("username"),
        password: data.get("password"),
    });

    if (!parsedData.success) {
        return {
            error: parsedData.error.errors[0].message,
        };
    }

    if (impersonatingEmails.some((v) => parsedData.data.username.toLowerCase().includes(v))) {
        return { error: "Invalid username" };
    }

    // currently you require invite code to sign up
    const referer = (await headers()).get("referer");
    if (!referer) return noInvite;
    const inviteCode = new URL(referer).searchParams?.get("invite");
    if (!inviteCode) return noInvite;

    // check if invite code is valid
    const invite = await db.query.InviteCode.findFirst({
        where: and(eq(InviteCode.code, inviteCode), gte(InviteCode.expiresAt, new Date()), isNull(InviteCode.usedAt)),
        columns: {
            expiresAt: true,
            usedAt: true,
        },
    });

    if (!invite) {
        return { error: "Invalid invite code" };
    }

    const existingUser = await db.query.User.findFirst({
        where: eq(User.username, parsedData.data.username),
    });

    if (existingUser) {
        return { error: "Username already taken" };
    }

    // check email alaises to
    const existingEmail = await db.query.MailboxAlias.findFirst({
        where: eq(MailboxAlias.alias, `${parsedData.data.username}@emailthing.xyz`),
    });

    if (existingEmail) {
        return { error: "Email already taken" };
    }

    // create user and their mailbox
    const userId = createId();
    const mailboxId = createId();

    await db.batchUpdate([
        db.insert(User).values({
            id: userId,
            username: parsedData.data.username,
            password: await createPasswordHash(parsedData.data.password),
            email: `${parsedData.data.username}@emailthing.xyz`,
        }),

        db.insert(Mailbox).values({
            id: mailboxId,
        }),

        db.insert(MailboxForUser).values({
            mailboxId,
            userId,
            role: "OWNER",
        }),

        db.insert(MailboxAlias).values({
            mailboxId,
            alias: `${parsedData.data.username}@emailthing.xyz`,
            default: true,
            name: parsedData.data.username,
        }),

        // invalidate invite code
        db
            .update(InviteCode)
            .set({
                usedAt: new Date(),
                usedBy: userId,
            })
            .where(eq(InviteCode.code, inviteCode)),

        ...emailUser({ userId, mailboxId, username: parsedData.data.username }),
    ]);

    // add user token to cookie
    await addUserTokenToCookie({ id: userId });
    (await cookies()).set("mailboxId", mailboxId, {
        path: "/",
        expires: new Date("2038-01-19 04:14:07"),
    });

    // redirect to mail
    redirect("/onboarding/welcome");
}

function emailUser({ userId, mailboxId, username }: { userId: string; mailboxId: string; username: string }) {
    const msg = `### Hi **@${username}**,

Welcome to EmailThing!

We're excited to have you on board. With EmailThing, you can enjoy a range of features designed to make managing your emails a breeze:

*   **API Integration**: Send emails and more with our [API].
*   **Custom Domains**: Use your [own domain] for your emails.
*   **Multi-User Support**: [Invite others] to your mailbox.
*   **Temporary Email**: Need a burner email? [Get many here].
*   **Progressive Web App (PWA)**: Install EmailThing to your home screen on mobile for easy access and notifications.
    [Set up notifications] on both desktop and mobile.
*   **Contact Page**: Create your own [contact page] to receive messages with a simple form.

EmailThing is proudly open source. Check out our [GitHub] for more details.

To get started, visit and explore all that we have to offer.

If you have any questions or feedback, feel free to reach out.

Best regards,
[RiskyMH] (creator and founder)


<!-- Links -->
[RiskyMH]: https://riskymh.dev
[API]: https://emailthing.app/docs/api
[own domain]: https://emailthing.app/mail/${mailboxId}/config
[Invite others]: https://emailthing.app/mail/${mailboxId}/config
[Get many here]: https://emailthing.app/mail/${mailboxId}/temp
[Set up notifications]: https://emailthing.app/settings/notifications
[contact page]: https://emailthing.app/settings/emailthing-me
[GitHub]: https://github.com/RiskyMH/EmailThing`;

    // const html = makeHtml(await marked.parse(msg))

    const snippet = `Hi @${username}, Welcome to EmailThing! We're excited to have you on board. With EmailThing, you can enjoy a range of features designed to make managing your emails a breeze`;
    const title = "Welcome to EmailThing!";
    // const email = createMimeMessage()
    // email.setSender({ addr: "system@emailthing.dev", name: "EmailThing" })
    // email.setRecipient({ addr: `${username}@emailthing.xyz`, name: username })
    // email.setSubject("Welcome to EmailThing!")
    // email.addMessage({
    //     contentType: "text/plain",
    //     data: msg
    // })
    // email.addMessage({
    //     contentType: "text/html",
    //     encoding: "base64",
    //     data: Buffer.from(html).toString("base64")
    // })
    // email.setHeader("X-EmailThing", "official")
    // email.setHeader("Reply-To", new MimeMailbox("contact@emailthing.xyz"))

    // return sendEmail({
    //     from: "system@emailthing.dev",
    //     to: [`${username}@emailthing.xyz`],
    //     data: email.asRaw()
    // })
    const emailId = createId();
    return [
        db.insert(Email).values({
            id: emailId,
            body: msg,
            // html,
            subject: title,
            snippet,
            raw: "draft",
            mailboxId,
            isRead: false,
            replyTo: "hello@riskymh.dev",
            size: 0,
            createdAt: new Date(),
        }),

        db.insert(EmailRecipient).values({
            emailId,
            name: username,
            address: `${username}@emailthing.xyz`,
        }),

        db.insert(EmailSender).values({
            emailId,
            name: "EmailThing",
            address: "system@emailthing.app",
        }),
    ] as const;

    // TODO: maybe just directly add to db instead of weird proxy...
}
