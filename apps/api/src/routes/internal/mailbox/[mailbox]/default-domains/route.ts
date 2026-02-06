import { db, DefaultDomain, Mailbox, MailboxForUser } from "@/db";
import { getSession, isValidOrigin } from "@/routes/internal/tools";
import { and, asc, eq } from "drizzle-orm";


// right now there isn't much point for it mailbox scoped, but in future may have mailbox custom alias domains so just make my life easier
export async function GET(request: Bun.BunRequest) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    const headers = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization,content-type",
        "Access-Control-Allow-Credentials": "false",
        "Access-Control-Max-Age": "3600",
    };

    // Get mailbox ID from URL
    const { mailbox: mailboxId } = request.params;

    // Get type from search param
    const date = new Date();

    const currentUserId = await getSession(request);
    if (!currentUserId || !mailboxId) return Response.json({ message: { error: "Unauthorized" } }, { status: 401, headers });

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

    try {
        const domains = await db
            .select()
            .from(DefaultDomain)
            .where(and(eq(DefaultDomain.available, true), eq(DefaultDomain.isDeleted, false)))
            .orderBy(asc(DefaultDomain.createdAt));

        return Response.json({
            domains: domains.filter(e => !e.tempDomain).map(e => e.domain),
            tempDomains: domains.filter(e => e.tempDomain).map(e => e.domain),
        }, { status: 200, headers });
    } catch (error) {
        console.error("Error in mailbox settings:", error);
        return Response.json({ message: { error: "An error occurred" } }, { status: 500, headers });
    }
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

