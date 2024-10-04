import { Email, db } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { getSignedUrl } from "@/utils/s3";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { userMailboxAccess } from "../../tools";

// export const runtime = 'edge'

export async function GET(
    request: Request,
    {
        params,
    }: {
        params: {
            mailbox: string;
            email: string;
        };
    },
) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(params.mailbox, userId)))) return notFound();

    const mail = await db.query.Email.findFirst({
        where: and(eq(Email.id, params.email), eq(Email.mailboxId, params.mailbox)),
        columns: {
            raw: true,
        },
    });
    if (!mail) return notFound();

    if (mail.raw === "s3") {
        const url = await getSignedUrl({
            key: `${params.mailbox}/${params.email}/email.eml`,
            responseContentType: "text/plain",
        });

        return Response.redirect(url);
    }
    if (mail.raw === "draft") {
        return new Response("This email was made from drafts.");
    }

    return new Response(mail.raw);
}
