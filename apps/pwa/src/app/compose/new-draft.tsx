import { createDraftEmail } from "@/utils/data/queries/email-list";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Loading from "../email-item/loading";
import useSWR from "swr";
import { useRef } from "react";

export default function NewDraft() {
    const params = useParams<{ mailboxId: string }>()
    const searchParams = useSearchParams()[0]

    const i = useRef(new Date().toISOString())

    const { data: draftId } = useSWR(`new-draft-${i.current}`, async () => {
        return createDraftEmail(params.mailboxId!, {
            reply: searchParams.get("reply") ?? undefined,
            replyAll: searchParams.get("replyAll") ?? undefined,
            forward: searchParams.get("forward") ?? undefined
        })
    })

    if (!draftId) return <Loading />

    return <><Navigate to={`/mail/${params.mailboxId}/draft/${draftId}`} replace /><Loading /></>
}
