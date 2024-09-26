"use server";
import { db, MailboxForUser, User, ResetPasswordToken, PasskeyCredentials, Stats } from "@/db";
import { env } from "@/utils/env";
import { addUserTokenToCookie } from "@/utils/jwt"
import { verifyCredentials, verifyCredentialss } from "@/utils/passkeys";
import { createPasswordHash, verifyPassword } from "@/utils/password";
import { sendEmail } from "@/utils/send-email";
import { userAuthSchema } from "@/validations/auth"
import { createId } from "@paralleldrive/cuid2";
import { and, eq, lt, gt, sql } from "drizzle-orm";
import { createMimeMessage } from "mimetext";
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

const errorMsg = "Invalid username or password"

export default async function signIn(data: FormData, callback?: string | null): Promise<{ error?: string | null } | void> {
    const parsedData = userAuthSchema.safeParse({ username: data.get("username"), password: data.get("password") })
    if (!parsedData.success) {
        return {
            error: errorMsg
        }
    }

    // find user
    const user = await db.query.User.findFirst({
        where: eq(User.username, parsedData.data.username),
        columns: {
            id: true,
            password: true,
            onboardingStatus: true
        }
    })

    if (!user) {
        return { error: errorMsg }
    }

    // verify password
    const verified = await verifyPassword(parsedData.data.password, user.password)

    if (!verified) {
        return { error: errorMsg }
    } else if (typeof verified === "string") {
        // this is the new hash
        await db.update(User)
            .set({ password: verified })
            .where(eq(User.id, user.id))
            .execute()
    }

    await addUserTokenToCookie(user)

    return await handleUserRedirection(user, callback);
}

export async function signInPasskey(credential: Credential, callback?: string | null): Promise<{ error?: string | null } | void> {
    // console.log(credential)

    const cred = await db.query.PasskeyCredentials.findFirst({
        where: eq(PasskeyCredentials.credentialId, credential.id)
    });
    if (cred == null) {
        return { error: "Passkey not found" };
    }

    let verification;

    try {
        verification = await verifyCredentialss("login", credential, cred);
    } catch (error) {
        console.error(error);
        return { error: "Failed to verify passkey :(" }
    }

    console.log(verification)
    if (!verification.userVerified) {
        return { error: "Failed to verify passkey" }
    }

    // find user
    const user = await db.query.User.findFirst({
        where: eq(User.id, cred.userId),
        columns: {
            id: true,
            password: true,
            onboardingStatus: true
        }
    })

    if (!user) {
        return { error: "Can't find user" }
    }

    await addUserTokenToCookie(user)

    return await handleUserRedirection(user, callback);
}

async function handleUserRedirection(user: { id: string, onboardingStatus: { initial?: boolean } | null }, callback?: string | null) {
    await addUserTokenToCookie(user);

    // Get the user's mailbox to possibly redirect to it
    const mailboxes = await db.query.MailboxForUser.findMany({
        where: eq(MailboxForUser.userId, user.id),
        columns: { mailboxId: true },
    });

    const possibleMailbox = cookies().get("mailboxId")?.value;
    const mailboxIdAllowed = mailboxes.some(({ mailboxId }) => mailboxId === possibleMailbox)

    if (!possibleMailbox || !mailboxIdAllowed) {
        cookies().set("mailboxId", mailboxes[0].mailboxId, {
            path: "/",
            expires: new Date("2038-01-19 04:14:07"),
        });
    }

    // but if they need onboarding, send them there
    if (!user.onboardingStatus?.initial) {
        return redirect("/onboarding/welcome");
    }

    // if given callback url directly
    if (callback) {
        return redirect(callback);
    }

    // maybe ?from=/...
    const referer = headers().get("referer");
    if (referer) {
        callback = new URL(referer).searchParams?.get("from");
        if (callback) redirect(callback)
    }

    // ok they have to have mailboxId cookie right?
    if (possibleMailbox && mailboxIdAllowed) {
        return redirect(`/mail/${possibleMailbox}`);
    } else {
        return redirect(`/mail/${mailboxes[0].mailboxId}`);
    }
}


export async function resetPassword(username: string) {
    const user = await db.query.User.findFirst({
        where: eq(User.username, username),
        columns: {
            id: true,
            backupEmail: true,
            username: true
        }
    })

    if (!user?.backupEmail) return

    // send email
    const token = createId()
    await db.insert(ResetPasswordToken)
        .values({
            token,
            userId: user.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            createdAt: new Date()
        })
        .execute()

    // send email
    const mail = createMimeMessage()
    mail.setSender({ addr: "system@emailthing.app", name: "EmailThing System" })
    mail.setRecipient(user.backupEmail)
    mail.setSubject("Reset your password on EmailThing")
    mail.addMessage({
        contentType: "text/plain",
        data: `Hello @${user.username},

You have requested to reset your password on EmailThing. Click the link below to reset your password:

https://emailthing.app/login/reset?token=${token}

If you did not request this, please ignore this email.`
    })

    const e = await sendEmail({ from: "system@emailthing.app", to: [user.backupEmail], data: mail })

    if (e?.error) return e
}

export async function resetPasswordWithToken(token: string, password: string) {
    const reset = await db.query.ResetPasswordToken.findFirst({
        where: and(
            eq(ResetPasswordToken.token, token),
            gt(ResetPasswordToken.expiresAt, new Date())
        ),
        columns: {
            userId: true,
        }
    })

    if (!reset) {
        return { error: "Invalid token" }
    }

    await db.batch([
        db.update(User)
            .set({
                password: await createPasswordHash(password)
            })
            .where(eq(User.id, reset.userId)),

        db.delete(ResetPasswordToken)
            .where(eq(ResetPasswordToken.token, token)),
    ])

    return redirect("/login")
}