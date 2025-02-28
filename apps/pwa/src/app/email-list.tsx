"use client"
import { useParams } from "react-router-dom"
import useSWR from "swr"
import MailLayout from "./mail/root-layout"
import { Suspense } from "react"
import Loading from "@/(email)/mail/[mailbox]/(email-list)/loading"
// import { createId } from "@paralleldrive/cuid2"

export default function EmailListSuspenced({ filter }: { filter: "inbox" | "drafts" | "sent" | "starred" | "trash" | "temp" }) {
    return <Suspense fallback={<Loading />}>
        <EmailList filter={filter} />
    </Suspense>
}

function EmailList({ filter }: { filter: "inbox" | "drafts" | "sent" | "starred" | "trash" | "temp" }) {
    const params = useParams<"mailboxId">()
    
    const { data, error, isLoading } = useSWR(`/api/emails/${params.mailboxId}?filter=${filter}`, async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [1, 2, 3, 4,];
    }, {})

    if (error) return <div>failed to load {filter} ({error})</div>
    if (isLoading) return <Loading />


    return (
        <div>
            {data?.map(e => <p key={e}>{e}</p>)}
            {params.mailboxId} ({filter})
        </div>
    )
}
