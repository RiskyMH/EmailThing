import { EmailAttachments, db } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { getSignedUrl } from "@/utils/s3";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { userMailboxAccess } from "../../../tools";

// export const runtime = 'edge'

export async function GET(
    request: Request,
    props: {
        params: Promise<{
            mailbox: string;
            email: string;
            attachment: string;
        }>;
    }
) {
    const params = await props.params;
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(params.mailbox, userId)))) return notFound();

    const attachment = await db.query.EmailAttachments.findFirst({
        where: and(eq(EmailAttachments.id, params.attachment), eq(EmailAttachments.emailId, params.email)),
        columns: {
            filename: true,
            id: true,
        },
        with: {
            email: {
                columns: {
                    mailboxId: true,
                },
            },
        },
    });
    if (!attachment) return notFound();
    if (attachment.email.mailboxId !== params.mailbox) return notFound();

    const url = await getSignedUrl({
        key: `${params.mailbox}/${params.email}/${attachment.id}/${attachment.filename}`,
    });
    return Response.redirect(url);
}
