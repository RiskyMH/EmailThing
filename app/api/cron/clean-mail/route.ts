import { db, Email, Mailbox, TempAlias } from '@/db';
import { lt, or, inArray, sql, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { deleteFile } from '@/utils/s3';

export const revalidate = 0

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', {
            status: 401,
        });
    }

    // get the temp aliases that are expires
    const tempAliases = await db.query.TempAlias.findMany({
        where: lt(TempAlias.expiresAt, new Date()),
        columns: {
            id: true,
            mailboxId: true,
            alias: true,
        }
    });

    const emails = await db.query.Email.findMany({
        where: or(
            // get emails deleted more than 30 days ago
            lt(Email.binnedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
            // or if its part of a expired temp alias
            tempAliases.length ? inArray(Email.tempId, tempAliases.map(temp => temp.id)) : undefined
        ),
        columns: {
            id: true,
            mailboxId: true,
            size: true,
        },
        with: {
            attachments: {
                columns: {
                    id: true,
                    filename: true,
                }
            },
        }
    });

    await Promise.all(emails.map(async (email) => {
        await deleteFile(`${email.mailboxId}/${email.id}`);
        await deleteFile(`${email.mailboxId}/${email.id}/email.eml`);
        await Promise.all(email.attachments.map(async (attachment) => {
            await deleteFile(`${email.mailboxId}/${email.id}/${attachment.id}/${attachment.filename}`);
        }));
    }));

    await db.batch([
        // delete from db
        db.delete(Email)
            .where(emails.length ? inArray(Email.id, emails.map(email => email.id)) : sql`1 = 0`),

        db.delete(TempAlias)
            .where(tempAliases.length ? inArray(TempAlias.id, tempAliases.map(temp => temp.id)) : sql`1 = 0`),

        ...emails.map(email => db.update(Mailbox)
            .set({
                storageUsed: sql`${Mailbox.storageUsed} - ${email.size}`
            })
            .where(eq(Mailbox.id, email.mailboxId))
        )
    ])

    return Response.json({ success: true, message: `Deleted ${emails.length} emails and ${tempAliases.length} temp aliases` });
}