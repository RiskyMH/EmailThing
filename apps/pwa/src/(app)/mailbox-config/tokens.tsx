// import type { hideToken } from "@/(email)/mail/[mailbox]/config/page";
import CopyButton from "@/components/copy-button.client";
import LocalTime from "@/components/localtime.client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SmartDrawer,
  SmartDrawerClose,
  SmartDrawerContent,
  SmartDrawerDescription,
  SmartDrawerFooter,
  SmartDrawerHeader,
  SmartDrawerTitle,
  SmartDrawerTrigger
} from "@/components/ui/smart-drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/utils/data/db";
import { getMailbox } from "@/utils/data/queries/mailbox";
import { getLogedInUserApi } from "@/utils/data/queries/user";
import type { MailboxTokens } from "@emailthing/db";
import { useLiveQuery } from "dexie-react-hooks";
import type { InferSelectModel } from "drizzle-orm";
import { CopyIcon, Loader2, PlusIcon, XIcon } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { DeleteButton } from "./components.client";
import changeMailboxSettings from "./_api";

const deleteToken = async (mailboxId: string, tokenId: string) => {
  const res = await changeMailboxSettings(mailboxId, "delete-token", { tokenId });
  if ("error" in res) {
    toast.error(res.error);
  } else {
    toast.success(res?.success ?? "Token deleted");
  }
};

const makeToken = async (mailboxId: string, name: string) => {
  const res = await changeMailboxSettings(mailboxId, "make-token", { name });
  if ("error" in res) {
    toast.error(res.error);
  } else {
    toast.success(res?.success ?? "Token created");
    if (!res?.token) {
      toast.error("Failed to create token");
    } else {
      return { token: res?.token };
    }
  }
};

export default function APITokens() {
  const { mailboxId } = useParams<{ mailboxId: string }>();

  const mailbox = useLiveQuery(() => getMailbox(mailboxId!), [mailboxId]);

  const { data: tokens, ...a } = useSWR(
    `/api/internal/auth-query?type=mailbox-token:${mailboxId}`,
    async () => {
      if (!mailboxId) return;
      if (mailboxId === "demo") return [];

      let sync = await getLogedInUserApi();
      if (sync?.tokenNeedsRefresh) {
        await db.refreshToken();
        sync = await getLogedInUserApi();
      }

      const response = await fetch(
        `${sync?.apiUrl || ""}/api/internal/auth-query?type=mailbox-token:${mailboxId}`,
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
      return response.json() as Promise<InferSelectModel<typeof MailboxTokens>[]>;
    },
  );

  const { mutate } = useSWRConfig();

  return (
    <div className="max-w-[40rem]">
      <div className="flex pb-2 gap-2">
        <h2 className="font-semibold text-lg">API Tokens</h2>
        <SmartDrawer>
          <SmartDrawerTrigger asChild>
            <Button
              className="ms-auto flex gap-2"
              size="sm"
              variant="secondary"
              disabled={mailbox?.plan === "DEMO"}
            >
              <PlusIcon className="size-4" /> Create new token
            </Button>
          </SmartDrawerTrigger>
          <SmartDrawerContent className="sm:max-w-[425px]">
            <CreateTokenForm mailboxId={mailboxId!} />
          </SmartDrawerContent>
        </SmartDrawer>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="rounded-t-lg">
              <TableHead className="rounded-ss-md bg-sidebar">
                <p>Name</p>
                {/* also includes somewhat token */}
              </TableHead>
              <TableHead className="bg-sidebar">
                <p>Created</p>
              </TableHead>
              <TableHead className="bg-sidebar">
                <p>Expires</p>
              </TableHead>
              <TableHead className="w-1 rounded-se-md bg-sidebar" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens?.length ? (
              tokens.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="//py-1 font-medium">
                    {row.name ? (
                      <div className="flex flex-col">
                        <span>{row.name}</span>
                        <code className="text-muted-foreground">
                          {/* {hideToken(row.token)} */}
                          {/* its hidden via api now */}
                          {row.token}
                        </code>
                      </div>
                    ) : (
                      <code className="justify-center">{row.token}</code>
                    )}
                  </TableCell>
                  <TableCell className="//py-1">
                    <LocalTime time={new Date(row.createdAt)} />
                  </TableCell>
                  <TableCell className="//py-1">
                    {row.expiresAt ? <LocalTime time={new Date(row.expiresAt)} /> : "Never"}
                  </TableCell>
                  <TableCell className="//py-1">
                    <SmartDrawer>
                      <SmartDrawerTrigger
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon-sm",
                          className:
                            "p-0 text-muted-foreground hover:text-destructive cursor-pointer",
                        })}
                      >
                        <span className="sr-only">Delete token</span>
                        <XIcon className="size-4" />
                      </SmartDrawerTrigger>

                      <SmartDrawerContent className="sm:max-w-[425px]">
                        <SmartDrawerHeader>
                          <SmartDrawerTitle>Delete Token</SmartDrawerTitle>
                          <SmartDrawerDescription>
                            Are you sure you want to delete this token? This cannot be undone.
                          </SmartDrawerDescription>
                        </SmartDrawerHeader>
                        <SmartDrawerFooter className="flex pt-2">
                          <SmartDrawerClose
                            className={buttonVariants({
                              variant: "secondary",
                            })}
                          >
                            Cancel
                          </SmartDrawerClose>
                          <DeleteButton action={async () => {
                            await deleteToken(mailboxId!, row.id);
                            mutate(`/api/internal/auth-query?type=mailbox-token:${mailboxId}`);
                          }} />
                        </SmartDrawerFooter>
                      </SmartDrawerContent>
                    </SmartDrawer>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className={`h-24 text-center ${!tokens ? "fade-in" : ""}`} colSpan={4}>
                  {tokens ? (
                    "No tokens yet."
                  ) : (
                    <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <br />
      If you would like to send emails via the API, see the documentation here:{" "}
      <a href="/docs/api" target="_blank" className="font-bold hover:underline" rel="noreferrer">
        API Documentation
      </a>
      <br />
    </div>
  );
}

export function CreateTokenForm({ mailboxId }: { mailboxId: string }) {
  const [isPending, startTransition] = useTransition();
  const [token, setToken] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const formSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      // @ts-expect-error
      const res = await makeToken(mailboxId, event.target.name.value);
      if (res?.token) {
        setToken(res.token);
        mutate(`/api/internal/auth-query?type=mailbox-token:${mailboxId}`);
      }
    });
  };

  return token ? (
    <>
      <SmartDrawerHeader>
        <SmartDrawerTitle>Create Token</SmartDrawerTitle>
        <SmartDrawerDescription>
          A token to use with the API. This will only be shown once.
        </SmartDrawerDescription>
      </SmartDrawerHeader>

      <div className="grid items-start gap-4 px-4 sm:px-0">
        <Label htmlFor="alias">Your new token:</Label>
        <div className="flex items-center gap-2">
          <Input
            className="border-none bg-secondary font-mono"
            name="token"
            value={token}
            id="token"
            readOnly
            disabled={isPending}
          />
          <Button type="submit" size="sm" className="px-3" asChild>
            <CopyButton text={token}>
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
        <SmartDrawerTitle>Create Token</SmartDrawerTitle>
        <SmartDrawerDescription>A token to use with the API.</SmartDrawerDescription>
      </SmartDrawerHeader>

      <form className="grid items-start gap-4 px-4 sm:px-0" onSubmit={formSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            className="border-none bg-secondary"
            autoFocus
            name="name"
            placeholder="Local dev"
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
          <Button variant="secondary" className="w-full">
            Cancel
          </Button>
        </SmartDrawerClose>
      </SmartDrawerFooter>
    </>
  );
}
