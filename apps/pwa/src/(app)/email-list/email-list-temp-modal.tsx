"use client";

import CopyButton from "@/components/copy-button.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SmartDrawerClose,
  SmartDrawerDescription,
  SmartDrawerFooter,
  SmartDrawerHeader,
  SmartDrawerTitle,
} from "@/components/ui/smart-drawer";
import { db } from "@/utils/data/db";
import { getLogedInUserApi } from "@/utils/data/queries/user";
import { CopyIcon, Loader2 } from "lucide-react";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import changeMailboxSettings from "../mailbox-config/_api";

const makeTempEmail = async (mailboxId: string, domain: string, name: string) => {
  return changeMailboxSettings(mailboxId, "create-temp-alias", { domain, name });
};

export function CreateTempEmailForm({
  mailboxId,
  // domains = ["temp.emailthing.xyz"],
}: { mailboxId: string; domains?: string[] }) {
  const [isPending, startTransition] = useTransition();
  const [tempEmail, setTempEmail] = useState<string | null>(null);

  const { data: domains } = useSWR<string[]>(
    `/api/internal/mailbox/${mailboxId}/temp-aliases`,
    async () => {
      if (!mailboxId) return [];
      if (mailboxId === "demo") return [];

      let sync = await getLogedInUserApi();
      if (sync?.tokenNeedsRefresh) {
        await db.refreshToken();
        sync = await getLogedInUserApi();
      }

      const response = await fetch(
        `${sync?.apiUrl || ""}/api/internal/mailbox/${mailboxId}/temp-aliases`,
        {
          method: "GET",
          headers: {
            Authorization: `session ${sync?.token}`,
          },
        },
      );
      if (!response.ok) {
        return [];
      }
      return response.json() as Promise<string[]>;
    },
    {
      fallbackData: ["temp.emailthing.xyz"],
    }
  );

  const formSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      const res = await makeTempEmail(
        mailboxId,
        (event.target as HTMLFormElement).domain.value,
        (event.target as HTMLFormElement).name.value,
      );
      if ("error" in res) {
        toast.error(res.error);
      } else {
        setTempEmail(res?.success);
      }
    });
  };

  return tempEmail ? (
    <>
      <SmartDrawerHeader>
        <SmartDrawerTitle>Create Temp Email</SmartDrawerTitle>
        <SmartDrawerDescription>
          An expiring email. The emails received will also be deleted after a day.
        </SmartDrawerDescription>
      </SmartDrawerHeader>

      <div className="grid items-start gap-4 px-4 sm:px-0">
        <Label htmlFor="alias">Your new email:</Label>
        <div className="flex items-center gap-2">
          <Input
            className="border-none bg-secondary"
            name="alias"
            value={tempEmail}
            id="alias"
            readOnly
            disabled={isPending}
          />
          <Button type="submit" size="sm" className="px-3" asChild>
            <CopyButton text={tempEmail}>
              <span className="sr-only">Copy</span>
              <CopyIcon className="size-4" />
            </CopyButton>
          </Button>
        </div>
      </div>
      <SmartDrawerFooter className="flex pt-2">
        <SmartDrawerClose asChild>
          <Button variant="default" className="w-full">
            Close
          </Button>
        </SmartDrawerClose>
      </SmartDrawerFooter>
    </>
  ) : (
    <>
      <SmartDrawerHeader>
        <SmartDrawerTitle>Create Temp Email</SmartDrawerTitle>
        <SmartDrawerDescription>
          An expiring email. The emails received will also be deleted after a day.
        </SmartDrawerDescription>
      </SmartDrawerHeader>

      <form className="grid items-start gap-4 px-4 sm:px-0" onSubmit={formSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="domain">Domain</Label>
          <Select name="domain" defaultValue="temp.emailthing.xyz">
            <SelectTrigger className="w-full border-none bg-secondary">
              <SelectValue placeholder="Select Domain" />
            </SelectTrigger>
            <SelectContent>
              {domains?.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor="name">Name</Label>
          <Input
            className="border-none bg-secondary"
            autoFocus
            name="name"
            placeholder="John Doe"
            id="name"
            disabled={isPending}
          />
        </div>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
          Create
        </Button>
      </form>

      <SmartDrawerFooter className="flex pt-2 sm:hidden">
        <SmartDrawerClose asChild>
          <Button variant="secondary" className="w-full" autoFocus>
            Cancel
          </Button>
        </SmartDrawerClose>
      </SmartDrawerFooter>
    </>
  );
}
