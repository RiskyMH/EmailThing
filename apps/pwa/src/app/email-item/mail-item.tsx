"use client"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useLiveQuery } from 'dexie-react-hooks';
import { getEmailWithDetails, updateEmailProperties } from "@/utils/data/queries/email-list"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown, ChevronRight, CodeIcon, DownloadIcon, EllipsisVerticalIcon, FileArchiveIcon, FileTextIcon, ImageIcon, Loader2, PaperclipIcon, VideoIcon, type LucideIcon } from "lucide-react"
import { parse as markedParse } from "marked"
import { Suspense, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import Loading from "./loading"
import Link from "@/components/link"
import TopButtons from "./mail-item-top-buttons";
import LocalTime from "@/components/localtime.client";
import { useEmailImage } from "@/utils/fetching";
import { cn } from "@/utils/tw";
import useSWR from "swr";
import { parseHTML } from "./parse-html";
import { getMailboxName } from "@/utils/data/queries/mailbox";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";


export default function MailItemSuspense() {
    if (typeof window === "undefined") return <Loading />
    return <Suspense fallback={<Loading />}>
        <MailItem />
    </Suspense>
}

function MailItem() {
    const params = useParams<"mailboxId" | "mailId">()
    const mailboxId = params.mailboxId || "demo"
    const emailId = params.mailId || ""

    const email = useLiveQuery(async () => {
        if (!emailId) return
        const d = await getEmailWithDetails(mailboxId, emailId)
        return d
    }, [mailboxId, emailId])

    const markedAsRead = useRef(false)
    useEffect(() => {
        if (email && !email.isRead && !markedAsRead.current) {
            markedAsRead.current = true
            updateEmail({ isRead: true }, { auto: true })
        }
        else if (email && !email.isRead) {
            markedAsRead.current = true
        }
    }, [email])

    if (!params.mailboxId) return <Loading />
    if (!email || !params.mailId) return <><Loading /><Title mailboxId={params.mailboxId} /></>

    const updateEmail = async (updates: Record<string, any>, { auto }: { auto?: boolean } = {}) => {
        if (mailboxId === 'demo') {
            toast("This is a demo - changes won't actually do anything", { description: "But you can see how it would work in the real app!" });
        } else if (!navigator.onLine) {
            toast.info("You are offline - changes will be synced when you come back online")
        }
        await updateEmailProperties(mailboxId, emailId, updates);
    };

    // const attachmentsPresigned = []


    return (
        <div className="flex size-full min-w-0 flex-col gap-3 overflow-auto p-3 sm:p-5">
            <TopButtons mailboxId={params.mailboxId} emailId={params.mailId} email={email} onUpdateEmail={updateEmail} />
            <Title subject={email.subject} mailboxId={params.mailboxId} />

            <h1 className="mt-3 px-3 break-words font-bold text-2xl sm:text-3xl">{email.subject}</h1>
            <div className="flex flex-col gap-3 rounded-md bg-card">
                {/* from info and gravatar */}
                <div className="flex gap-2 p-3 pb-0">
                    <EmailPicture email={email.sender?.address || ""} fallback={(email.sender?.name || email.sender?.address || '')?.slice(0, 2).toUpperCase()} />

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
                        className="ms-auto mt-2 hidden text-muted-foreground text-sm lg:inline"
                        time={email.createdAt}
                        type="full"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="ms-auto flex rounded-full p-2 hover:bg-background lg:ms-0"
                                variant="ghost"
                                size="icon"
                            >
                                <EllipsisVerticalIcon className="size-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="min-w-[10rem] ">
                            <ViewSelect htmlValid={!!email.html} />
                            {email.raw !== "draft" && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="flex w-full cursor-pointer gap-2" asChild>
                                        <a
                                            target="_blank"
                                            href={
                                                email.raw === "s3"
                                                    // ?  getSignedUrl({
                                                    //     key: `${params.mailboxId}/${params.emailId}/email.eml`,
                                                    //     responseContentType: "text/plain",
                                                    // })
                                                    ? `/mail/${params.mailboxId}/${params.mailId}/raw`
                                                    : `/mail/${params.mailboxId}/${params.mailId}/raw`
                                            }
                                        >
                                            <CodeIcon className="size-5 text-muted-foreground" />
                                            View original
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="flex w-full cursor-pointer gap-2" asChild>
                                        <a
                                            download
                                            target="_blank" // its meant to download, but as so much redirecting is happening we give up
                                            href={
                                                email.raw === "s3"
                                                    // ? await getSignedUrl({
                                                    //     key: `${params.mailboxId}/${params.emailId}/email.eml`,
                                                    // })
                                                    ? `/mail/${params.mailboxId}/${params.mailId}/raw`
                                                    : `/mail/${params.mailboxId}/${params.mailId}/raw`
                                            }
                                        >
                                            <DownloadIcon className="size-5 text-muted-foreground" />
                                            Download message
                                        </a>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* attachments */}
                {email.attachments.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-3">
                        {email.attachments.map((a) => (
                            <a
                                key={a.id}
                                href={`/mail/${params.mailboxId}/${params.mailId}/attachment/${a.id}`}
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
                        ))}
                    </div>
                )}
                <EmailContent body={email.body} html={email.html || null} subject={email.subject || null} />
            </div>

            {/* // TODO: show references snippets for email */}
        </div>
    );
}

function Title({ subject, mailboxId }: { subject?: string | null, mailboxId: string }) {
    const mailboxName = useLiveQuery(async () => getMailboxName(mailboxId), [mailboxId])

    useEffect(() => {
        if (!subject) document.title = "EmailThing"
        else document.title = `${subject}${mailboxName ? ` - ${mailboxName}` : ""} - EmailThing`
        return () => { document.title = "EmailThing" }
    }, [subject, mailboxName])

    return null
}

function EmailContent({
    body, html, subject,
}: { body: string; html?: string | null, subject?: string | null }) {
    const searchParams = useSearchParams()[0]
    const lastView = (localStorage || {}).getItem('email-item:last-view')
    const view = (
        searchParams.get("view")
        || (lastView?.startsWith("html") && !html ? "markdown" : lastView)
        || "markdown"
    ) as "text" | "markdown" | "html" | "html-raw"

    const ref = useRef<HTMLIFrameElement>(null)
    const [htmlLoaded, setHtmlLoaded] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setHtmlLoaded(true)
            if (ref.current?.contentWindow?.document.documentElement) {
                ref.current.style.height = `${ref.current.contentWindow.document.documentElement.scrollHeight}px`;
            } else if (ref.current) {
                ref.current.style.height = 'calc(100vh - 100px)';
            }
        }
        window.addEventListener("resize", handleResize)
        ref.current?.addEventListener("load", handleResize)
        return () => {
            window.removeEventListener("resize", handleResize)
            ref.current?.removeEventListener("load", handleResize)
        }
    }, [html, view])

    if (view === "text") {
        return <p className="overflow-auto whitespace-pre-wrap break-words leading-normal p-3 pt-0">{body}</p>;
    }

    else if (view === "markdown") {
        return (
            <div
                className="prose dark:prose-invert max-w-full overflow-auto break-words p-3 pt-0"
                dangerouslySetInnerHTML={{
                    __html:
                        parseHTML(markedParse(body, { breaks: true, async: false }), false)
                }}
            />
        );
    }

    else if (view === "html") {
        return (
            <>
                <iframe
                    ref={ref}
                    className="w-full rounded-b-lg bg-card"
                    style={{ height: '0px', maxHeight: '100%' }}
                    sandbox="allow-popups allow-same-origin"
                    srcDoc={parseHTML(html || body, true)}
                    title={subject || "The Email"}
                />
                {!htmlLoaded && <EmailContentSpinner className="h-36" />}
            </>
        );
    }

    else if (view === "html-raw") {
        return <p className="leading-normal font-mono overflow-x-auto h-full rounded-b-lg bg-tertiary p-3 whitespace-pre text-sm">{html || body}</p>;
    }

    return null;
}

function EmailContentSpinner({ className }: { className?: string }) {
    return (
        <div className={cn("flex h-screen w-full flex-col items-center justify-center fade-in", className)}>
            <Loader2 className="size-12 animate-spin text-muted-foreground" />
        </div>
    );
}

function ViewSelect({
    htmlValid = false,
}: { htmlValid?: boolean }) {
    const navigate = useNavigate()
    const searchParams = useSearchParams()[0]
    const view = (searchParams.get("view") || (localStorage || {}).getItem('email-item:last-view') || "markdown")

    function onValueChange(v: string) {
        localStorage.setItem('email-item:last-view', v)
        navigate(`?view=${v}`, { replace: true });
    }

    return (
        <DropdownMenuRadioGroup value={view === "html-raw" ? "html" : view} onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="text">Text</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="markdown" defaultChecked>Markdown</DropdownMenuRadioItem>
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
                            <DropdownMenuRadioItem value="html" disabled={!htmlValid}>HTML rendered</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="html-raw" disabled={!htmlValid}>HTML raw</DropdownMenuRadioItem>
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


function EmailPicture({ email, fallback }: { email: string, fallback?: string }) {
    const img = useEmailImage(email)
    const isGravatar = !img || img.startsWith("https://www.gravatar.com/avatar/")
    console.log("email", email, img, isGravatar)

    return (
        <Avatar className={"size-12 bg-tertiary transition-all data-[gravatar=true]:rounded-full data-[gravatar=false]:rounded-lg data-[gravatar=false]:[&>img]:p-2 data-[gravatar=false]:[&>img]:rounded-[20%]"} data-gravatar={isGravatar}>
            <AvatarImage src={img} />
            <AvatarFallback className="bg-tertiary">
                {fallback}
            </AvatarFallback>
        </Avatar>
    )
}

