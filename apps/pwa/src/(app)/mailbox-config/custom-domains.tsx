import CopyButton from "@/components/copy-button.client";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SmartDrawer, SmartDrawerClose, SmartDrawerContent, SmartDrawerDescription,
  SmartDrawerFooter, SmartDrawerHeader,
  SmartDrawerTitle, SmartDrawerTrigger
} from "@/components/ui/smart-drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMailbox, getMailboxAliases, getMailboxCustomDomains } from "@/utils/data/queries/mailbox";
import { customDomainLimit } from "@emailthing/const/limits";
import { DISCORD_URL } from "@emailthing/const/urls";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  Loader2, MoreHorizontalIcon, PlusIcon, Trash2Icon
} from "lucide-react";
import { FormEvent, lazy, Suspense, useEffect, useState, useTransition } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { DeleteButton } from "./components.client";
import changeMailboxSettings from "./_api";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getTXT } from "@/utils/use-dns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const setCustomSend = async (mailboxId: string, domainId: string, url: string, key: string, type: "RESEND" | "EMAILTHING" | "DISABLED") => {
  return changeMailboxSettings(mailboxId, "set-custom-domain-send", { domainId, url, key, type });
}

const setDKIM = async (mailboxId: string, domainId: string, selector: string, privateKey: string) => {
  return changeMailboxSettings(mailboxId, "set-custom-domain-dkim", { domainId, selector, privateKey });
}
const deleteDKIM = async (mailboxId: string, domainId: string) => {
  return changeMailboxSettings(mailboxId, "set-custom-domain-dkim", { domainId, deleteDKIM: true });
}

export default function CustomDomains() {
  const { mailboxId } = useParams<{ mailboxId: string }>();

  const data = useLiveQuery(
    () => Promise.all([getMailbox(mailboxId!), getMailboxCustomDomains(mailboxId!), getMailboxAliases(mailboxId!)]),
    [mailboxId],
  );

  const [mailbox, customDomains, aliases] = data ?? [];

  return (
    <div className="max-w-[40rem]">
      <div className="flex pb-2 gap-2">
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
              <TableHead className="rounded-ss-md bg-sidebar">
                <p>Domain</p>
              </TableHead>
              <TableHead className="w-1 rounded-se-md bg-sidebar" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customDomains?.length ? (
              customDomains.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="//py-1 font-medium">{row.domain}</TableCell>
                  <TableCell className="//py-1">
                    <DropdownMenu modal={false}>
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

                        <DropdownMenuGroup>
                          <DropdownMenuItem asChild>
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Advanced</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <SmartDrawer repositionInputs={false}>
                                  <DropdownMenuItem asChild>
                                    <SmartDrawerTrigger className="w-full">Custom Send API</SmartDrawerTrigger>
                                  </DropdownMenuItem>
                                  <SmartDrawerContent className="sm:max-w-[425px]">
                                    <SetCustomSend mailboxId={mailboxId!} id={row.id} existingType={row.customSend ? row.customSend.type : undefined} existingURL={row.customSend ? row.customSend.url : undefined} />
                                  </SmartDrawerContent>
                                </SmartDrawer>
                                <SmartDrawer repositionInputs={false}>
                                  <DropdownMenuItem asChild>
                                    <SmartDrawerTrigger className="w-full">DKIM Settings</SmartDrawerTrigger>
                                  </DropdownMenuItem>
                                  <SmartDrawerContent className="sm:max-w-[425px]">
                                    <CustomDomainDKIMSettings mailboxId={mailboxId!} domainId={row.id} domain={row.domain} existingSelector={row.dkimSelector || undefined} />
                                  </SmartDrawerContent>
                                </SmartDrawer>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                        </DropdownMenuGroup>
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
    </div >
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
          onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            event.stopPropagation()
            setDomain((event.target as HTMLFormElement).domain.value);
            setPage("verify");
          }}
          autoComplete="off"
        >
          <label htmlFor="domain" className="sr-only">Domain</label>
          <Input
            className="border-none bg-secondary"
            name="domain"
            placeholder="example.com"
            defaultValue={domain}
            id="domain"
            autoFocus={window.innerWidth > 640}
            disabled={isPending}
            required
          />
          <Button type="submit" disabled={isPending} className="gap-2">
            {/* {isPending && <Loader2 className="size-5 text-muted-foreground animate-spin" />} */}
            Next <ChevronRightIcon className="size-4 shrink-0" />
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

        <div
          className="grid items-start gap-4 px-4 sm:px-0 max-sm:overflow-auto "
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input className="border-none bg-secondary" value={`_emailthing.${domain}`} id="name" readOnly />

            <Label htmlFor="type">Type</Label>
            <Input className="border-none bg-secondary" value="TXT" id="type" readOnly />

            <Label htmlFor="value">Value</Label>
            <div className="flex items-center gap-2">
              <Input className="border-none bg-secondary" value={`mailbox=${mailboxId}`} id="value" readOnly autoFocus />
              <Button size="sm" className="px-3" asChild>
                <CopyButton text={`mailbox=${mailboxId}`}>
                  <span className="sr-only">Copy</span>
                  <CopyIcon className="size-4" />
                </CopyButton>
              </Button>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            {/* <Button onClick={() => setPage("form")} className="gap-2" variant="secondary">
                            Back
                        </Button> */}
            <Button type="submit" onClick={verify} disabled={isPending} className="w-full gap-2 shrink">
              {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground shrink" />}
              Verify domain
            </Button>
          </div>

          <SmartDrawerClose asChild className="w-full sm:hidden mb-2">
            <Button variant="secondary">Cancel</Button>
          </SmartDrawerClose>
        </div>

        {/* <SmartDrawerFooter className="flex pt-2 sm:hidden">
          <SmartDrawerClose asChild>
            <Button variant="secondary">Cancel</Button>
          </SmartDrawerClose>
        </SmartDrawerFooter> */}
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
              <Button size="sm" className="px-3" asChild autoFocus>
                <CopyButton text="v=spf1 include:_spf.mx.emailthing.app include:_spf.mx.cloudflare.net -all">
                  <span className="sr-only">Copy</span>
                  <CopyIcon className="size-4" />
                </CopyButton>
              </Button>
            </div>

            <Label htmlFor="verification">
              <code className="font-semibold text-muted-foreground">TXT</code>
              <span className="flex items-center gap-0">
                <span className="text-muted-foreground">_emailthing.</span>
                {domain}
              </span>
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

          <div className="flex gap-2 sm:gap-3">
            <Button onClick={() => setPage("verify")} className="gap-2 shrink" variant="secondary" disabled>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button onClick={() => setPage("cf-worker-code")} className="w-full gap-2 shrink">
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
              <code className="font-mono h-52 text-xs overflow-auto rounded-md bg-[#17171e] p-2 w-full text-[#6A737D]">
                // Loading code...
              </code>
            }
          >
            <CfWorkerCode />
          </Suspense>

          <div className="flex gap-2 sm:gap-3">
            <Button onClick={() => setPage("spf")} className="gap-2 shrink" variant="secondary">
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              onClick={() => {
                setPage("token");
                cToken();
              }}
              className="w-full gap-2 shrink"
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

          <div className="flex gap-2 sm:gap-3">
            <Button onClick={() => setPage("cf-worker-code")} className="gap-2 shrink" variant="secondary">
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button onClick={() => setPage("finish")} className="w-full gap-2 shrink">
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

          <div className="flex gap-2 sm:gap-3">
            <Button onClick={() => setPage("token")} className="gap-2 shrink" variant="secondary">
              <ChevronLeftIcon className="size-4" />
            </Button>

            <SmartDrawerClose asChild>
              <Button className="w-full shrink">Close</Button>
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

export function SetCustomSend({
  mailboxId,
  id,
  existingType,
  existingURL,
  // secrent key not sent anywhere
}: { mailboxId: string; id: string; existingType?: "RESEND" | "EMAILTHING", existingURL?: string }) {
  const [isPending, startTransition] = useTransition();

  const formSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      const res = await setCustomSend(mailboxId, id, event.currentTarget.url.value, event.currentTarget.secretKey.value, event.currentTarget.type.value);
      if ('error' in res) {
        toast.error(res.error);
      } else {
        toast.success("Custom send API configuration updated!", { description: "Try to send an email to validate if it works" });
        document.getElementById("smart-drawer:close")?.click();
      }
    });
  };

  return (
    <>
      <SmartDrawerHeader>
        <SmartDrawerTitle>
          Set Custom Send API
        </SmartDrawerTitle>
        <SmartDrawerDescription>
          Instead of using EmailThing's sending infrastructure, you can use your own sending provider using this feature.
        </SmartDrawerDescription>
      </SmartDrawerHeader>


      <form className="grid items-start gap-4 px-4 sm:px-0" onSubmit={formSubmit}>
        <input type="text" name="fake_user" style={{ display: "none" }} />
        <input type="password" name="fake_pass" style={{ display: "none" }} />

        <div className="grid gap-2">
          <Label htmlFor="type">Type</Label>
          <Select
            name="type"
            disabled={isPending}
            defaultValue={existingType || "RESEND"}
          >
            <SelectTrigger className="w-full border-none bg-secondary">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="EMAILTHING" disabled>EmailThing API (schema)</SelectItem>
                <SelectItem value="RESEND">Resend API (schema)</SelectItem>
                {existingType && <SelectItem value="DISABLED">None (aka disabled)</SelectItem>}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Label htmlFor="url">URL</Label>
          <Input
            className="border-none bg-secondary"
            name="url"
            placeholder="https://api.resend.com"
            id="url"
            type="url"
            disabled={isPending}
            defaultValue={existingURL}
            autoFocus
            autoComplete="off"
          />

          <Label htmlFor="secretKey">Secret key</Label>
          <Input
            className="border-none bg-secondary"
            name="secretKey"
            placeholder="*****"
            id="secretKey"
            type="password"
            autoComplete="off"
            disabled={isPending}
          />
        </div>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
          {existingType ? "Update" : "Create"} custom send configuration
        </Button>
      </form>
      <SmartDrawerFooter className="sm:hidden"><SmartDrawerClose /></SmartDrawerFooter>

    </>
  );
}


// Helper to turn ArrayBuffer to base64
function ab2b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buf))));
}

function pkcs8ToPem(b64: string) {
  const lines = ["-----BEGIN PRIVATE KEY-----"];
  for (let i = 0; i < b64.length; i += 64) lines.push(b64.slice(i, i + 64));
  // lines.push(b64);
  lines.push("-----END PRIVATE KEY-----");
  return lines.join("\n");
}

const pemToArrayBuffer = (value: string): ArrayBuffer => {
  const clean = value
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
};

// DKIM Settings UI
export function CustomDomainDKIMSettings({ domain, mailboxId, domainId, existingSelector }: { domain: string; mailboxId: string; domainId: string; existingSelector?: string }) {
  const [pubB64, setPubB64] = useState<string>("");
  const [privPKCS8, setPrivPKCS8] = useState<ArrayBuffer | null>(null);
  const [dkimSelector, setDkimSelector] = useState<string>(existingSelector || "emailthing");

  const pem = pkcs8ToPem(ab2b64(privPKCS8!));
  const dkimValue = `v=DKIM1; k=rsa; p=${pubB64}`;

  async function handleGenerate(providedPem?: string) {
    try {
      if (providedPem?.trim()) {
        const pkcs8Raw = pemToArrayBuffer(providedPem);

        const privateKey = await window.crypto.subtle.importKey(
          "pkcs8",
          pkcs8Raw,
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          true,
          ["sign"]
        );

        const privateJwk = await window.crypto.subtle.exportKey("jwk", privateKey);
        if (!privateJwk.n || !privateJwk.e) throw new Error("Invalid private key");

        const publicKey = await window.crypto.subtle.importKey(
          "jwk",
          {
            kty: "RSA",
            n: privateJwk.n,
            e: privateJwk.e,
            alg: "RS256",
            ext: true,
            key_ops: ["verify"],
          },
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          true,
          ["verify"]
        );

        const pubRaw = await window.crypto.subtle.exportKey("spki", publicKey);
        setPubB64(ab2b64(pubRaw));
        setPrivPKCS8(pkcs8Raw);
        return;
      }
    } catch {
      toast.error("Invalid PEM provided. Generated a new key pair instead.");
    }

    const pair = await window.crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );

    const pubRaw = await window.crypto.subtle.exportKey("spki", (pair as CryptoKeyPair).publicKey);
    setPubB64(ab2b64(pubRaw));

    const privRaw = await window.crypto.subtle.exportKey("pkcs8", (pair as CryptoKeyPair).privateKey);
    setPrivPKCS8(privRaw);
  }

  useEffect(() => {
    handleGenerate();
  }, []);

  const [isPending, startTransition] = useTransition();

  const formSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      const dnsRes = await getTXT(`${dkimSelector}._domainkey.${domain}`);
      if (!dnsRes?.length) {
        toast.error("DNS record not set yet.", { description: "Please add the TXT record shown in the form and wait for it to propagate before saving." });
        return;
      }
      if (dnsRes.length > 1) {
        toast.error("Multiple TXT records found for this selector.", { description: "Please make sure there is only one TXT record for this selector and it matches the value shown in the form." });
        return;
      }
      if (dnsRes[0].replace(/\\?" ?/g, "") !== dkimValue) {
        toast.error("DNS record value is incorrect.", { description: "Please make sure the TXT record value matches the one shown in the form." });
        return;
      }

      const res = await setDKIM(mailboxId, domainId, dkimSelector, pkcs8ToPem(ab2b64(privPKCS8!)));
      if ('error' in res) {
        toast.error(res.error);
      } else {
        toast.success("Custom DKIM configuration saved!", { description: "Try to send an email to validate if it works" });
        document.getElementById("smart-drawer:close")?.click();
      }
    });
  };

  const formSubmitDelete = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      const res = await deleteDKIM(mailboxId, domainId);
      if ('error' in res) {
        toast.error(res.error);
      } else {
        toast.success("DKIM configuration deleted!");
        document.getElementById("smart-drawer:close")?.click();
      }
    });
  };


  return (
    <>
      <SmartDrawerHeader>
        <SmartDrawerTitle>
          Custom DKIM
        </SmartDrawerTitle>
        <SmartDrawerDescription>
          Sign your emails with DKIM by adding the folowing DNS record and saving this!
        </SmartDrawerDescription>
      </SmartDrawerHeader>
      <Tabs defaultValue="easy" className="px-4 sm:px-0">
        <TabsList className="w-full">
          <TabsTrigger value="easy" className="border-none">Easy</TabsTrigger>
          <TabsTrigger value="custom" className="border-none">Custom</TabsTrigger>
          {existingSelector && <TabsTrigger value="remove" className="border-none">Remove</TabsTrigger>}
        </TabsList>
        <TabsContent value="easy" asChild className="grid items-start gap-4">
          <form onSubmit={formSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="dkim">
                <code className="font-semibold text-muted-foreground">TXT</code>
                <span className="flex items-center gap-0">
                  {dkimSelector}
                  <span className="text-muted-foreground">._domainkey.</span>
                  {domain}
                </span>
              </Label>

              <div className="flex items-center gap-2">
                <Input
                  className="border-none bg-secondary font-mono"
                  value={dkimValue}
                  id="dkim"
                  readOnly
                  autoFocus
                />
                <Button size="sm" className="px-3" asChild>
                  <CopyButton text={dkimValue}>
                    <span className="sr-only">Copy</span>
                    <CopyIcon className="size-4" />
                  </CopyButton>
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={!privPKCS8} className="w-full gap-2">
              {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
              Save DKIM
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="custom" asChild className="grid items-start gap-4">
          <form onSubmit={formSubmit} >

            <div className="grid gap-2">
              <Label htmlFor="Private Key">
                Private Key
                <span className="text-muted-foreground"> (don't ever share this)</span>
              </Label>
              <Textarea
                className="border-none bg-secondary font-mono whitespace-nowrap overflow-x-auto"
                value={pem}
                onChange={(e) => handleGenerate(e.currentTarget.value)}
                id="dkim"
              />
              <Label htmlFor="Private Key">Selector</Label>
              <Input
                className="border-none bg-secondary font-mono"
                value={dkimSelector}
                onChange={(e) => setDkimSelector(e.target.value)}
                onBlur={() => dkimSelector.trim() === "" && setDkimSelector("emailthing")}
                id="dkim"
              />

              <SmartDrawerDescription className="mt-4">
                Now set the following value for that record (this is your public key, you can share it safely):
              </SmartDrawerDescription>

              <Label htmlFor="dkim">
                <code className="font-semibold text-muted-foreground">TXT</code>
                <span className="flex items-center gap-0">
                  {dkimSelector}
                  <span className="text-muted-foreground">._domainkey.</span>
                  {domain}
                </span>
              </Label>

              <div className="flex items-center gap-2">
                <Input
                  className="border-none bg-secondary font-mono"
                  value={dkimValue}
                  id="dkim"
                  readOnly
                  autoFocus
                />
                <Button size="sm" className="px-3" asChild>
                  <CopyButton text={dkimValue}>
                    <span className="sr-only">Copy</span>
                    <CopyIcon className="size-4" />
                  </CopyButton>
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={!privPKCS8} className="w-full gap-2">
              {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
              Save DKIM
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="remove" asChild className="grid items-start gap-4">
          <form onSubmit={formSubmitDelete}>
            <Button type="submit" variant="destructive" className="w-full gap-2 mt-4">
              {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
              Delete DKIM configuration
            </Button>
          </form>
        </TabsContent>
      </Tabs>
      <SmartDrawerFooter className="sm:hidden"><SmartDrawerClose /></SmartDrawerFooter>
    </>
  );
}

