import { DraftEmail, db } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { userMailboxAccess } from "../../../tools";

// export const runtime = 'edge'

export async function GET(
    request: Request,
    props: {
        params: Promise<{
            mailbox: string;
            draft: string;
        }>;
    },
) {
    const params = await props.params;
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(params.mailbox, userId)))) return notFound();

    const mail = await db.query.DraftEmail.findFirst({
        where: and(eq(DraftEmail.id, params.draft), eq(DraftEmail.mailboxId, params.mailbox)),
        columns: {
            body: true,
        },
    });
    if (!mail) return notFound();

    return new Response(mail.body, {
        headers: {
            "Content-Type": "text/plain",
        },
    });
}
