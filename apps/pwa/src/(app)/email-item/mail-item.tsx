"use client";
import LocalTime from "@/components/localtime.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getEmailWithDetails, updateEmailProperties } from "@/utils/data/queries/email-list";
import { getMailboxName } from "@/utils/data/queries/mailbox";
import { useEmailImage } from "@/utils/fetching";
import { cn } from "@/utils/tw";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ChevronDown,
  ChevronRight,
  CodeIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  FileArchiveIcon,
  FileTextIcon,
  ImageIcon,
  Loader2,
  type LucideIcon,
  PaperclipIcon,
  VideoIcon,
} from "lucide-react";
import { parse as markedParse } from "marked";
import { Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Loading from "./loading";
import TopButtons from "./mail-item-top-buttons";
import { parseHTML } from "./parse-html";
import { MailboxTitle } from "@/components/mailbox-title";
import { getLogedInUserApi } from "@/utils/data/queries/user";
import { db } from "@/utils/data/db";
import { DBEmail } from "@/utils/data/types";
import { API_URL } from "@emailthing/const/urls";

export default function MailItemSuspense({ mailId }: { mailId?: string }) {
  if (typeof window === "undefined") return <Loading />;
  return (
    <Suspense fallback={<Loading />}>
      <MailItem mailId={mailId} />
    </Suspense>
  );
}

function MailItem({ mailId }: { mailId?: string }) {
  const params = useParams<"mailboxId" | "mailId">();
  const searchParams = useSearchParams()[0];
  const mailboxId = params.mailboxId || "demo";
  const emailId = mailId || params.mailId || searchParams.get("mailId") || "";
  const navigate = useNavigate();

  const email = useLiveQuery(async () => {
    if (!emailId) return;
    const d = await getEmailWithDetails(mailboxId, emailId);
    return d;
  }, [mailboxId, emailId]);

  const isSyncing = useLiveQuery(async () => {
    if (email === null) {
      const syncing = await db.localSyncData.toArray();
      return syncing?.some((s) => s.isSyncing);
    }
    return true;
  }, [email]);

  const updateEmail = async (updates: Record<string, any>, { auto }: { auto?: boolean } = {}) => {
    if (mailboxId === "demo") {
      toast("This is a demo - changes won't actually do anything", {
        description: "But you can see how it would work in the real app!",
      });
    } else if (!navigator.onLine) {
      toast.info("You are offline - changes will be synced when you come back online");
    }
    const upd = updateEmailProperties.bind(null, mailboxId, emailId, updates);
    if (updates.binnedAt) {
      if (window.location.search.includes("mailId")) {
        const s = new URLSearchParams(window.location.search);
        s.delete("mailId");
        await navigate({ search: s.toString() });
        await upd();
      }

      if (history.length > 1) {
        await upd(false);
        const sync = db.sync();
        await navigate(-1);
        if (window.location.search.includes("mailId")) {
          const s = new URLSearchParams(window.location.search);
          if (s.get("mailId") === emailId) {
            s.delete("mailId");
            await navigate({ search: s.toString() }, { replace: true });
          }
        }
        await sync;
      }
      navigate(`/mail/${mailboxId}`);
      await upd();
    } else return await upd();
  };

  const lastEmailId = useRef<string | null>(null);
  useEffect(() => {
    if (!email) return;

    // the onClick will ensure for that
    if (window.location.search.includes("mailId")) return;

    if (lastEmailId.current !== email.id) {
      lastEmailId.current = email.id;
      if (!email.isRead) {
        updateEmail({ isRead: true }, { auto: true });
      }
    }
  }, [email]);

  if (!params.mailboxId) return <Loading />;

  if (!emailId) return (
    <div className="flex size-full flex-col items-center justify-center [.emailslist_&]:bg-background rounded-lg bg-background">
      <p className="text-muted-foreground">Select an email to view</p>
      {/* <MailboxTitle mailboxId={params.mailboxId} /> */}
    </div>
  )

  if (email === null) {
    if (isSyncing) {
      return (
        <>
          <Loading />
          <MailboxTitle mailboxId={mailboxId} />
        </>
      );
    }
    return (
      <div className="flex size-full flex-col items-center justify-center [.emailslist_&]:bg-background rounded-lg bg-background">
        <p className="text-muted-foreground">Email not found</p>
        <MailboxTitle mailboxId={mailboxId} />
      </div>
    )
  }
  if (!(email && emailId))
    return (
      <>
        <Loading />
        <MailboxTitle mailboxId={mailboxId} />
      </>
    );


  // const attachmentsPresigned = []

  return (
    <div className="flex size-full min-w-0 flex-col //gap-3 [.emailslist_&]:p-0 bg-background [.emailslist_&]:rounded-lg">
      <TopButtons
        mailboxId={mailboxId}
        emailId={email.id}
        email={email}
        onUpdateEmail={updateEmail}
      />
      <div className="flex gap-3 flex-col overflow-y-auto rounded-lg pt-3 p-3 [.emailslist_&]:p-0 [.emailslist_&]:pt-3 [.emailslist_&]:rounded-none">
        <MailboxTitle mailboxId={mailboxId} title={email.subject} />

        <h1 className="mt-3 break-words px-3 font-bold text-2xl @xl:text-3xl">{email.subject}</h1>
        <div className="flex flex-col gap-3 bg-card [.emailslist_&]:rounded-none rounded-md">
          {/* from info and gravatar */}
          <div className="flex gap-2 p-3 pb-0">
            <EmailPicture
              email={email.sender?.address || ""}
              fallback={(email.sender?.name || email.sender?.address || "")
                ?.slice(0, 2)
                .toUpperCase()}
            />

            <div className="flex flex-col overflow-hidden">
              <div className="flex gap-2 text-ellipsis whitespace-nowrap">
                <b className="font-bold">{email.sender?.name || email.sender?.address}</b>
                {email.sender?.name && (
                  <p className="text-muted-foreground text-sm">{`<${email.sender.address}>`}</p>
                )}
              </div>
              <div className="flex text-muted-foreground text-sm">
                <p className="self-center overflow-hidden break-words">
                  to {email.recipients.map((e) => e.name || e.address).join(", ")}
                </p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="auto"
                      className="-my-1 ms-1 rounded-full p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                      <ChevronDown className="size-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-screen sm:w-96">
                    <div className="grid gap-2 text-sm">
                      <div className="grid grid-cols-5 items-center gap-4">
                        <p className="text-end text-muted-foreground">from:</p>
                        <p className="col-span-4 flex gap-1 overflow-y-auto whitespace-nowrap ">
                          {email.sender?.name || email.sender?.address}
                          {email.sender?.name && (
                            <span className="text-muted-foreground">
                              &lt;{email.sender.address}
                              &gt;
                            </span>
                          )}
                        </p>
                      </div>

                      {/* to */}
                      <div className="grid grid-cols-5 items-center gap-4">
                        <p className="text-end text-muted-foreground">to:</p>
                        <div className="col-span-4 overflow-y-auto">
                          {email.recipients
                            .filter((e) => !e.cc)
                            .map((e) => (
                              <p key={e.address} className="flex gap-1 whitespace-nowrap">
                                {e.name || e.address}
                                {e.name && (
                                  <span className="text-muted-foreground">
                                    &lt;
                                    {e.address}
                                    &gt;
                                  </span>
                                )}
                              </p>
                            ))}
                        </div>
                      </div>

                      {/* cc */}
                      {email.recipients.some((e) => e.cc) && (
                        <div className="grid grid-cols-5 items-center gap-4">
                          <p className="text-end text-muted-foreground">cc:</p>
                          <div className="col-span-4 overflow-y-auto">
                            {email.recipients
                              .filter((e) => e.cc)
                              .map((e) => (
                                <p key={e.address} className="flex gap-1 whitespace-nowrap">
                                  {e.name || e.address}
                                  {e.name && (
                                    <span className="text-muted-foreground">
                                      &lt;
                                      {e.address}
                                      &gt;
                                    </span>
                                  )}
                                </p>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* date */}
                      <div className="grid grid-cols-5 items-center gap-4">
                        <p className="text-end text-muted-foreground">date:</p>
                        <p className="col-span-4 flex gap-1">
                          {email.createdAt.toLocaleString("en-US", { timeZone: "UTC" })}
                          <span className="text-muted-foreground">(UTC)</span>
                        </p>
                      </div>

                      {/* subject */}
                      <div className="grid grid-cols-5 items-center gap-4">
                        <p className="text-end text-muted-foreground">subject:</p>
                        <p className="col-span-4 overflow-y-auto">{email.subject}</p>
                      </div>

                      {/* reply to */}
                      {!!email.replyTo && (
                        <div className="grid grid-cols-5 items-center gap-4">
                          <p className="text-end text-muted-foreground">reply to:</p>
                          <p className="col-span-4 overflow-y-auto">{email.replyTo}</p>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <LocalTime
              className="ms-auto mt-2 hidden text-muted-foreground text-sm @2xl:inline"
              time={email.createdAt}
              type="full"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="ms-auto flex rounded-full p-2 hover:bg-background @2xl:ms-0"
                  variant="ghost"
                  size="icon"
                >
                  <EllipsisVerticalIcon className="size-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[10rem] ">
                <ViewSelect htmlValid={!!email.html} />
                {email.raw !== "draft" && (
                  <DownloadEmailButtons emailId={email.id} mailboxId={mailboxId} raw={email.raw} />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* attachments */}
          {email.attachments.length > 0 && (
            <div className="grid grid-cols-1 gap-2 px-3 @md:grid-cols-2 @3xl:grid-cols-3 @7xl:grid-cols-4">
              <AttachmentsList emailId={email.id} mailboxId={mailboxId} attachments={email.attachments} />
            </div>
          )}
          <EmailContent
            body={email.body}
            html={email.html || null}
            subject={email.subject || null}
            sender={email.sender?.address || null}
            id={email.id}
          />
        </div>
      </div>

      {/* // TODO: show references snippets for email */}
    </div>
  );
}


function EmailContent({
  body,
  html,
  subject,
  sender,
  id,
}: { body: string; html?: string | null; subject?: string | null; sender?: string | null; id: string }) {
  const searchParams = useSearchParams()[0];
  const lastView = localStorage?.getItem("email-item:last-view");
  const view = (searchParams.get("view") ||
    (lastView?.startsWith("html") && !html ? "html" : lastView) ||
    "html") as "text" | "markdown" | "html" | "html-raw";

  const ref = useRef<HTMLIFrameElement>(null);
  const [htmlLoaded, setHtmlLoaded] = useState<any>(false);
  const heights = useRef<Record<string, number>>({});

  useEffect(() => {
    if (ref.current) {
      // @ts-expect-error idk why its not documented in react
      ref.current.credentialless = true;
    }
    if (heights.current[id]) {
      setHtmlLoaded(true)
      if (ref.current) {
        ref.current.style.height = `${heights.current[id]}px`;
      }
    } else {
      setHtmlLoaded(false);
      if (ref.current) {
        ref.current.style.height = "0px";
      }
    }
    const handleResize = requestAnimationFrame.bind(null, () => {
      setHtmlLoaded(true);
      if (ref.current?.contentWindow?.document.documentElement) {
        heights.current[id] = ref.current.contentWindow.document.documentElement.offsetHeight + 1;
        ref.current.style.height = `${heights.current[id]}px`;
      } else if (ref.current) {
        ref.current.style.height = "calc(100vh - 100px)";
      }
    });
    window.addEventListener("resize", handleResize);
    ref.current?.addEventListener("load", handleResize);
    ref.current?.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleResize);

    if (ref.current) new ResizeObserver(handleResize).observe(ref.current);
    return () => {
      window.removeEventListener("resize", handleResize);
      ref.current?.removeEventListener("load", handleResize);
      document.removeEventListener("visibilitychange", handleResize);
      if (ref.current) new ResizeObserver(handleResize).unobserve(ref.current);
    };
  }, [html, view, body]);

  if (view === "text") {
    return (
      <p className="overflow-auto whitespace-pre-wrap break-words p-3 pt-0 leading-normal">
        {body}
      </p>
    );
  }
  if (view === "markdown" || (view === "html" && !html)) {
    return (
      <div
        className="prose dark:prose-invert max-w-full overflow-auto break-words p-3 pt-0"
        dangerouslySetInnerHTML={{
          __html: parseHTML(markedParse(body, { breaks: true, async: false }), false),
        }}
      />
    );
  }
  if (view === "html") {
    return (
      <>
        <iframe
          ref={ref}
          className="w-full rounded-b-lg [.emailslist_&]:rounded-b-none overflow-auto bg-background dark:bg-card border-card border-2 border-t-0 dark:border-0 [.emailslist_&]:border-0!"
          style={{ height: heights.current[id] ? `${heights.current[id]}px` : "0px", maxHeight: "100%" }}
          sandbox="allow-popups allow-same-origin"
          srcDoc={genericHtml(parseHTML(html || body, true), sender)}
          title={subject || "The Email"}
          referrerPolicy="no-referrer"
        />
        {htmlLoaded !== true && <EmailContentSpinner className="h-36" />}
      </>
    );
  }
  if (view === "html-raw") {
    return (
      <p className="h-full overflow-x-auto whitespace-pre rounded-b-lg [.emailslist_&]:rounded-b-none bg-background p-3 font-mono text-sm leading-normal">
        {html || body}
      </p>
    );
  }

  return null;
}

export function genericHtml(html: string, sender?: string | null) {
  if (html.startsWith("<!DOCTYPE html")) return html;

  const added = new Set<string>();
  added.add('<base target="_blank"><meta name="referrer" content="no-referrer">');

  if (!html.includes("color:") && !html.includes("background:")) {
    // check that it isnt already dark only or light only
    if (!(html.includes('meta content="light') || html.includes(`meta content="dark"`))) {
      added.add(`<meta content="light dark" name="color-scheme">`);
    }
  }
  if (!html.includes("font-family:")) {
    added.add("<style>body{font-family: Arial, sans-serif;}</style>");
  }

  const isStyled = /<style|style=/i.test(html.replaceAll(/<img[^>]*>/g, ""));

  if (sender === "notifications@github.com") {
    added.add(`<meta content="light dark" name="color-scheme">`);
    if (html.includes(`<pre style="color:#555"`)) {
      added.add("<style>@media(prefers-color-scheme:dark){pre{color:#aaa!important;}}</style>");
    }
  }
  if (sender === "notifications@github.com" || !isStyled) {
    added.add("<style>body > :first-child { margin-top: 0px; }</style>");
    added.add("<style>body{margin:12px; margin-top:5px}</style>");
    html = html.replace(/<p>\s*<\/p>/, "");
  }

  return [...added, html].join("\n");
}

function EmailContentSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn("fade-in flex h-screen w-full flex-col items-center justify-center", className)}
    >
      <Loader2 className="size-12 animate-spin text-muted-foreground" />
    </div>
  );
}

function ViewSelect({ htmlValid = false }: { htmlValid?: boolean }) {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const view = searchParams.get("view") || localStorage?.getItem("email-item:last-view") || "html";

  function onValueChange(v: string) {
    if (!v.endsWith("-raw")) localStorage.setItem("email-item:last-view", v);
    const search = new URLSearchParams(window.location.search);
    search.set("view", v);
    navigate({ search: search.toString() });
  }
  const shownValue =
    !htmlValid && view.startsWith("html") ? "markdown" : view === "html-raw" ? "html" : view;

  return (
    <DropdownMenuRadioGroup value={shownValue} onValueChange={onValueChange}>
      <DropdownMenuRadioItem value="text">Text</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="markdown" defaultChecked>
        Markdown
      </DropdownMenuRadioItem>
      <DropdownMenuSub>
        <DropdownMenuPrimitive.SubTrigger asChild disabled={!htmlValid}>
          <DropdownMenuRadioItem value="html" disabled={!htmlValid}>
            HTML
            <ChevronRight className="ms-auto size-4" />
          </DropdownMenuRadioItem>
        </DropdownMenuPrimitive.SubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={view} onValueChange={onValueChange}>
              <DropdownMenuRadioItem value="html" disabled={!htmlValid}>
                HTML rendered
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="html-raw" disabled={!htmlValid}>
                HTML raw
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuRadioGroup>
  );
}

function size(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}

const attachmentExtensionMap = {
  // images
  png: ImageIcon,
  jpg: ImageIcon,
  jpeg: ImageIcon,
  gif: ImageIcon,

  // videos
  mp4: VideoIcon,
  mov: VideoIcon,
  avi: VideoIcon,
  doc: VideoIcon,

  // documents
  docx: FileTextIcon,
  pdf: FileTextIcon,

  // zip
  zip: FileArchiveIcon,
  rar: FileArchiveIcon,
  "7z": FileArchiveIcon,
} as Record<string, LucideIcon>;

function GetAttachmentIcon(extension: string) {
  const ReturnIcon = attachmentExtensionMap[extension] || PaperclipIcon;
  return <ReturnIcon className="size-5 text-muted-foreground" />;
}

function EmailPicture({ email, fallback }: { email: string; fallback?: string }) {
  const img = useEmailImage(email);
  const isGravatar = !img || img.startsWith("https://www.gravatar.com/avatar/");

  return (
    <Avatar
      className={
        "size-12 bg-background data-[gravatar=false]:rounded-lg data-[gravatar=true]:rounded-full data-[gravatar=false]:[&>img]:rounded-[20%] data-[gravatar=false]:[&>img]:p-2"
      }
      data-gravatar={isGravatar}
    >
      {/* somehow svgl doesn't like crossOrigin=anonymous */}
      <AvatarImage src={img} /*crossOrigin={isGravatar ? "anonymous" : undefined}*/ />
      <AvatarFallback className="bg-background">{fallback}</AvatarFallback>
    </Avatar>
  );
}

function DownloadEmailButtons({ emailId, mailboxId, raw }: { emailId: string; mailboxId: string, raw: string }) {
  const api = useLiveQuery(getLogedInUserApi)

  const apiIfy = (pathname: string) => {
    if (!api) return pathname;
    const a = new URL(('apiUrl' in api ? api.apiUrl : API_URL))
    const parts = pathname.split("?")
    a.pathname = (`${a.pathname}/api/internal${parts[0]}`).replaceAll("//", "/")
    if (a.pathname.startsWith('/')) a.pathname = a.pathname.slice(1)
    a.search = parts[1] || ""
    a.searchParams.set((crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, ""), "useless-spacer")
    a.searchParams.set("session", api.token!)
    a.searchParams.set((crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, ""), "useless-spacer")
    return a.toString()
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="flex w-full cursor-pointer gap-2" asChild>
        <a
          target="_blank"
          // intentionally not show the token for on hover
          href={`/mail/${mailboxId}/${emailId}/raw`}
          rel="noreferrer"
          onClick={(e) => {
            window.open(apiIfy(`/mailbox/${mailboxId}/mail/${emailId}/raw?type=eml`), "_blank");
            e.preventDefault()
          }}
        >
          <CodeIcon className="size-5 text-muted-foreground" />
          View original
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem className="flex w-full cursor-pointer gap-2" asChild>
        <a
          download
          target="_blank" // its meant to download, but as so much redirecting is happening we give up
          href={`/mail/${mailboxId}/${emailId}/raw`}
          rel="noreferrer"
          onClick={(e) => {
            window.open(apiIfy(`/mailbox/${mailboxId}/mail/${emailId}/raw?type=eml&download=true`), "_blank");
            e.preventDefault()
          }}
        >
          <DownloadIcon className="size-5 text-muted-foreground" />
          Download message
        </a>
      </DropdownMenuItem>
    </>
  );
}

function AttachmentsList({ emailId, mailboxId, attachments }: { emailId: string; mailboxId: string, attachments: DBEmail["attachments"] }) {
  const api = useLiveQuery(getLogedInUserApi)

  const apiIfy = (pathname: string) => {
    if (!api) return pathname;
    const a = new URL(('apiUrl' in api ? api.apiUrl : API_URL))
    const parts = pathname.split("?")
    a.pathname = (`${a.pathname}/api/internal${parts[0]}`).replaceAll("//", "/")
    if (a.pathname.startsWith('/')) a.pathname = a.pathname.slice(1)
    a.search = parts[1] || ""
    a.searchParams.set((crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, ""), "useless-spacer")
    a.searchParams.set("session", api?.token!)
    a.searchParams.set((crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, ""), "useless-spacer2")
    return a.toString()
  }

  return (
    attachments.map((a) => (
      <a
        key={a.id}
        href={`/mail/${mailboxId}/${emailId}/attachment/${a.id}`}
        onClick={(e) => {
          window.open(apiIfy(`/mailbox/${mailboxId}/mail/${emailId}/attachment/${a.id}?download=false`), "_blank");
          e.preventDefault()
        }}
        target="_blank"
        className="flex items-center gap-2 rounded-md bg-background p-2 hover:bg-background/80"
        rel="noreferrer"
      >
        {GetAttachmentIcon(a.filename.split(".").at(-1) || "")}
        <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {a.title || a.filename}
        </p>
        <span className="text-muted-foreground text-sm">{size(a.size)}</span>
      </a>
    ))
  )
}
