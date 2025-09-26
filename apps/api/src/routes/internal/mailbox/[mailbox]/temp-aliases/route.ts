import { getSession, isValidOrigin } from "@/routes/internal/tools";
import { db, MailboxForUser } from "@/db";
import { and, eq, asc } from "drizzle-orm";
import { DefaultDomain, Mailbox } from "@/db";


// right now there isn't much point for it mailbox scoped, but in future may have mailbox custom alias domains so just make my life easier
export async function GET(request: Request, { params }: { params: Promise<{ mailbox: string }> }) {
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
    const { mailbox: mailboxId } = (await params) || (request as any).params;

    // Get type from search param
    const date = new Date();

    const currentUserId = await getSession(request);
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

    try {
        const tempDomains = await db.query.DefaultDomain.findMany({
            where: and(eq(DefaultDomain.available, true), eq(DefaultDomain.tempDomain, true), eq(DefaultDomain.isDeleted, false)),
            orderBy: asc(DefaultDomain.createdAt)
        })

        return Response.json(tempDomains.map(e => e.domain), { status: 200, headers });
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

