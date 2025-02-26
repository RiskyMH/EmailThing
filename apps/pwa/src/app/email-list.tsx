import { useParams } from "react-router-dom"
import useSWR from "swr"


export default function EmailList() {
    const params = useParams<"mailboxId">()
    const { data, error, isLoading } = useSWR(`/api/emails/${params.mailboxId}`, async () => ['1', '2', '3'])

    if (error) return <div>failed to load</div>
    if (isLoading) return <div>loading...</div>


    return (
        <div>
            {data?.map(e => <p key={e}>{e}</p>)}
            {params.mailboxId}
        </div>
    )
}
