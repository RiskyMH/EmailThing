
import { db, Email, Mailbox, MailboxForUser } from "@/db";
import { getSession, isValidOrigin } from "@/routes/internal/tools";
import { getSignedUrl } from "@/utils/s3";
import { and, eq } from "drizzle-orm";


export async function GET(request: Request, { params }: { params: Promise<{ mailbox: string, mail: string }> }) {
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
    const { mailbox: mailboxId, mail: mailId } = (await params) || (request as any).params;

    const currentUserId = await getSession(request, false, true);
    if (!currentUserId) return Response.json({ message: { error: "Unauthorized" } }, { status: 401, headers });

    const [[mailbox], [userAccess]] = await db.batchFetch([
        db.select({ id: Mailbox.id })
            .from(Mailbox)
            .where(eq(Mailbox.id, mailboxId))
            .limit(1),
        db.select()
            .from(MailboxForUser)
            .where(and(eq(MailboxForUser.mailboxId, mailboxId), eq(MailboxForUser.userId, currentUserId), eq(MailboxForUser.isDeleted, false)))
            .limit(1),
    ]);

    if (!mailbox || !userAccess) return Response.json({ message: { error: "Access denied to mailbox" } }, { status: 403, headers });


    // 3 options: email.eml, email.txt, email.html
    const type = new URL(request.url).searchParams.get("type") as "eml" | "txt" | "html" | null;
    if (!type) return Response.json({ message: { error: "Missing type parameter" } }, { status: 400, headers });

    const [email] = await db
        .select()
        .from(Email)
        .where(and(eq(Email.id, mailId), eq(Email.mailboxId, mailboxId)))
        .limit(1);
    if (!email) return Response.json({ message: { error: "Email not found" } }, { status: 404, headers });

    // make it <emailid>-<subject>.eml, accept sanitized subject and remove double -
    const subject = email.subject?.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

    const download = new URL(request.url).searchParams.get("download") === "true";

    if (type === "txt") {
        return new Response(email.body, {
            headers: download ? {
                "Content-Disposition": `attachment; filename="${mailId}-${subject}.txt"`,
            } : {},
        });
    }

    if (type === "html") {
        return new Response(email.html, {
            headers: download ? {
                "Content-Disposition": `attachment; filename="${mailId}-${subject}.html"`,
            } : {},
        });
    }

    // just fallback to .eml for now
    // if (type === "eml") {
    if (email.raw === "s3") {
        const url = await getSignedUrl({
            key: `${mailboxId}/${mailId}/email.eml`,
            responseContentType: "text/plain",
            filename: download ? `${mailId}-${subject}.eml` : undefined,
        });
        return Response.redirect(url);
    }
    return new Response(email.raw, {
        headers: download ? {
            "Content-Disposition": `attachment; filename="${mailId}-${subject}.eml"`,
        } : {},
    });
    // }
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
