"use server";
import { Email, EmailRecipient, EmailSender, InviteCode, Mailbox, MailboxAlias, MailboxForUser, User, db } from "@/db";
import { addUserTokenToCookie } from "@/utils/jwt";
import { createPasswordHash } from "@/utils/password";
import { userAuthSchema } from "@/validations/auth";
import { impersonatingEmails } from "@/validations/invalid-emails";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { emailUser } from "./tools";

const noInvite = {
    error: "You need an invite code to signup. Join the Discord to get it.",
    link: { m: "Get Invite", l: "https://discord.gg/GT9Q2Yz4VS" },
};

export default async function signUp(
    data: FormData,
): Promise<{ error?: string | null; link?: { m: string; l: string } } | void> {
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
        where: eq(sql`lower(${User.username})`, sql`lower(${parsedData.data.username})`),
    });

    if (existingUser) {
        return { error: "Username already taken" };
    }

    // check email alaises to
    const existingEmail = await db.query.MailboxAlias.findFirst({
        where: eq(sql`lower(${MailboxAlias.alias})`, sql`lower(${`${parsedData.data.username}@emailthing.xyz`})`),
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
