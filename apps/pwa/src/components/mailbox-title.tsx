import { getMailboxName } from "@/utils/data/queries/mailbox";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";

export function MailboxTitle({ mailboxId, title }: { mailboxId: string, title?: string | null}) {
    const mailboxName = useLiveQuery(async () => getMailboxName(mailboxId), [mailboxId]);
  
    useEffect(() => {
      if (!title) {
        if (mailboxName) {
            document.title = `${mailboxName} • EmailThing`;
        }
        else {
            document.title = "EmailThing";
        }
      }
      else {
        if (mailboxName) {
            document.title = `${title} • ${mailboxName} • EmailThing`;
        }
        else {
            document.title = `${title} • EmailThing`;
        }
      }
      return () => {
        document.title = "EmailThing";
      };
    }, [title, mailboxName]);
  
    return null;
  }
  