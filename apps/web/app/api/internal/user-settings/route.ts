import { createPasswordHash, verifyPassword } from "@/utils/password";
import { db, MailboxForUser, PasskeyCredentials, UserNotification, UserSession } from "@/db";
import { User } from "@/db";
import { and, eq, gte, not, type InferSelectModel } from "drizzle-orm";
import { userAuthSchema } from "@/validations/auth";
import { isValidOrigin, getSession } from "../tools";
import { revalidatePath, revalidateTag } from "next/cache";
import { makeHtml } from "@/(email)/mail/[mailbox]/draft/[draft]/tools";
import { verifyCredentials } from "@/utils/passkeys";
import { sendEmail } from "@/utils/send-email";
import { impersonatingEmails } from "@/validations/invalid-emails";
import { createId } from "@paralleldrive/cuid2";
import { marked } from "marked";
import { Mailbox as MimeMailbox, createMimeMessage } from "mimetext";

export async function POST(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    const headers = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "3600",
    };

    // type is search param
    const type = new URL(request.url).searchParams.get("type")!;
    const date = new Date();

    const currentUserid = await getSession(request);
    if (!currentUserid) return Response.json({ message: { error: "Unauthorized" } }, { status: 401, headers });

    const currentUser = await db.query.User.findFirst({
        where: eq(User.id, currentUserid),
    });
    if (!currentUser) return Response.json({ message: { error: "User not found" } }, { status: 404, headers });

    const data = await request.json();

    const results = {
        "change-username": changeUsername,
        "change-password": changePassword.bind(null, request.headers.get("authorization")?.split(" ")[1] || ""),
        "change-backup-email": changeBackupEmail,
        "change-public-email": changePublicEmail,
        "add-passkey": addPasskey,
        "delete-passkey": deletePasskey,
        "change-email": changeEmail,
        "change-public-email-status": changePublicEmailStatus,
        "leave-mailbox": leaveMailbox,
    };
    const result = await results[type as keyof typeof results](currentUserid, data);
    if (!result) return new Response("Not allowed", { status: 403 });

    if ("error" in result) return Response.json({ message: result }, { status: 400, headers });

    const sync = await db.batch([
        db.query.User.findFirst({
            where: eq(User.id, currentUserid),
            columns: {
                id: true,
                username: true,
                email: true,
                onboardingStatus: true,
                password: false,
                admin: true,
                backupEmail: true,
                publicEmail: true,
                publicContactPage: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
        db.query.PasskeyCredentials.findMany({
            where: and(eq(PasskeyCredentials.userId, currentUserid), gte(PasskeyCredentials.createdAt, date)),
            columns: {
                id: true,
                name: true,
                publicKey: false,
                isDeleted: true,
                updatedAt: true,
                createdAt: true,
                userId: true,
                credentialId: true,
            },
        }),
        db.query.UserNotification.findMany({
            where: and(eq(UserNotification.userId, currentUserid), gte(UserNotification.createdAt, date)),
            columns: {
                id: true,
                endpoint: false,
                p256dh: false,
                auth: false,
                isDeleted: true,
                createdAt: true,
                expiresAt: true,
                userId: true,
            },
        }),
        db.query.MailboxForUser.findMany({
            where: and(eq(MailboxForUser.userId, currentUserid), gte(MailboxForUser.joinedAt, date)),
            columns: {
                userId: true,
                mailboxId: true,
                joinedAt: true,
                role: true,
                isDeleted: true,
                updatedAt: true,
            },
        }),
    ]);

    if (!sync[0]) return Response.json({ message: { error: "User not found?" } }, { status: 404, headers });

    return Response.json(
        {
            message: result,
            sync: {
                user: sync[0],
                passkeyCredentials: sync[1],
                userNotifications: sync[2],
                mailboxesForUser: sync[3],
            },
        } satisfies MappedPossibleDataResponse,
        { status: 200, headers },
    );
}

export function OPTIONS(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }
    return new Response("OK", {
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "authorization",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        },
    });
}

export type PossibleData =
    | ChangeUsernameData
    | ChangePasswordData
    | ChangeBackupEmailData
    | ChangePublicEmailData
    | AddPasskeyData
    | DeletePasskeyData
    | ChangeEmailData
    | ChangePublicEmailStatusData
    | LeaveMailboxData;
export type MappedPossibleData = {
    "change-username": ChangeUsernameData;
    "change-password": ChangePasswordData;
    "change-backup-email": ChangeBackupEmailData;
    "change-public-email": ChangePublicEmailData;
    "add-passkey": AddPasskeyData;
    "delete-passkey": DeletePasskeyData;
    "change-email": ChangeEmailData;
    "change-public-email-status": ChangePublicEmailStatusData;
    "leave-mailbox": LeaveMailboxData;
};

export type MappedPossibleDataResponse =
    | {
        message: {
            success: string;
            description?: string;
        };
        sync: {
            user: Omit<InferSelectModel<typeof User>, "password">;
            passkeyCredentials: Omit<InferSelectModel<typeof PasskeyCredentials>, "publicKey">[];
            userNotifications: Omit<InferSelectModel<typeof UserNotification>, "endpoint" | "p256dh" | "auth">[];
            mailboxesForUser: InferSelectModel<typeof MailboxForUser>[];
        };
    }
    | {
        message: {
            error: string;
        };
    };

export interface ChangeUsernameData {
    newName: string;
}
async function changeUsername(userId: string, data: ChangeUsernameData) {
    const username = data.newName;

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

export interface ChangePasswordData {
    oldPassword: string;
    newPassword: string;
}
// TODO: require sudo perms
async function changePassword(session: string, userId: string, data: ChangePasswordData) {
    const oldPassword = data.oldPassword;
    const newPassword = data.newPassword;

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
    await db.batch([
        db
            .update(User)
            .set({
                password: await createPasswordHash(newPassword),
            })
            .where(eq(User.id, userId)),

        // invalidate sessions, but maybe the current one is fine to keep
        db
            .delete(UserSession)
            .where(and(eq(UserSession.userId, userId), not(eq(UserSession.token, session)))),
    ]);

    revalidatePath("/settings");
    return { success: "Your password has been updated." };
}

export interface ChangeBackupEmailData {
    email: string;
}
async function changeBackupEmail(userId: string, data: ChangeBackupEmailData) {
    const email = data.email;

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

    return {
        success: "Please verify your backup email to continue.",
        description:
            "If you find our email in your spam folder, we would greatly appreciate it if you could mark it as 'Not Spam'.",
    };
}

export interface AddPasskeyData {
    credential: Credential;
    name: string;
}
async function addPasskey(userId: string, data: AddPasskeyData) {
    const { credential, name } = data;
    try {
        const { credentialID, publicKey } = await verifyCredentials(userId, credential);

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

    return { success: "Passkey added" };
}

export interface DeletePasskeyData {
    passkeyId: string;
}
async function deletePasskey(userId: string, data: DeletePasskeyData) {
    const { passkeyId } = data;

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

    return { success: "Passkey deleted" };
}

export interface ChangeEmailData {
    email: string;
}
async function changeEmail(userId: string, data: ChangeEmailData) {
    const { email } = data;

    await db.update(User).set({ email }).where(eq(User.id, userId)).execute();

    revalidateTag(`user-${userId}`);
    return { success: "Your email has been updated." };
}

export interface ChangePublicEmailStatusData {
    enabled: boolean;
}
async function changePublicEmailStatus(userId: string, data: ChangePublicEmailStatusData) {
    const { enabled } = data;

    const user = await db
        .update(User)
        .set({
            publicContactPage: enabled,
        })
        .where(eq(User.id, userId))
        .returning({ username: User.username })
        .execute();

    revalidatePath(`/emailme/@${user?.[0].username}`);
    return { success: "Your can now use the page." };
}

export interface ChangePublicEmailData {
    email: string;
}
async function changePublicEmail(userId: string, data: ChangePublicEmailData) {
    const { email } = data;

    const user = await db
        .update(User)
        .set({
            publicEmail: email,
        })
        .where(eq(User.id, userId))
        .returning({ username: User.username })
        .execute();

    revalidatePath(`/emailme/@${user?.[0].username}`);
    return { success: "Your public email has been updated." };
}

interface LeaveMailboxData {
    mailboxId: string;
}
async function leaveMailbox(userId: string, data: LeaveMailboxData) {
    const { mailboxId } = data;
    const currentUserId = userId;

    // check if they are owner
    const userRole = await db.query.MailboxForUser.findFirst({
        where: and(
            eq(MailboxForUser.mailboxId, mailboxId),
            eq(MailboxForUser.userId, currentUserId),
            eq(MailboxForUser.isDeleted, false),
        ),
        columns: {
            role: true,
        },
    });

    if (userRole?.role === "OWNER") {
        return { error: "Owner can't leave the mailbox" };
    }

    // remove user from mailbox
    await db
        .update(MailboxForUser)
        .set({
            isDeleted: true,
            joinedAt: new Date(),
            updatedAt: new Date(),
            role: "NONE",
        })
        .where(
            and(
                eq(MailboxForUser.mailboxId, mailboxId),
                eq(MailboxForUser.userId, currentUserId),
                not(eq(MailboxForUser.role, "OWNER")),
            ),
        )
        .execute();

    revalidateTag(`user-mailbox-access-${mailboxId}-${currentUserId}`);
    revalidateTag(`user-mailboxes-${currentUserId}`);
    revalidatePath(`/mail/${mailboxId}/config`);
    // (await cookies()).delete("mailboxId");
    // redirect("/mail");
    return { success: "You have left the mailbox" };
}
