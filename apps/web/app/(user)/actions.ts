"use server";

import { makeHtml } from "@/(email)/mail/[mailbox]/draft/[draft]/tools";
import { PasskeyCredentials, User, db } from "@/db";
import { getCurrentUser, removeToken } from "@/utils/jwt";
import { verifyCredentials } from "@/utils/passkeys";
import { createPasswordHash, verifyPassword } from "@/utils/password";
import { sendEmail } from "@/utils/send-email";
import { userAuthSchema } from "@/validations/auth";
import { impersonatingEmails } from "@/validations/invalid-emails";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, not } from "drizzle-orm";
import { marked } from "marked";
import { Mailbox as MimeMailbox, createMimeMessage } from "mimetext";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function changeUsername(_prevState: any, data: FormData) {
    const userId = await getCurrentUser();
    if (!userId) return;
    const username = data.get("new-name") as string;

    // check if taken (but not by the user)
    const existingUser = await db.query.User.findFirst({
        where: and(eq(User.username, username), not(eq(User.id, userId))),
    });

    if (existingUser) return { error: "Username already taken" };

    // check schema
    const validUsername = userAuthSchema.safeParse({
        username,
        password: "password",
    });
    if (!validUsername.success) return { error: validUsername.error.errors[0].message };

    if (impersonatingEmails.some((v) => validUsername.data.username.toLowerCase().includes(v))) {
        const user = await db.query.User.findFirst({
            where: eq(User.id, userId),
            columns: {
                admin: true,
            },
        });
        if (!user?.admin) {
            return { error: "Invalid username" };
        }
    }

    // update username
    await db.update(User).set({ username }).where(eq(User.id, userId)).execute();

    revalidatePath("/settings");
    return { success: "Your username has been updated." };
}

export async function changePassword(_prevState: any, data: FormData) {
    const userId = await getCurrentUser();
    if (!userId) return;

    const oldPassword = data.get("password") as string;
    const newPassword = data.get("new-password") as string;

    // check old password
    const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            password: true,
        },
    });

    if (!user) return { error: "User not found" };

    const validPassword = await verifyPassword(oldPassword, user.password);
    if (!validPassword) return { error: "Current password is not correct" };

    if (newPassword.length < 8) return { error: "Password needs to be at least 8 characters" };

    // update password
    await db
        .update(User)
        .set({
            password: await createPasswordHash(newPassword),
        })
        .where(eq(User.id, userId))
        .execute();

    revalidatePath("/settings");
    return { success: "Your password has been updated." };
}

export async function logout() {
    await removeToken();
    (await cookies()).delete("mailboxId");

    redirect("/login");
}

export async function changeBackupEmail(_prevState: any, data: FormData, redirectHome = false) {
    const userId = await getCurrentUser();
    if (!userId) return;

    const email = data.get("email") as string;

    const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            id: true,
            backupEmail: true,
            username: true,
            email: true,
        },
    });

    if (!user) throw new Error("User not found");

    const mail = createMimeMessage();
    mail.setSender({
        addr: "system@emailthing.app",
        name: "EmailThing System",
    });
    mail.setRecipient(email);
    mail.setSubject("Someone has added you as a backup email! 🎉");
    const message = `### Hello!

**${user.username}** has added you as a backup email on EmailThing! 🎉

This means that if they ever lose access to their account, they can use this email to recover it.

Please click here to continue: https://emailthing.app/settings/authentication?verify=${createId()}

---

If you did not expect this email or have any questions, please contact us at contact@emailthing.app
`;
    const html = makeHtml(await marked.parse(message));

    mail.addMessage({
        contentType: "text/plain",
        data: message,
    });
    mail.addMessage({
        contentType: "text/html",
        // encoding: "base64",
        // data: Buffer.from(html).toString("base64")
        data: html,
    });
    mail.setHeader("X-EmailThing", "official");
    mail.setHeader("X-Entity-Ref-ID", createId());
    mail.setHeader("Reply-To", new MimeMailbox("contact@emailthing.app"));

    const e = await sendEmail({
        from: "system@emailthing.app",
        to: [email],
        data: mail,
    });

    if (e?.error) {
        return { error: "Failed to send test email to your email address" };
    }

    await db
        .update(User)
        .set({
            backupEmail: email,
            onboardingStatus: { initial: true },
        })
        .where(eq(User.id, userId))
        .execute();

    revalidateTag(`user-${userId}`);
    revalidatePath("/settings");

    if (redirectHome) redirect("/mail");
    return {
        success: "Please verify your backup email to continue.",
        description:
            "If you find our email in your spam folder, we would greatly appreciate it if you could mark it as 'Not Spam'.",
    };
}

export async function addPasskey(creds: Credential, name: string) {
    const userId = await getCurrentUser();
    if (!userId) return;
    try {
        const { credentialID, publicKey } = await verifyCredentials(userId, creds);

        await db
            .insert(PasskeyCredentials)
            .values({
                userId,
                name,
                publicKey: publicKey,
                credentialId: credentialID,
            })
            .execute();
    } catch (err) {
        console.error(err);
        return { error: "Failed to verify passkey" };
    }

    revalidatePath("/settings");
}

export async function deletePasskey(passkeyId: string) {
    const userId = await getCurrentUser();
    if (!userId) return;

    await db
        .delete(PasskeyCredentials)
        .where(
            and(
                eq(PasskeyCredentials.id, passkeyId),
                eq(PasskeyCredentials.userId, userId),
                eq(PasskeyCredentials.isDeleted, false),
            ),
        )
        .execute();

    revalidatePath("/settings");
}

export async function changeEmail(_prevState: any, data: FormData) {
    const userId = await getCurrentUser();
    if (!userId) return;

    await db
        .update(User)
        .set({
            email: data.get("email") as string,
        })
        .where(eq(User.id, userId))
        .execute();

    revalidateTag(`user-${userId}`);
    revalidatePath("/settings");
    return { success: "Your email has been updated." };
}

export async function changePublicEmailStatus(data: FormData) {
    const userId = await getCurrentUser();
    if (!userId) return;

    const user = await db
        .update(User)
        .set({
            publicContactPage: (data.get("enabled") as string) === "true",
        })
        .where(eq(User.id, userId))
        .returning({ username: User.username })
        .execute();

    revalidatePath("/settings");
    revalidatePath(`/emailme/@${user?.[0].username}`);
    return { success: "Your can now use the page." };
}

export async function changePublicEmail(_prevState: any, data: FormData) {
    const userId = await getCurrentUser();
    if (!userId) return;

    const user = await db
        .update(User)
        .set({
            publicEmail: data.get("email") as string,
        })
        .where(eq(User.id, userId))
        .returning({ username: User.username })
        .execute();

    revalidatePath("/settings");
    revalidatePath(`/emailme/@${user?.[0].username}`);
    return { success: "Your public email has been updated." };
}
