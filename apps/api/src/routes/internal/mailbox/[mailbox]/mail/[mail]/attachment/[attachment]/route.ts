import { getSession, isValidOrigin } from "@/routes/internal/tools";
import { db, Email, EmailAttachments, MailboxForUser } from "@/db";
import { and, eq } from "drizzle-orm";
import { Mailbox } from "@/db";
import { getSignedUrl } from "@/utils/s3";


export async function GET(request: Request, { params }: { params: Promise<{ mailbox: string, mail: string, attachment: string }> }) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    if (!origin || !isValidOrigin(origin)) {
        if (referer && isValidOrigin(new URL(referer).origin)) {
            // return Response.redirect(referer);
        } else {
            return new Response("Not allowed", { status: 403 });
        }
    }

    const headers = {
        "Access-Control-Allow-Origin": origin || referer || "https://emailthing.app",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization,content-type",
        "Access-Control-Allow-Credentials": "false",
        "Access-Control-Max-Age": "3600",
    };

    // Get mailbox ID from URL
    const { mailbox: mailboxId, mail: mailId, attachment: attachmentId } = (await params) || (request as any).params;

    const currentUserId = await getSession(request, false, true);
    if (!currentUserId) return Response.json({ message: { error: "Unauthorized" } }, { status: 401, headers });

    const [mailbox, userAccess] = await db.batchFetch([
        db.query.Mailbox.findFirst({
            where: eq(Mailbox.id, mailboxId),
            columns: {
                id: true,
            },
        }),
        db.query.MailboxForUser.findFirst({
            where: and(eq(MailboxForUser.mailboxId, mailboxId), eq(MailboxForUser.userId, currentUserId), eq(MailboxForUser.isDeleted, false)),
        }),
    ]);

    if (!mailbox || !userAccess) return Response.json({ message: { error: "Access denied to mailbox" } }, { status: 403, headers });

    const email = await db.query.Email.findFirst({
        where: and(eq(Email.id, mailId), eq(Email.mailboxId, mailboxId)),
    });
    if (!email) return Response.json({ message: { error: "Email not found" } }, { status: 404, headers });

    const attachment = await db.query.EmailAttachments.findFirst({
        where: and(eq(EmailAttachments.id, attachmentId), eq(EmailAttachments.emailId, email.id)),
    });
    if (!attachment) return Response.json({ message: { error: "Attachment not found" } }, { status: 404, headers });

    const filename = attachment.filename.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const download = new URL(request.url).searchParams.get("download") === "true";
    const url = await getSignedUrl({
        key: `${mailboxId}/${email.id}/${attachment.id}/${attachment.filename}`,
        filename: download ? attachment.filename : undefined,
    });
    return Response.redirect(url);
}

export function OPTIONS(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    return new Response("OK", {
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "authorization,content-type",
            "Access-Control-Allow-Credentials": "false",
            "Access-Control-Max-Age": "3600",
        },
    });
}
