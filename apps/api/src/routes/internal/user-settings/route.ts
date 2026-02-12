import { db, MailboxForUser, PasskeyCredentials, User, UserNotification, UserSession } from "@/db";
import { createPasswordHash, verifyPassword } from "@/utils/password";
import { userAuthSchema } from "@/utils/validations/auth";
import { and, eq, gte, inArray, not, sql, type InferSelectModel } from "drizzle-orm";
import { getSession, isValidOrigin } from "../tools";
// import { revalidatePath, revalidateTag } from "next/cache";
import { verifyCredentials } from "@/utils/passkeys";
import { sendEmail } from "@/utils/send-email";
import { validateAlias } from "@/utils/validations/sus-emails-checker";
import { sendNotification } from "@/utils/web-push";
import { makeHtml } from "@emailthing/web-pwa/src/(app)/compose/tools";
import { createId } from "@paralleldrive/cuid2";
import { marked } from "marked";
import { createMimeMessage, Mailbox as MimeMailbox } from "mimetext";
import { UAParser } from "ua-parser-js";
import { invalidateAllResetPasswordTokensForUser } from "@/utils/redis-minor";

export async function POST(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    const headers = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization,content-type",
        "Access-Control-Allow-Credentials": "false",
        "Access-Control-Max-Age": "3600",
    };

    // type is search param
    const type = new URL(request.url).searchParams.get("type") as keyof MappedPossibleData | null;
    const date = new Date();

    const currentUserid = await getSession(request);
    if (!currentUserid) return Response.json({ message: { error: "Unauthorized" } }, { status: 401, headers });

    const [currentUser] = await db
        .select()
        .from(User)
        .where(eq(User.id, currentUserid))
        .limit(1);
    if (!currentUser) return Response.json({ message: { error: "User not found" } }, { status: 404, headers });

    const data = await request.json();

    const results = {
        "change-username": changeUsername,
        "change-password": changePassword.bind(null, request.headers.get("authorization")?.split(" ")[1] || ""),
        "change-backup-email": changeBackupEmail,
        "change-public-email": changePublicEmail,
        "add-passkey": addPasskey.bind(null, request.headers.get("user-agent") || ""),
        "delete-passkey": deletePasskey,
        "change-email": changeEmail,
        "change-public-email-status": changePublicEmailStatus,
        "leave-mailbox": leaveMailbox,
        "revoke-session": revokeSession,
        "delete-notification": deleteNotification,
        "save-notification": saveNotification,
    };
    const result = await results[type as keyof typeof results](currentUserid, data);
    if (!result) return new Response("Not allowed", { status: 403 });

    if ("error" in result) return Response.json({ message: result }, { status: 400, headers });

    const [[user], mailboxesForUser] = await db.batchFetch([
        db.select({
            id: User.id,
            username: User.username,
            email: User.email,
            onboardingStatus: User.onboardingStatus,
            admin: User.admin,
            backupEmail: User.backupEmail,
            publicEmail: User.publicEmail,
            publicContactPage: User.publicContactPage,
            createdAt: User.createdAt,
            updatedAt: User.updatedAt,
        }).from(User).where(eq(User.id, currentUserid)).limit(1),

        db
            .select({
                userId: MailboxForUser.userId,
                mailboxId: MailboxForUser.mailboxId,
                joinedAt: MailboxForUser.joinedAt,
                role: MailboxForUser.role,
                isDeleted: MailboxForUser.isDeleted,
                updatedAt: MailboxForUser.updatedAt,
            })
            .from(MailboxForUser)
            .where(and(eq(MailboxForUser.userId, currentUserid), gte(MailboxForUser.updatedAt, date))),
    ]);

    if (!user) return Response.json({ message: { error: "User not found?" } }, { status: 404, headers });

    return Response.json(
        {
            message: result,
            sync: {
                user: user,
                mailboxesForUser: mailboxesForUser,
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
            "Access-Control-Allow-Headers": "authorization,content-type",
            "Access-Control-Allow-Credentials": "false",
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
    | LeaveMailboxData
    | RevokeSessionData
    | DeleteNotificationData
    | SaveNotificationData;
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
    "revoke-session": RevokeSessionData;
    "delete-notification": DeleteNotificationData;
    "save-notification": SaveNotificationData;
};

export type MappedPossibleDataResponse =
    | {
        message: {
            success: string;
            description?: string;
        };
        sync: {
            user: Omit<InferSelectModel<typeof User>, "password">;
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
    const [existingUser] = await db
        .select()
        .from(User)
        .where(and(eq(sql`lower(${User.username})`, sql`lower(${username})`), not(eq(User.id, userId))))
        .limit(1);

    if (existingUser) return { error: "Username already taken" };

    // check schema
    const validUsername = userAuthSchema.safeParse({
        username,
        password: "password",
    });
    if (!validUsername.success) return { error: validUsername.error.issues[0]?.message };

    const validationError = validateAlias(validUsername.data.username);
    if (validationError) {
        const [user] = await db
            .select({ admin: User.admin })
            .from(User)
            .where(eq(User.id, userId))
            .limit(1);
        if (!user?.admin) {
            return validationError;
        }
    }

    // update username
    await db.update(User).set({ username }).where(eq(User.id, userId)).execute();

    // revalidatePath("/settings");
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
    const [user] = await db
        .select({ password: User.password })
        .from(User)
        .where(eq(User.id, userId))
        .limit(1);

    if (!user) return { error: "User not found" };

    const validPassword = await verifyPassword(oldPassword, user.password);
    if (!validPassword) return { error: "Current password is not correct" };

    if (newPassword.length < 8) return { error: "Password needs to be at least 8 characters" };

    // update password
    await db.batchUpdate([
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
    await invalidateAllResetPasswordTokensForUser(userId);

    // revalidatePath("/settings");
    return { success: "Your password has been updated." };
}

export interface ChangeBackupEmailData {
    email: string;
}
async function changeBackupEmail(userId: string, data: ChangeBackupEmailData) {
    const email = data.email;

    const [user] = await db
        .select({
            id: User.id,
            backupEmail: User.backupEmail,
            username: User.username,
            email: User.email,
        })
        .from(User)
        .where(eq(User.id, userId))
        .limit(1);

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

    // revalidateTag(`user-${userId}`);

    return {
        success: "Please verify your backup email to continue.",
        description:
            "If you find our email in your spam folder, we would greatly appreciate it if you could mark it as 'Not Spam'.",
    };
}

export interface AddPasskeyData {
    credential: Credential;
    name?: string;
}
async function addPasskey(userAgent: string, userId: string, data: AddPasskeyData) {
    if (!data.name) {
        const ua = new UAParser(userAgent).getResult();
        data.name = `${ua.browser.name} on ${ua.os.name}`;
    }
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

    // revalidateTag(`user-${userId}`);
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

    // revalidatePath(`/emailme/@${user?.[0].username}`);
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

    // revalidatePath(`/emailme/@${user?.[0].username}`);
    return { success: "Your public email has been updated." };
}

interface LeaveMailboxData {
    mailboxId: string;
}
async function leaveMailbox(userId: string, data: LeaveMailboxData) {
    const { mailboxId } = data;
    const currentUserId = userId;

    // check if they are owner
    const [userRole] = await db
        .select({ role: MailboxForUser.role })
        .from(MailboxForUser)
        .where(and(
            eq(MailboxForUser.mailboxId, mailboxId),
            eq(MailboxForUser.userId, currentUserId),
            eq(MailboxForUser.isDeleted, false),
        ))
        .limit(1);

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

    // revalidateTag(`user-mailbox-access-${mailboxId}-${currentUserId}`);
    // revalidateTag(`user-mailboxes-${currentUserId}`);
    // revalidatePath(`/mail/${mailboxId}/config`);
    // (await cookies()).delete("mailboxId");
    // redirect("/mail");
    return { success: "You have left the mailbox" };
}

// todo: require sudo auth
type RevokeSessionData = ({ sessionIds: string[] } | { all: true })
async function revokeSession(userId: string, data: RevokeSessionData) {
    if ("all" in data) {
        await db.delete(UserSession).where(eq(UserSession.userId, userId)).execute();
        return { success: "All sessions revoked", description: "This includes this one" };
    }

    await db.delete(UserSession).where(and(eq(UserSession.userId, userId), inArray(UserSession.id, data.sessionIds))).execute();
    return { success: data.sessionIds.length > 1 ? "Sessions revoked" : "Session revoked" };
}

interface DeleteNotificationData {
    endpoint: string;
}
async function deleteNotification(userId: string, data: DeleteNotificationData) {
    const { endpoint } = data;

    await db.delete(UserNotification).where(and(eq(UserNotification.userId, userId), eq(UserNotification.endpoint, endpoint))).execute();
    return { success: "Notification deleted" };
}

interface SaveNotificationData {
    subscription: PushSubscriptionJSON;
}
async function saveNotification(userId: string, data: SaveNotificationData) {
    const { subscription } = data;

    // save subscription
    if (!subscription.keys) return { error: "Subscription keys are missing" };
    if (!subscription.endpoint) return { error: "Subscription endpoint is missing" };
    if (!subscription.keys.p256dh) return { error: "Subscription p256dh key is missing" };
    if (!subscription.keys.auth) return { error: "Subscription auth key is missing" };

    await db.insert(UserNotification).values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
    }).execute();

    // send test notification
    const res = await sendNotification({
        subscription: subscription as any,
        data: JSON.stringify({
            title: "Text Notification",
            body: "This is a test notification!",
        })
    })

    if (!res.ok) return { error: `Failed to send test notification: ${await res.text()}` };

    return { success: "Notification saved", description: "You will receive a test notification shortly" };
}