import { getCurrentUser } from "@/utils/jwt"
import { notFound } from "next/navigation"
import { pageMailboxAccess, userMailboxAccess } from "../tools"
import { Metadata } from "next"
import { db, Email } from "@/db";
import { ClientSuspense, MarkRead, ViewSelect } from "./components.client"
import { revalidatePath } from "next/cache"
import ParseHTML, { parseHTML } from "./parse-html"
import { marked } from 'marked';
import TopButtons from "./top-buttons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { gravatar } from "@/utils/tools"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronDown, CodeIcon, DownloadIcon, EllipsisVerticalIcon, FileArchiveIcon, FileTextIcon, ImageIcon, Loader2, PaperclipIcon, VideoIcon, type LucideIcon } from "lucide-react"
import LocalTime from "@/components/localtime"
import { getEmail } from "./tools"
import { and, eq } from "drizzle-orm";
import { getSignedUrl } from "@/utils/s3";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/tw";
import Link from "next/link";
import { Suspense } from "react";


export async function generateMetadata(props: { params: { mailbox: string, email: string } }): Promise<Metadata> {
    if (!await pageMailboxAccess(props.params.mailbox, false)) return {}

    const mail = await getEmail(props.params.mailbox, props.params.email)
    if (!mail) return notFound()

    return {
        title: mail.subject,
    }
}

export default async function EmailPage({
    params,
    searchParams
}: {
    params: {
        mailbox: string,
        email: string
    },
    searchParams: {
        view?: "text" | "markdown" | "html"
    }
}) {
    await pageMailboxAccess(params.mailbox, false)
    const email = await getEmail(params.mailbox, params.email)
    if (!email) return notFound()

    async function markRead() {
        "use server"
        const userId = await getCurrentUser()
        if (!userId || !await userMailboxAccess(params.mailbox, userId))
            return "No access to mailbox";

        await db.update(Email)
            .set({ isRead: true })
            .where(and(
                eq(Email.id, params.email),
                eq(Email.mailboxId, params.mailbox)
            ))
            .execute()

        revalidatePath(`/mail/${params.mailbox}/${params.email}`)
    }

    const attachmentsPresigned = await Promise.all(email.attachments.map(async a => {
        const url = await getSignedUrl({
            key: `${params.mailbox}/${params.email}/${a.id}/${a.filename}`
        })
        return { ...a, url }
    }))

    const view = searchParams?.view || "markdown"

    return (
        <div className="min-w-0 p-5 w-full h-full flex flex-col gap-3">
            <TopButtons mailboxId={params.mailbox} emailId={params.email} />
            {!email.isRead && <MarkRead action={markRead} />}

            <h1 className="font-bold text-3xl break-words mt-3">{email.subject}</h1>
            <div className="bg-card p-3 rounded-md flex flex-col gap-3">
                {/* from info and gravatar */}
                <div className="flex gap-2">
                    <Avatar className="h-12 w-12">
                        <AvatarImage className="bg-tertiary rounded-full" src={await gravatar(email.from!.address)} />
                        <AvatarFallback className="bg-tertiary rounded-full">
                            {(email.from?.name || email.from!.address).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col overflow-hidden">
                        <div className="flex gap-2 overflow-ellipsis whitespace-nowrap">
                            <b className="font-bold">{email.from?.name || email.from!.address}</b>
                            {email.from?.name && <p className="text-muted-foreground text-sm">{`<${email.from.address}>`}</p>}
                        </div>
                        <div className="text-muted-foreground text-sm flex">
                            <p className="self-center">to {email.recipients.map(e => e.name || e.address).join(", ")}</p>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="auto" className="rounded-full p-1 -m-1 ms-1 text-muted-foreground hover:text-foreground hover:bg-background">
                                        <ChevronDown className="h-5 w-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-screen sm:w-96">
                                    <div className="grid gap-2 text-sm">
                                        <div className="grid grid-cols-5 items-center gap-4">
                                            <p className="text-muted-foreground text-end">from:</p>
                                            <p className="flex gap-1 overflow-y-auto col-span-4 whitespace-nowrap ">
                                                {email.from?.name || email.from!.address}
                                                {email.from?.name && <span className="text-muted-foreground"> &lt;{email.from.address}&gt;</span>}
                                            </p>
                                        </div>

                                        {/* to */}
                                        <div className="grid grid-cols-5 items-center gap-4">
                                            <p className="text-muted-foreground text-end">to:</p>
                                            <div className="overflow-y-auto col-span-4">
                                                {email.recipients.filter(e => !e.cc).map(e => (
                                                    <p key={e.address} className="flex gap-1 whitespace-nowrap">
                                                        {e.name || e.address}
                                                        {e.name && <span className="text-muted-foreground"> &lt;{e.address}&gt;</span>}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>

                                        {/* cc */}
                                        {email.recipients.some(e => e.cc) && <div className="grid grid-cols-5 items-center gap-4">
                                            <p className="text-muted-foreground text-end">cc:</p>
                                            <div className="overflow-y-auto col-span-4">
                                                {email.recipients.filter(e => e.cc).map(e => (
                                                    <p key={e.address} className="flex gap-1 whitespace-nowrap">
                                                        {e.name || e.address}
                                                        {e.name && <span className="text-muted-foreground"> &lt;{e.address}&gt;</span>}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>}

                                        {/* date */}
                                        <div className="grid grid-cols-5 items-center gap-4">
                                            <p className="text-muted-foreground text-end">date:</p>
                                            <p className="col-span-4 flex gap-1">
                                                {email.createdAt.toLocaleString('en-US', { timeZone: 'UTC' })}
                                                <span className="text-muted-foreground">(UTC)</span>
                                            </p>
                                        </div>

                                        {/* subject */}
                                        <div className="grid grid-cols-5 items-center gap-4">
                                            <p className="text-muted-foreground text-end">subject:</p>
                                            <p className="col-span-4 overflow-y-auto">{email.subject}</p>
                                        </div>

                                        {/* reply to */}
                                        {email.replyTo && (
                                            <div className="grid grid-cols-5 items-center gap-4">
                                                <p className="text-muted-foreground text-end">reply to:</p>
                                                <p className="col-span-4 overflow-y-auto">{email.replyTo}</p>
                                            </div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <LocalTime className="text-muted-foreground text-sm ms-auto mt-2 hidden lg:inline" time={email.createdAt} type="full" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className='rounded-full p-2 hover:bg-background flex ms-auto lg:ms-0' variant="ghost" size="icon">
                                <EllipsisVerticalIcon className="w-6 h-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="min-w-[10rem] ">
                            <ViewSelect selected={view} htmlValid={!!email.html} />
                            {email.raw !== "draft" &&
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="flex gap-2 cursor-pointer w-full" asChild>
                                        <Link
                                            target="_blank"
                                            href={email.raw === "s3"
                                                ? await getSignedUrl({ key: `${params.mailbox}/${params.email}/email.eml`, responseContentType: "text/plain" })
                                                : `/mail/${params.mailbox}/${params.email}/raw`
                                            }
                                        >
                                            <CodeIcon className="h-5 w-5 text-muted-foreground" />
                                            View original
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="flex gap-2 cursor-pointer w-full" asChild>
                                        <Link
                                            download
                                            href={email.raw === "s3"
                                                ? await getSignedUrl({ key: `${params.mailbox}/${params.email}/email.eml` })
                                                : `/mail/${params.mailbox}/${params.email}/raw`
                                            }
                                        >
                                            <DownloadIcon className="h-5 w-5 text-muted-foreground" />
                                            Download message
                                        </Link>
                                    </DropdownMenuItem>
                                </>
                            }
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* attachments */}
                {attachmentsPresigned.length > 0 && (
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {attachmentsPresigned.map(a => (
                            <a
                                key={a.id}
                                href={a.url}
                                target="_blank"
                                className="flex gap-2 items-center p-2 rounded-md bg-background hover:bg-background/80"
                            >
                                {GetAttachmentIcon(a.filename.split('.').at(-1) || '')}
                                <p className="flex-1 overflow-hidden whitespace-nowrap overflow-ellipsis">{a.title || a.filename}</p>
                                <span className="text-muted-foreground text-sm">{size(a.size)}</span>
                            </a>
                        ))}
                    </div>
                )}
                <ClientSuspense currentView={view} fallback={<EmailContentSpinner />}>
                    <EmailContent mailboxId={params.mailbox} emailId={params.email} view={view} />
                </ClientSuspense>
            </div>

        </div>

    )
}

async function EmailContent({ mailboxId, emailId, view }: { mailboxId: string, emailId: string, view: "text" | "markdown" | "html" }) {
    // const email = await db.query.Email.findFirst({
    //     where: and(
    //         eq(Email.id, emailId),
    //         eq(Email.mailboxId, mailboxId)
    //     ),
    //     columns: {
    //         id: true,
    //         body: true,
    //         html: true,
    //         raw: true
    //     }
    // })
    const email = await getEmail(mailboxId, emailId)
    if (!email) return notFound()

    if (view === "text") return <p className="whitespace-pre-wrap break-words leading-normal overflow-auto">{email.body}</p>
    if (view === "markdown") return <ParseHTML className="prose dark:prose-invert max-w-full break-words overflow-auto" body={await marked.parse(email.body, { breaks: true })} />
    if (view === "html") return <iframe className="rounded-lg w-full h-screen bg-card" sandbox='allow-popups' srcDoc={await parseHTML(email.html || email.body, true)} />
}

function EmailContentSpinner() {
    return (
        <div className="flex h-screen w-full items-center justify-center flex-col">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
    )
}

function size(bytes: number) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

const attachmentExtensionMap = {
    // images
    "png": ImageIcon,
    "jpg": ImageIcon,
    "jpeg": ImageIcon,
    "gif": ImageIcon,

    // videos
    "mp4": VideoIcon,
    "mov": VideoIcon,
    "avi": VideoIcon,
    "doc": VideoIcon,

    // documents
    "docx": FileTextIcon,
    "pdf": FileTextIcon,

    // zip
    "zip": FileArchiveIcon,
    "rar": FileArchiveIcon,
    "7z": FileArchiveIcon,
} as Record<string, LucideIcon>;

function GetAttachmentIcon(extension: string) {
    const ReturnIcon = attachmentExtensionMap[extension] || PaperclipIcon
    return <ReturnIcon className="h-5 w-5 text-muted-foreground" />
}