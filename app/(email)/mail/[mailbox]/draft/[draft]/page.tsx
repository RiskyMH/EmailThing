import { db, DraftEmail, Email } from "@/db";
import { BodyEditor, DeleteButton, FromInput, RecipientInput, SendButton, Subject } from "./editor.client"
import { notFound, redirect } from "next/navigation"
import { mailboxAliases, pageMailboxAccess } from "../../tools"
import { deleteDraftAction, saveDraftAction, sendEmailAction } from "./actions"
import { cache } from "react"
import { and, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { PaperclipIcon } from "lucide-react";
import LocalTime from "@/components/localtime";

export async function generateMetadata(props: { params: { mailbox: string, draft: string } }) {
    if (!await pageMailboxAccess(props.params.mailbox, false)) return {}

    const mail = await fetchDraft(props.params.mailbox, props.params.draft)
    return {
        title: mail?.subject || "(Unnamed draft)",
    }
}

const fetchDraft = cache(async (mailboxId: string, draftId: string) => {
    return await db.query.DraftEmail.findFirst({
        where: and(
            eq(DraftEmail.id, draftId),
            eq(DraftEmail.mailboxId, mailboxId),
        ),
        columns: {
            body: true,
            subject: true,
            from: true,
            to: true,
            updatedAt: true
        },
    })
})


export default async function DraftPage({
    params
}: {
    params: {
        mailbox: string,
        draft: string
    }
}) {
    await pageMailboxAccess(params.mailbox)

    const { aliases, default: defaultAlias } = await mailboxAliases(params.mailbox)

    const mail = await fetchDraft(params.mailbox, params.draft)
    if (!mail) {
        // check if mail sent before 404ing
        const mail = await db.query.Email.findFirst({
            where: and(
                eq(Email.id, params.draft),
                eq(Email.mailboxId, params.mailbox),
            ),
            columns: {
                id: true
            }
        })
        if (mail) return redirect(`/mail/${params.mailbox}/${params.draft}`)
        return notFound()
    }

    return (
        <form action={saveDraftAction.bind(null, params.mailbox, params.draft)} id="draft-form" className="size-full p-4 md:p-6 gap-4 flex flex-col overflow-auto" suppressHydrationWarning>
            <FromInput savedAlias={mail.from || defaultAlias?.alias || undefined} aliases={aliases} />
            <RecipientInput savedTo={mail.to || undefined} />
            <Subject savedSubject={mail.subject || undefined} />
            <br className="h-0" />
            <BodyEditor savedBody={mail.body || undefined} />

            <div className="flex gap-4">
                <button type='submit' hidden></button>
                <DeleteButton delAction={deleteDraftAction.bind(null, params.mailbox, params.draft)} />

                <p className='ms-auto text-sm text-muted-foreground self-center'>
                    Saved at <LocalTime type="hour-min/date" time={mail.updatedAt} />
                </p>
                {/* <Button variant="ghost" size="icon" onClick={() => toast.warning("Not implemented yet")}> */}
                <Button variant="ghost" size="icon" className="shrink-0">
                    <PaperclipIcon className='size-5' />
                </Button>
                <SendButton sendAction={sendEmailAction.bind(null, params.mailbox, params.draft)} />
            </div>
        </form>

    )
}