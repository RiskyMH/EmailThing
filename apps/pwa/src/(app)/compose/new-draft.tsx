import { createDraftEmail } from "@/utils/data/queries/email-list";
import { useRef, useState, useEffect } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import Loading from "../email-item/loading";

export default function NewDraft() {
  const params = useParams<{ mailboxId: string }>();
  const searchParams = useSearchParams()[0];
  const [draftId, setDraftId] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    createDraftEmail(params.mailboxId!, {
      reply: searchParams.get("reply") ?? undefined,
      replyAll: searchParams.get("replyAll") ?? undefined,
      forward: searchParams.get("forward") ?? undefined,
    }).then(setDraftId);
  }, []);

  if (!draftId) return <Loading />;

  return (
    <>
      <Navigate to={`/mail/${params.mailboxId}/draft/${draftId}`} replace />
      <Loading />
    </>
  );
}
