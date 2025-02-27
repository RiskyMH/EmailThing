import { useParams } from "react-router-dom"
import useSWR from "swr"
import MailLayout from "./mail/root-layout"


export default function EmailList({ filter }: { filter: "inbox" | "drafts" | "sent" | "starred" | "trash" | "temp" }) {
    const params = useParams<"mailboxId">()
    const { data, error, isLoading } = useSWR(`/api/emails/${params.mailboxId}`, async () => ['1', '2', '3'])

    if (error) return <div>failed to load {filter}</div>
    if (isLoading) return <div>loading... {filter}</div>


    return (
        <div>
            {data?.map(e => <p key={e}>{e}</p>)}
            {params.mailboxId} ({filter})
        </div>
    )
}
