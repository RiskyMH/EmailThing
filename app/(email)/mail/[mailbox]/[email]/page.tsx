import LocalTime from "@/components/localtime";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Email, db } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { getSignedUrl } from "@/utils/s3";
import { gravatar } from "@/utils/tools";
import { and, eq } from "drizzle-orm";
import {
    ChevronDown,
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
import { marked } from "marked";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMailboxAccess, userMailboxAccess } from "../tools";
import { ClientSuspense, MarkRead, ViewSelect } from "./components.client";
import ParseHTML, { parseHTML } from "./parse-html";
import { getEmail } from "./tools";
import TopButtons from "./top-buttons";

export async function generateMetadata(props: {
    params: { mailbox: string; email: string };
}): Promise<Metadata> {
    if (!(await pageMailboxAccess(props.params.mailbox, false))) return {};

    const mail = await getEmail(props.params.mailbox, props.params.email);
    if (!mail) return notFound();

    return {
        title: mail.subject,
    };
}

export default async function EmailPage({
    params,
    searchParams,
}: {
    params: {
        mailbox: string;
        email: string;
    };
    searchParams: {
        view?: "text" | "markdown" | "html";
    };
}) {
    await pageMailboxAccess(params.mailbox, false);
    const email = await getEmail(params.mailbox, params.email);
    if (!email) return notFound();

    async function markRead() {
        "use server";
        const userId = await getCurrentUser();
        if (!(userId && (await userMailboxAccess(params.mailbox, userId)))) return "No access to mailbox";

        await db
            .update(Email)
            .set({ isRead: true })
            .where(and(eq(Email.id, params.email), eq(Email.mailboxId, params.mailbox)))
            .execute();

        revalidatePath(`/mail/${params.mailbox}/${params.email}`);
    }

    const attachmentsPresigned = await Promise.all(
        email.attachments.map(async (a) => {
            const url = await getSignedUrl({
                key: `${params.mailbox}/${params.email}/${a.id}/${a.filename}`,
            });
            return { ...a, url };
        }),
    );

    const view = searchParams?.view || "markdown";

    return (
        <div className="flex size-full min-w-0 flex-col gap-3 overflow-auto p-5">
            <TopButtons mailboxId={params.mailbox} emailId={params.email} />
            {!email.isRead && <MarkRead action={markRead} />}

            <h1 className="mt-3 break-words font-bold text-3xl">{email.subject}</h1>
            <div className="flex flex-col gap-3 rounded-md bg-card p-3">
                {/* from info and gravatar */}
                <div className="flex gap-2">
                    <Avatar className="size-12">
                        <AvatarImage className="rounded-full bg-tertiary" src={await gravatar(email.from?.address)} />
                        <AvatarFallback className="rounded-full bg-tertiary">
                            {(email.from?.name || email.from?.address)?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col overflow-hidden">
                        <div className="flex gap-2 text-ellipsis whitespace-nowrap">
                            <b className="font-bold">{email.from?.name || email.from?.address}</b>
                            {email.from?.name && (
                                <p className="text-muted-foreground text-sm">{`<${email.from.address}>`}</p>
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
                                                {email.from?.name || email.from?.address}
                                                {email.from?.name && (
                                                    <span className="text-muted-foreground">
                                                        &lt;{email.from.address}
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
                                        {email.replyTo && (
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
                            <ViewSelect selected={view} htmlValid={!!email.html} />
                            {email.raw !== "draft" && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="flex w-full cursor-pointer gap-2" asChild>
                                        <Link
                                            target="_blank"
                                            href={
                                                email.raw === "s3"
                                                    ? await getSignedUrl({
                                                          key: `${params.mailbox}/${params.email}/email.eml`,
                                                          responseContentType: "text/plain",
                                                      })
                                                    : `/mail/${params.mailbox}/${params.email}/raw`
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
                                                    ? await getSignedUrl({
                                                          key: `${params.mailbox}/${params.email}/email.eml`,
                                                      })
                                                    : `/mail/${params.mailbox}/${params.email}/raw`
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
                {attachmentsPresigned.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {attachmentsPresigned.map((a) => (
                            <a
                                key={a.id}
                                href={a.url}
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
                <ClientSuspense currentView={view} fallback={<EmailContentSpinner />}>
                    <EmailContent mailboxId={params.mailbox} emailId={params.email} view={view} />
                </ClientSuspense>
            </div>

            {/* // TODO: show references snippets for email */}
        </div>
    );
}

async function EmailContent({
    mailboxId,
    emailId,
    view,
}: { mailboxId: string; emailId: string; view: "text" | "markdown" | "html" }) {
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
    const email = await getEmail(mailboxId, emailId);
    if (!email) return notFound();

    if (view === "text")
        return <p className="overflow-auto whitespace-pre-wrap break-words leading-normal">{email.body}</p>;
    if (view === "markdown")
        return (
            <ParseHTML
                className="prose dark:prose-invert max-w-full overflow-auto break-words"
                body={await marked.parse(email.body, { breaks: true })}
            />
        );
    if (view === "html")
        return (
            <iframe
                className="h-screen w-full rounded-lg bg-card"
                sandbox="allow-popups"
                srcDoc={await parseHTML(email.html || email.body, true)}
                title="The Email"
            />
        );
}

function EmailContentSpinner() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center">
            <Loader2 className="size-12 animate-spin text-muted-foreground" />
        </div>
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
