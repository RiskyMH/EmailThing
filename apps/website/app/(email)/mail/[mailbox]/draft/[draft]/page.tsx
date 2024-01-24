import { prisma } from "@email/db"
import { BodyEditor, FromInput, RecipientInput, SendButton, Subject } from "./editor.client"
import { getCurrentUser } from "@/app/utils/user"
import { notFound } from "next/navigation"
import { mailboxAliases, userMailboxAccess } from "../../tools"
import { saveDraftAction, sendEmailAction } from "./actions"
import { Recipient } from "./types"

// TODO: actually put title
export const metadata = {
    title: "Drafts",
}

export default async function DraftPage({
    params
}: {
    params: {
        mailbox: string,
        draft: string
    }

}) {
    const userId = await getCurrentUser()
    const userHasAccess = await userMailboxAccess(params.mailbox, userId)
    if (!userHasAccess) return notFound()

    const { aliases, default: defaultAlias } = await mailboxAliases(params.mailbox)

    const mail = await prisma.draftEmail.findFirst({
        where: {
            id: params.draft,
            mailboxId: params.mailbox,
        },
        select: {
            body: true,
            subject: true,
            from: true,
            to: true
        }
    })
    if (!mail) return notFound()


    const saveAction = saveDraftAction.bind(null, params.mailbox, params.draft)
    const sendAction = sendEmailAction.bind(null, params.mailbox, params.draft)

    const to = mail.to ? JSON.parse(mail.to) as Recipient[] : undefined

    let isValid = null;
    if (!mail.subject) {
        isValid = "Subject is required";
    } else if (!mail.body) {
        isValid = "Body is required";
    } else if (!mail.from) {
        isValid = "From is required";
    } else if (!to || [...to].filter(e => !e.cc).length <= 0) {
        isValid = "At least one recipient is required";
    }

    return (
        <div className="w-full p-4 md:p-8 gap-4 flex flex-col">
            <div className="flex items-center gap-4">
                <SendButton sendAction={sendAction} isValid={isValid} />
                <FromInput savedAlias={mail.from || defaultAlias?.alias} aliases={aliases} saveAction={saveAction} />
            </div>

            <RecipientInput savedTo={to} saveAction={saveAction} />
            <Subject savedSubject={mail.subject ?? undefined} saveAction={saveAction} />
            <br className="h-4" />
            <BodyEditor savedBody={mail.body ?? undefined} saveAction={saveAction} />
        </div>
    )
}