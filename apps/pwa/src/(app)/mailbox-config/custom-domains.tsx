import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  SmartDrawer,
  SmartDrawerTrigger,
  SmartDrawerContent,
  SmartDrawerHeader,
  SmartDrawerTitle,
  SmartDrawerDescription,
  SmartDrawerFooter,
  SmartDrawerClose,
} from "@/components/ui/smart-drawer";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { getMailbox, getMailboxCustomDomains, getMailboxAliases } from "@/utils/data/queries/mailbox";
import { customDomainLimit } from "@emailthing/const/limits";
import { DISCORD_URL } from "@emailthing/const";
import { useLiveQuery } from "dexie-react-hooks";
import {
  PlusIcon,
  MoreHorizontalIcon,
  Trash2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  Loader2,
  ClipboardIcon,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { DeleteButton } from "./components.client";
import { toast } from "sonner";
import CopyButton from "@/components/copy-button.client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useTransition, Suspense, lazy } from "react";
import changeMailboxSettings from "./_api";
import { useSWRConfig } from "swr";

const CfWorkerCode = lazy(() => import("./custom-domain-dyn"));

const makeToken = async (mailboxId: string, name: string) => {
  const res = await changeMailboxSettings(mailboxId, "make-token", { name });
  if ("error" in res) {
    toast.error(res.error);
  } else {
    if (!res?.token) {
      toast.error("Failed to create token");
    } else {
      return { token: res?.token };
    }
  }
};

const verifyDomain = async (mailboxId: string, domain: string) => {
  return changeMailboxSettings(mailboxId, "verify-domain", { customDomain: domain });
};

const deleteCustomDomain = async (mailboxId: string, domainId: string) => {
  return changeMailboxSettings(mailboxId, "delete-custom-domain", { domainId });
};

export default function CustomDomains() {
  const { mailboxId } = useParams<{ mailboxId: string }>();

  const data = useLiveQuery(
    () => Promise.all([getMailbox(mailboxId!), getMailboxCustomDomains(mailboxId!), getMailboxAliases(mailboxId!)]),
    [mailboxId],
  );

  const [mailbox, customDomains, aliases] = data ?? [];

  return (
    <div className="max-w-[40rem]">
      <div className="flex pb-2">
        <h2 className="font-semibold text-lg">
          Custom domains <span className="text-muted-foreground text-sm">({customDomains?.length ?? 0}/3)</span>
        </h2>
        <SmartDrawer>
          <SmartDrawerTrigger asChild>
            <Button
              disabled={(customDomains?.length ?? 0) >= customDomainLimit[mailbox?.plan ?? "FREE"]}
              className="ms-auto flex gap-2"
              size="sm"
              variant="secondary"
            >
              <PlusIcon className="size-4" /> Add new domain
            </Button>
          </SmartDrawerTrigger>
          <SmartDrawerContent className="sm:max-w-[425px]">
            <AddCustomDomainForm mailboxId={mailboxId!} />
          </SmartDrawerContent>
        </SmartDrawer>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="rounded-t-lg">
              <TableHead className="rounded-ss-md bg-subcard">
                <p>Domain</p>
              </TableHead>
              <TableHead className="w-1 rounded-se-md bg-subcard" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customDomains?.length ? (
              customDomains.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="//py-1 font-medium">{row.domain}</TableCell>
                  <TableCell className="//py-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="size-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <SmartDrawer>
                          <DropdownMenuItem className="flex w-full gap-2" asChild>
                            <SmartDrawerTrigger>
                              <Trash2Icon className="size-5 text-muted-foreground" />
                              Delete domain
                            </SmartDrawerTrigger>
                          </DropdownMenuItem>

                          <SmartDrawerContent className="sm:max-w-[425px]">
                            <SmartDrawerHeader>
                              <SmartDrawerTitle>Delete Domain</SmartDrawerTitle>
                              <SmartDrawerDescription>
                                Are you sure you want to delete <strong>{row.domain}</strong>? This will also delete{" "}
                                <strong>
                                  {aliases?.filter((alias) => alias.alias.endsWith(`@${row.domain}`))?.length}
                                </strong>{" "}
                                aliases.
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
                              <DeleteButton action={deleteCustomDomain.bind(null, mailboxId!, row.id)} />
                            </SmartDrawerFooter>
                          </SmartDrawerContent>
                        </SmartDrawer>

                        <SmartDrawer repositionInputs={false}>
                          <DropdownMenuItem asChild>
                            <SmartDrawerTrigger className="w-full">Setup again</SmartDrawerTrigger>
                          </DropdownMenuItem>
                          <SmartDrawerContent className="sm:max-w-[425px]">
                            <AddCustomDomainForm mailboxId={mailboxId!} initialDomain={row.domain} />
                          </SmartDrawerContent>
                        </SmartDrawer>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className={`h-24 text-center ${!data ? "fade-in" : ""}`} colSpan={3}>
                  {data ? "No domains yet." : <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto" />}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function AddCustomDomainForm({ mailboxId, initialDomain = "" }: { mailboxId: string; initialDomain?: string }) {
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState<"form" | "verify" | "spf" | "cf-worker-code" | "token" | "finish">(
    initialDomain ? "spf" : "form",
  );
  const [domain, setDomain] = useState(initialDomain);
  const [token, setToken] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const verify = async () => {
    startTransition(async () => {
      const res = await verifyDomain(mailboxId, domain);
      if (res?.error) {
        toast.error(res.error);
      } else {
        setPage("spf");
        // document.getElementById("smart-drawer:close")?.click()
        toast("Domain verified!");
      }
    });
  };

  const cToken = async () => {
    if (token) return;
    startTransition(async () => {
      const token = await makeToken(mailboxId, `Cloudflare Worker (${domain})`);
      setToken(token?.token ?? "<failed to get, try to do it manually>");
      mutate(`/api/mailbox/${mailboxId}/settings`);
    });
  };

  // todo: add a way for user to add custom dkim config

  return (
    // <>
    page === "form" ? (
      <>
        <SmartDrawerHeader>
          <SmartDrawerTitle>Add Custom Domain</SmartDrawerTitle>
          <SmartDrawerDescription>Enter your domain to begin</SmartDrawerDescription>
        </SmartDrawerHeader>

        <form
          className="grid items-start gap-4 px-4 sm:px-0"
          onSubmit={(event: any) => {
            setDomain(event.target.domain.value);
            setPage("verify");
          }}
          autoComplete="off"
        >
          <Input
            className="border-none bg-secondary"
            name="domain"
            placeholder="example.com"
            defaultValue={domain}
            id="domain"
            autoFocus
            disabled={isPending}
            required
          />
          <Button type="submit" disabled={isPending} className="gap-2" autoFocus>
            {/* {isPending && <Loader2 className="size-5 text-muted-foreground animate-spin" />} */}
            Next <ChevronRightIcon className="size-4" />
          </Button>
        </form>

        <SmartDrawerFooter className="flex pt-2 sm:hidden">
          <SmartDrawerClose asChild>
            <Button variant="secondary">Cancel</Button>
          </SmartDrawerClose>
        </SmartDrawerFooter>
      </>
    ) : page === "verify" ? (
      <>
        <SmartDrawerHeader>
          <SmartDrawerTitle>Add Custom Domain</SmartDrawerTitle>
          <SmartDrawerDescription>Now create a new DNS record</SmartDrawerDescription>
        </SmartDrawerHeader>

        <div className="grid items-start gap-4 px-4 sm:px-0">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input className="border-none bg-secondary" value={`_emailthing.${domain}`} id="name" readOnly />

            <Label htmlFor="type">Type</Label>
            <Input className="border-none bg-secondary" value="TXT" id="type" readOnly />

            <Label htmlFor="value">Value</Label>
            <div className="flex items-center gap-2">
              <Input className="border-none bg-secondary" value={`mailbox=${mailboxId}`} id="value" readOnly />
              <Button size="sm" className="px-3" asChild>
                <CopyButton text={`mailbox=${mailboxId}`}>
                  <span className="sr-only">Copy</span>
                  <CopyIcon className="size-4" />
                </CopyButton>
              </Button>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-4">
            {/* <Button onClick={() => setPage("form")} className="gap-2" variant="secondary">
                            Back
                        </Button> */}
            <Button onClick={verify} disabled={isPending} className="w-full gap-2">
              {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              Verify domain
            </Button>
          </div>
        </div>

        <SmartDrawerFooter className="flex pt-2 sm:hidden">
          <SmartDrawerClose asChild>
            <Button variant="secondary">Cancel</Button>
          </SmartDrawerClose>
        </SmartDrawerFooter>
      </>
    ) : page === "spf" ? (
      <>
        <SmartDrawerHeader>
          <SmartDrawerTitle>
            Add SPF Records <span className="text-muted-foreground">(1/4)</span>
          </SmartDrawerTitle>
          <SmartDrawerDescription>Please add the following TXT DNS records to allow sending</SmartDrawerDescription>
        </SmartDrawerHeader>

        <div className="grid items-start gap-4 px-4 sm:px-0">
          <div className="grid gap-2">
            <Label htmlFor="spf">
              <code className="font-semibold text-muted-foreground">TXT</code> {domain}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                className="border-none bg-secondary"
                value="v=spf1 include:_spf.mx.emailthing.app include:_spf.mx.cloudflare.net -all"
                id="spf"
                readOnly
              />
              <Button size="sm" className="px-3" asChild>
                <CopyButton text="v=spf1 include:_spf.mx.emailthing.app include:_spf.mx.cloudflare.net -all">
                  <span className="sr-only">Copy</span>
                  <CopyIcon className="size-4" />
                </CopyButton>
              </Button>
            </div>

            <Label htmlFor="verification">
              <code className="font-semibold text-muted-foreground">TXT</code>
              <span className="text-muted-foreground">_emailthing.</span>
              {domain}
            </Label>
            <div className="flex items-center gap-2">
              <Input className="border-none bg-secondary" value={`mailbox=${mailboxId}`} id="verification" readOnly />
              <Button size="sm" className="px-3" asChild>
                <CopyButton text={`mailbox=${mailboxId}`}>
                  <span className="sr-only">Copy</span>
                  <CopyIcon className="size-4" />
                </CopyButton>
              </Button>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-4">
            <Button onClick={() => setPage("verify")} className="gap-2" variant="secondary" disabled>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button onClick={() => setPage("cf-worker-code")} className="w-full gap-2">
              Continue
            </Button>
          </div>
        </div>
        <SmartDrawerFooter className="sm:hidden" />
      </>
    ) : page === "cf-worker-code" ? (
      <>
        <SmartDrawerHeader>
          <SmartDrawerTitle>
            Create Cloudflare Email Worker <span className="text-muted-foreground">(2/4)</span>
          </SmartDrawerTitle>
          <SmartDrawerDescription>
            To receive emails create a catch-all{" "}
            <a
              href="https://developers.cloudflare.com/email-routing/email-workers/enable-email-workers/"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              email worker
            </a>{" "}
            for your domain with the following code:
          </SmartDrawerDescription>
        </SmartDrawerHeader>

        <div className="grid items-start gap-4 px-4 sm:px-0">
          <Suspense
            fallback={
              <code className="font-mono h-52 overflow-auto rounded-md bg-[#17171e] p-2 text-sm w-full text-[#6A737D]">
                // Loading code...
              </code>
            }
          >
            <CfWorkerCode />
          </Suspense>

          <div className="flex gap-2 sm:gap-4">
            <Button onClick={() => setPage("spf")} className="gap-2" variant="secondary">
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              onClick={() => {
                setPage("token");
                cToken();
              }}
              className="w-full gap-2"
            >
              Continue
            </Button>
          </div>
        </div>
        <SmartDrawerFooter className="sm:hidden" />
      </>
    ) : page === "token" ? (
      <>
        <SmartDrawerHeader>
          <SmartDrawerTitle>
            Create API Token <span className="text-muted-foreground">(3/4)</span>
          </SmartDrawerTitle>
          <SmartDrawerDescription>
            Add the <code className="font-semibold">token</code> environment variable to your worker
          </SmartDrawerDescription>
        </SmartDrawerHeader>

        <div className="grid items-start gap-4 px-4 sm:px-0">
          <Label htmlFor="alias">Your new token:</Label>
          <div className="flex items-center gap-2">
            {token ? (
              <>
                <Input className="border-none bg-secondary font-mono" name="token" value={token} id="token" readOnly />
                <Button type="submit" size="sm" className="px-3" asChild>
                  <CopyButton text={token}>
                    <span className="sr-only">Copy</span>
                    <CopyIcon className="size-4" />
                  </CopyButton>
                </Button>
              </>
            ) : (
              <div className="h-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex gap-2 sm:gap-4">
            <Button onClick={() => setPage("cf-worker-code")} className="gap-2" variant="secondary">
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button onClick={() => setPage("finish")} className="w-full gap-2">
              Continue
            </Button>
          </div>
        </div>
        <SmartDrawerFooter className="sm:hidden" />
      </>
    ) : page === "finish" ? (
      <>
        <SmartDrawerHeader>
          <SmartDrawerTitle>
            Custom Domain <span className="text-muted-foreground">(4/4)</span>
          </SmartDrawerTitle>
          <SmartDrawerDescription>
            You have successfully added <code className="font-semibold">{domain}</code> to your account.
          </SmartDrawerDescription>
        </SmartDrawerHeader>

        <div className="grid items-start gap-4 px-4 sm:px-0">
          <p>
            If you have any issues or questions, you can join our{" "}
            <a
              href={DISCORD_URL}
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Discord server
            </a>
            .
          </p>

          <div className="flex gap-2 sm:gap-4">
            <Button onClick={() => setPage("token")} className="gap-2" variant="secondary">
              <ChevronLeftIcon className="size-4" />
            </Button>

            <SmartDrawerClose asChild>
              <Button className="w-full">Close</Button>
            </SmartDrawerClose>
          </div>
        </div>
        <SmartDrawerFooter className="sm:hidden" />
      </>
    ) : (
      "uhh this isnt meant to happen"
    )
    // </>
  );
}
