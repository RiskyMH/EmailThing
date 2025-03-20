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
import { Suspense, useEffect, useRef } from "react"
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
        if (mailboxId !== 'demo' && !navigator.onLine) {
            toast.info("You are offline - changes will be synced when you come back online")
        }
        const result = await updateEmailProperties(mailboxId, emailId, updates);
        if (result?.message) {
            if (result.error) {
                toast.error(result.message, { description: result.description });
            } else {
                toast(result.message, { description: result.description });
            }
        }
    };

    // const attachmentsPresigned = []


    return (
        <div className="flex size-full min-w-0 flex-col gap-3 overflow-auto p-5">
            <TopButtons mailboxId={params.mailboxId} emailId={params.mailId} email={email} onUpdateEmail={updateEmail} />
            <Title email={email} mailboxId={params.mailboxId} />

            <h1 className="mt-3 break-words font-bold text-2xl sm:text-3xl">{email.subject}</h1>
            <div className="flex flex-col gap-3 rounded-md bg-card p-3">
                {/* from info and gravatar */}
                <div className="flex gap-2">
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
                                        <Link
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
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="flex w-full cursor-pointer gap-2" asChild>
                                        <Link
                                            download
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
                                        </Link>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* attachments */}
                {email.attachments.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                <EmailContent email={email} />
            </div>

            {/* // TODO: show references snippets for email */}
        </div>
    );
}

function Title({ email, mailboxId }: { email?: { subject?: string | null }, mailboxId: string }) {
    const mailboxName = useLiveQuery(async () => getMailboxName(mailboxId), [mailboxId])

    useEffect(() => {
        if (!email?.subject) document.title = "EmailThing"
        else document.title = `${email.subject}${mailboxName ? ` - ${mailboxName}` : ""} - EmailThing`
        return () => { document.title = "EmailThing" }
    }, [email, mailboxName])

    return null
}

function EmailContent({
    email,
}: { email: { body: string; html?: string | null } }) {
    const searchParams = useSearchParams()[0]
    const lastView = (localStorage || {}).getItem('last-view')
    const view = (
        searchParams.get("view")
        || (lastView?.startsWith("html") && !email?.html ? "markdown" : lastView)
        || "markdown"
    ) as "text" | "markdown" | "html" | "html-raw"

    if (view === "text") {
        return <p className="overflow-auto whitespace-pre-wrap break-words leading-normal">{email.body}</p>;
    }

    else if (view === "markdown") {
        return (
            <div
                className="prose dark:prose-invert max-w-full overflow-auto break-words"
                dangerouslySetInnerHTML={{
                    __html:
                        parseHTML(markedParse(email.body, { breaks: true, async: false }), false)
                }}
            />
        );
    }

    else if (view === "html") {
        return (
            <iframe
                className="h-screen w-full rounded-lg bg-card"
                sandbox="allow-popups"
                srcDoc={parseHTML(email.html || email.body, true)}
                title="The Email"
            />
        );
    }

    else if (view === "html-raw") {
        return <p className="leading-normal font-mono overflow-x-auto h-full rounded-lg bg-tertiary p-3 whitespace-pre text-sm">{email.html || email.body}</p>;
    }

    return null;
}

function EmailContentSpinner() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center fade-in">
            <Loader2 className="size-12 animate-spin text-muted-foreground" />
        </div>
    );
}

function ViewSelect({
    htmlValid = false,
}: { htmlValid?: boolean }) {
    const navigate = useNavigate()
    const searchParams = useSearchParams()[0]
    const view = (searchParams.get("view") || (localStorage || {}).getItem('last-view') || "markdown")

    function onValueChange(v: string) {
        localStorage.setItem('last-view', v)
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

    return (
        <Avatar className={cn("size-12 bg-tertiary transition-all", isGravatar ? "rounded-full" : "rounded-lg")}>
            <AvatarImage src={img} className={(isGravatar ? "" : "p-2 rounded-[20%]")} />
            <AvatarFallback className="bg-tertiary">
                {fallback}
            </AvatarFallback>
        </Avatar>
    )
}

