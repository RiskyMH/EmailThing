import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getMailboxName } from "@/utils/data/queries/mailbox";
import { useLiveQuery } from "dexie-react-hooks";
import { InfoIcon } from "lucide-react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Aliases from "./aliases";
import Categories from "./categories";
import CustomDomains from "./custom-domains";
import StorageUsed from "./storage-used";
import APITokens from "./tokens";
import Users from "./users";
import { MailboxTitle } from "@/components/mailbox-title";

export default function ConfigPage() {
  return (
    <div className="flex min-w-0 flex-col gap-5 p-5 bg-background sm:rounded-tl-lg overflow-auto">
      <h1 className="font-semibold text-2xl">Mailbox Config</h1>
      <DemoWarning />

      <StorageUsed />
      <Aliases />
      <Categories />
      <CustomDomains />
      <APITokens />
      <Users />

      {/* <br /> */}
    </div>
  );
}

function DemoWarning() {
  const { mailboxId } = useParams<{ mailboxId: string }>();

  const mailbox = useLiveQuery(() => getMailboxName(mailboxId!), [mailboxId]);

  useEffect(() => {
    if (mailbox) {
      document.title = `Config • ${mailbox} • EmailThing`;
    } else {
      document.title = "Config • EmailThing";
    }
    return () => {
      document.title = "EmailThing";
    };
  }, [mailbox]);

  // if demo, warn in yellow that it's a demo
  if (mailboxId === "demo")
    return (
      <Alert variant="warning" className="max-w-[40rem]">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Demo Mailbox</AlertTitle>
        <AlertDescription className="text-balance">
          This is a demo and fake local mailbox. Some features may not actually work.
        </AlertDescription>
      </Alert>
    );
  return null;
}
