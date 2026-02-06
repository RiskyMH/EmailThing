import { createDraftEmail } from "@/utils/data/queries/email-list";
import { useRef } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import Loading from "../email-item/loading";

export default function NewDraft() {
  const params = useParams<{ mailboxId: string }>();
  const searchParams = useSearchParams()[0];

  const i = useRef(new Date().toISOString());

  const { data: draftId } = useSWR(`new-draft-${i.current}`, async () => {
    return createDraftEmail(params.mailboxId!, {
      reply: searchParams.get("reply") ?? undefined,
      replyAll: searchParams.get("replyAll") ?? undefined,
      forward: searchParams.get("forward") ?? undefined,
    });
  });

  if (!draftId) return <Loading />;

  return (
    <>
      <Navigate to={`/mail/${params.mailboxId}/draft/${draftId}`} replace />
      <Loading />
    </>
  );
}
