import LocalTime from "@/app/components/localtime";
import { cn } from "@/app/utils/tw";
import { getCurrentUser } from "@/app/utils/user";
import { prisma } from "@email/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ClientStar, ContextMenuAction } from "./components.client";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent } from "@/app/components/ui/context-menu"
import TooltipText from "@/app/components/tooltip-text";
import { ExternalLink, ForwardIcon, ReplyAllIcon, ReplyIcon, TagIcon, Trash2Icon } from "lucide-react";


interface EmailListProps {
    emails: {
        id: string;
        subject: string | null;
        snippet: string | null;
        createdAt: Date;
        isRead: boolean | null;
        isStarred: boolean | null;
        binnedAt: Date | null;
        category?: {
            name: string;
            id: string;
            color: string | null;
        } | null;
        from: {
            name: string | null;
            address: string;
        } | null;
    }[];

    mailbox: string
    type?: "inbox" | "sent" | "drafts" | "bin" | "starred"

}

interface UpdatableEmailConfig {
    isStarred?: boolean;
    isRead?: boolean;
    category?: string;
    binned?: boolean;
}

export default function EmailList({ emails, mailbox: mailboxId, type }: EmailListProps) {

    async function updateEmail(emailId: string, state: UpdatableEmailConfig) {
        "use server"
        const userId = await getCurrentUser()
        if (!userId) throw new Error()

        await prisma.email.update({
            data: {
                isStarred: state.isStarred,
                isRead: state.isRead,
                binnedAt: state.binned ? new Date() : (state.binned === false ? null : undefined),
                category: state.category ? ({
                    connect: {
                        id: state.category
                    }
                }) : undefined
            },
            where: {
                id: emailId,
                mailbox: {
                    id: mailboxId,
                    users: {
                        some: {
                            userId: userId
                        }
                    }
                }
            }

        });

        revalidatePath(`/mail/${mailboxId}${type === "inbox" ? "" : `/${type}`}`)
    }


    return (
        <div className="flex-col space-y-3 p-5 flex w-full min-w-0">
            {emails.map(email => (
                <ContextMenu key={email.id}>
                    <ContextMenuTrigger asChild>
                        <Link
                            href={`/mail/${mailboxId}/${email.id}`}
                            className={cn("rounded shadow-sm h-16 px-5 py-1.5 inline-flex gap-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", email.isRead ? "hover:bg-card/60" : "text-card-foreground bg-card hover:bg-card/60")}
                        >
                            <TooltipText text={email.category?.name ?? "No category"}>
                                <span
                                    className="self-center rounded-full h-3 w-3 m-2 inline-block mx-auto flex-shrink-0"
                                    style={{ backgroundColor: email.category?.color ?? "grey" }}
                                />
                            </TooltipText>

                            <TooltipText text={`${email.from?.name} (${email.from?.address})`}>
                                <span className="self-center w-56 font-bold truncate">
                                    {email.from?.name}
                                </span>
                            </TooltipText>

                            <span className="self-center w-64 sm:font-bold truncate">{email.subject}</span>

                            <span className="self-center w-full hidden sm:inline-flex gap-4 flex-shrink">

                                {!email.isRead && (
                                    <span className="select-none bg-red self-center text-white text-xs rounded px-3 py-1 font-bold inline h-6">
                                        NEW
                                    </span>
                                )}
                                <span className="text-muted-foreground line-clamp-2 text-sm">
                                    {email.snippet}
                                </span>
                            </span>
                            <ClientStar enabled={!!email.isStarred} action={updateEmail.bind(null, email.id, { isStarred: !email.isStarred })} className="self-center text-muted-foreground hover:text-foreground flex-shrink-0 ms-auto -me-2" />
                            <LocalTime type="hour-min" time={email.createdAt} className="float-right self-center text-muted-foreground text-sm flex-shrink-0 w-16 text-right" />
                        </Link>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        {/* // TODO: implement sending emails */}
                        <ContextMenuItem className="flex gap-2">
                            <ReplyIcon className="w-5 h-5 text-muted/50" />
                            Reply
                        </ContextMenuItem>
                        <ContextMenuItem className="flex gap-2">
                            <ReplyAllIcon className="w-5 h-5 text-muted/50" />
                            Reply to all
                        </ContextMenuItem>
                        <ContextMenuItem className="flex gap-2">
                            <ForwardIcon className="w-5 h-5 text-muted/50" />
                            Forward
                        </ContextMenuItem>
                        <ContextMenuSeparator />

                        <ContextMenuItem className="flex gap-2 cursor-pointer" asChild>
                            <ContextMenuAction icon="StarIcon" fillIcon={email.isStarred} action={updateEmail.bind(null, email.id, { isStarred: !email.isStarred })}>
                                {email.isStarred ? "Unstar" : "Star"}
                            </ContextMenuAction>
                        </ContextMenuItem>
                        <ContextMenuItem className="flex gap-2 cursor-pointer" asChild>
                            <ContextMenuAction icon={!email.binnedAt ? "Trash2Icon" : "ArchiveRestoreIcon"} action={updateEmail.bind(null, email.id, { binned: !email.binnedAt })}>
                                {!email.binnedAt ? "Delete" : "Restore to inbox"}
                            </ContextMenuAction>
                        </ContextMenuItem>
                        <ContextMenuItem className="flex gap-2 cursor-pointer" asChild>
                            <ContextMenuAction icon="BellDotIcon" fillIcon={!email.isRead} action={updateEmail.bind(null, email.id, { isRead: !email.isRead })}>
                                {email.isRead ? "Mark as unread" : "Mark as read"}
                            </ContextMenuAction>
                        </ContextMenuItem>
                        <ContextMenuSeparator />

                        <ContextMenuSub>
                            <ContextMenuSubTrigger className="flex gap-2 cursor-pointer">
                                <TagIcon className="w-5 h-5 text-muted/50" />
                                Categorize as
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-48">
                                {/* // TODO: implement categorizing */}
                                <ContextMenuItem>None</ContextMenuItem>
                                <ContextMenuItem>Something...</ContextMenuItem>
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                        <ContextMenuSeparator />

                        <ContextMenuItem className="flex gap-2 cursor-pointer" asChild>
                            <Link href={`/mail/${mailboxId}/${email.id}`} target="_blank">
                                <ExternalLink className="w-5 h-5 text-muted/50" />
                                Open in new tab
                            </Link>
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            ))}
        </div>
    )
}

