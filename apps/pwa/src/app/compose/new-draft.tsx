import { createDraftEmail } from "@/utils/data/queries/email-list";
import { useParams, useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Loading from "../email-item/loading";
import useSWR from "swr";
import { useRef } from "react";

export default function NewDraft() {
    const params = useParams<{ mailboxId: string }>()

    const i = useRef(new Date().toISOString())

    const { data: draftId } = useSWR(`new-draft-${i.current}`, async () => {
        return createDraftEmail(params.mailboxId!)
    })

    if (!draftId) return <Loading />

    return <><Navigate to={`/mail/${params.mailboxId}/draft/${draftId}`} replace /><Loading /></>
}
