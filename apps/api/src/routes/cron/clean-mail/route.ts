import { db, Email, EmailAttachments, EmailRecipient, EmailSender, Mailbox, TempAlias } from "@/db";
import { deleteFile } from "@/utils/s3";
import { and, eq, inArray, lt, not, or, sql } from "drizzle-orm";

// TODO: do this "cron" better instead of still having the old vercel remains
const every24hr = 1000 * 60 * 60 * 24;
process.env.CRON_SECRET ||= Bun.randomUUIDv7();

setInterval(() => {
  GET(
    new Request("https://api.emailthing.app/api/cron/clean-mail", {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    })
  );
}, every24hr);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  // get the temp aliases that are expires
  const tempAliases = await db.select({
    id: TempAlias.id,
    mailboxId: TempAlias.mailboxId,
    alias: TempAlias.alias
  })
    .from(TempAlias)
    .where(and(lt(TempAlias.expiresAt, new Date()), eq(TempAlias.isDeleted, false)))
    .execute();

  const emailWhere = and(
    or(
      // get emails deleted more than 30 days ago
      lt(Email.binnedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      // or if its part of a expired temp alias
      tempAliases.length
        ? inArray(
          Email.tempId,
          tempAliases.map((temp) => temp.id)
        )
        : undefined
    ),
    not(eq(Email.isDeleted, true))
  );

  const emails = await db
    .select({
      id: Email.id,
      mailboxId: Email.mailboxId,
      size: Email.size,
    })
    .from(Email)
    .where(emailWhere)
    .execute();

  let attachments: Array<{ id: string; filename: string; emailId: string }> = [];
  if (emails.length) {
    attachments = await db
      .select({
        id: EmailAttachments.id,
        filename: EmailAttachments.filename,
        emailId: EmailAttachments.emailId,
      })
      .from(EmailAttachments)
      .where(inArray(EmailAttachments.emailId, emails.map((e) => e.id)))
      .execute();
  }

  const emailsWithAttachments = emails.map((email) => ({
    ...email,
    attachments: attachments.filter((a) => a.emailId === email.id),
  }));


  console.log(
    `would delete ${emailsWithAttachments.length} emails and ${tempAliases.length} temp aliases`
  );

  const s3FilesToDelete = [];
  for (const email of emailsWithAttachments) {
    s3FilesToDelete.push(`${email.mailboxId}/${email.id}`);
    s3FilesToDelete.push(`${email.mailboxId}/${email.id}/email.eml`);
    for (const attachment of email.attachments) {
      s3FilesToDelete.push(
        `${email.mailboxId}/${email.id}/${attachment.id}/${attachment.filename}`
      );
    }
  }
  await Promise.all(s3FilesToDelete.map((key) => deleteFile(key)));

  await db.batchUpdate([
    // delete from db
    db
      .update(Email)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
        body: "<deleted>",
        subject: "<deleted>",
        binnedAt: null,
        categoryId: null,
        givenId: null,
        givenReferences: null,
        html: null,
        isRead: true,
        isSender: false,
        replyTo: null,
        snippet: null,
        size: 0,
        isStarred: false,
        // tempId: null,
        createdAt: new Date(),
      })
      .where(
        emailsWithAttachments.length
          ? inArray(
            Email.id,
            emailsWithAttachments.map((email) => email.id)
          )
          : sql`1 = 0`
      ),

    db.delete(EmailSender).where(
      emailsWithAttachments.length
        ? inArray(
          EmailSender.emailId,
          emailsWithAttachments.map((email) => email.id)
        )
        : sql`1 = 0`
    ),
    db.delete(EmailRecipient).where(
      emailsWithAttachments.length
        ? inArray(
          EmailRecipient.emailId,
          emailsWithAttachments.map((email) => email.id)
        )
        : sql`1 = 0`
    ),
    db.delete(EmailAttachments).where(
      emailsWithAttachments.length
        ? inArray(
          EmailAttachments.emailId,
          emailsWithAttachments.map((email) => email.id)
        )
        : sql`1 = 0`
    ),

    db
      .update(TempAlias)
      .set({
        isDeleted: true,
        createdAt: new Date(),
        name: "<deleted>",
        updatedAt: new Date(),
        // alias: "<deleted>",
      })
      .where(
        tempAliases.length
          ? inArray(
            TempAlias.id,
            tempAliases.map((temp) => temp.id)
          )
          : sql`1 = 0`
      ),

    ...emailsWithAttachments.map((email) =>
      db
        .update(Mailbox)
        .set({
          storageUsed: sql`${Mailbox.storageUsed} - ${email.size}`,
        })
        .where(eq(Mailbox.id, email.mailboxId))
    ),
  ]);

  return Response.json({
    success: true,
    message: `Deleted ${emailsWithAttachments.length} emails and ${tempAliases.length} temp aliases`,
  });
}
