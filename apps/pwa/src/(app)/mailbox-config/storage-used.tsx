import { Progress } from "@/components/ui/progress";
import { getMailbox } from "@/utils/data/queries/mailbox";
import { storageLimit } from "@emailthing/const/limits";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams } from "react-router-dom";

export default function StorageUsed() {
  const { mailboxId } = useParams<{ mailboxId: string }>();

  const mailbox = useLiveQuery(() => getMailbox(mailboxId!), [mailboxId]);

  return (
    <div className="flex max-w-[20rem] flex-col gap-2">
      <h2 className="font-semibold text-lg">Storage</h2>
      {mailbox ? (
        <Progress
          className="max-w-[20rem]"
          value={(mailbox.storageUsed / storageLimit[mailbox.plan] || 0.01) * 100}
        />
      ) : (
        <Progress className="max-w-[20rem]" value={0} />
      )}
      {mailbox ? (
        <p>
          Used: {Math.ceil((mailbox.storageUsed / 1e6) * 10) / 10}MB /{" "}
          {storageLimit[mailbox.plan] / 1e6}MB
        </p>
      ) : (
        <p>Used: 0MB / 100MB</p>
      )}
    </div>
  );
}
