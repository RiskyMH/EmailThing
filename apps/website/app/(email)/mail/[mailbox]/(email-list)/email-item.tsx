import LocalTime from "@/app/components/localtime";
import TooltipText from "@/app/components/tooltip-text";
import { cn } from "@/app/utils/tw";
import { getCurrentUser } from "@/app/utils/user";
import { prisma } from "@email/db";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/app/components/ui/context-menu";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ClientStar, ContextMenuAction } from "./components.client";
import { getJustEmailsList, getDraftJustEmailsList, getEmailList } from "./tools";
import { ReplyIcon, ReplyAllIcon, ForwardIcon, TagIcon, ExternalLink } from "lucide-react";

interface UpdatableEmailConfig {
    isStarred?: boolean;
    isRead?: boolean;
    category?: string | null;
    binned?: boolean;
}

interface EmailItemProps {
    email: Awaited<ReturnType<typeof getJustEmailsList>>[0] | Awaited<ReturnType<typeof getDraftJustEmailsList>>[0];
    mailboxId: string;
    type: "inbox" | "sent" | "drafts" | "bin" | "starred";
    categories?: Awaited<ReturnType<typeof getEmailList>>[1] | null;
}
export function EmailItem({ email, mailboxId, type, categories }: EmailItemProps) {
    const emailId = email.id
    const baseUrl = `/mail/${mailboxId}${type === "inbox" ? "" : `/${type}`}`

    async function updateEmail(state: UpdatableEmailConfig) {
        "use server"
        const userId = await getCurrentUser()
        if (!userId) throw new Error()

        if (type === "drafts") {
            if (state.binned) {
                await prisma.draftEmail.delete({
                    where: {
                        id: emailId,
                        mailboxId: mailboxId
                    }
                })
                return revalidatePath(baseUrl)

            }
            if (state.category) throw new Error("Cannot categorize drafts");
        }

        await prisma.email.update({
            data: {
                isStarred: state.isStarred,
                isRead: state.isRead,
                binnedAt: state.binned ? new Date() : (state.binned === false ? null : undefined),
                category: state.category ? ({
                    connect: {
                        id: state.category
                    }
                }) : state.category === null ? ({
                    disconnect: true
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

        revalidatePath(baseUrl)
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <Link
                    href={`/mail/${mailboxId}/${type === 'drafts' ? "draft/" : ""}${email.id}`}
                    className={cn("rounded shadow-sm h-16 px-5 py-1.5 inline-flex gap-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", email.isRead ? "hover:bg-card/60" : "text-card-foreground bg-card hover:bg-card/60")}
                >
                    <TooltipText text={email.category?.name ?? "No category"}>
                        <span
                            className="self-center rounded-full h-3 w-3 m-2 inline-block mx-auto flex-shrink-0"
                            style={{ backgroundColor: email.category?.color ?? "grey" }}
                        />
                    </TooltipText>

                    <TooltipText text={email.from?.name ? `${email.from?.name} (${email.from?.address})` : email.from?.address || ''}>
                        <span className="self-center w-56 truncate">
                            {email.from?.name || email.from?.address}
                        </span>
                    </TooltipText>

                    <TooltipText text={email.subject || "No subject was provided"}>
                        <span className={cn("self-center w-80 font-bold truncate", !email.subject && "italic")}>
                            {email.subject || "(no subject)"}
                        </span>
                    </TooltipText>

                    <span className="self-center w-full hidden sm:inline-flex gap-4 flex-shrink-[2]">

                        {!email.isRead && (
                            <span className="select-none bg-red self-center text-white text-xs rounded px-3 py-1 font-bold inline h-6">
                                NEW
                            </span>
                        )}
                        <span className="text-muted-foreground line-clamp-2 text-sm break-all">
                            {email.snippet}
                        </span>
                    </span>
                    <ClientStar enabled={!!email.isStarred} action={updateEmail.bind(null, { isStarred: !email.isStarred })} className="self-center text-muted-foreground hover:text-foreground flex-shrink-0 ms-auto -me-2 hidden sm:inline-block" />
                    <LocalTime type="hour-min/date" time={email.createdAt} className="float-right self-center text-muted-foreground text-sm flex-shrink-0 w-16 text-right" />
                </Link>
            </ContextMenuTrigger>
            <ContextMenuContent>

                {type !== "drafts" ? (
                    <>
                        {/* // TODO: implement sending emails */}
                        <ContextMenuItem className="flex gap-2">
                            <ReplyIcon className="w-5 h-5 text-muted-foreground" />
                            Reply
                        </ContextMenuItem>
                        <ContextMenuItem className="flex gap-2">
                            <ReplyAllIcon className="w-5 h-5 text-muted-foreground" />
                            Reply to all
                        </ContextMenuItem>
                        <ContextMenuItem className="flex gap-2">
                            <ForwardIcon className="w-5 h-5 text-muted-foreground" />
                            Forward
                        </ContextMenuItem>
                        <ContextMenuSeparator />

                        <ContextMenuItem className="flex gap-2 cursor-pointer" asChild>
                            <ContextMenuAction icon="StarIcon" fillIcon={email.isStarred} action={updateEmail.bind(null, { isStarred: !email.isStarred })}>
                                {email.isStarred ? "Unstar" : "Star"}
                            </ContextMenuAction>
                        </ContextMenuItem>
                        <ContextMenuItem className="flex gap-2 cursor-pointer" asChild>
                            <ContextMenuAction icon={!email.binnedAt ? "Trash2Icon" : "ArchiveRestoreIcon"} action={updateEmail.bind(null, { binned: !email.binnedAt })}>
                                {!email.binnedAt ? "Delete" : "Restore to inbox"}
                            </ContextMenuAction>
                        </ContextMenuItem>
                        <ContextMenuItem className="flex gap-2 cursor-pointer" asChild>
                            <ContextMenuAction icon={email.isRead ? "BellDotIcon" : "MailOpenIcon"} action={updateEmail.bind(null, { isRead: !email.isRead })}>
                                {email.isRead ? "Mark as unread" : "Mark as read"}
                            </ContextMenuAction>
                        </ContextMenuItem>
                        <ContextMenuSeparator />

                        <ContextMenuSub>
                            <ContextMenuSubTrigger className="flex gap-2 cursor-pointer">
                                <TagIcon className="w-5 h-5 text-muted-foreground" />
                                Categorize as
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-48">
                                {/* // TODO: implement categorizing */}
                                <ContextMenuItem asChild className="flex gap-2 cursor-pointer" >
                                    <ContextMenuAction icon={!email.category?.id ? "CheckIcon" : "EmptyIcon"} action={updateEmail.bind(null, { category: null })}>
                                        None
                                    </ContextMenuAction>
                                </ContextMenuItem>

                                {categories?.map(category => (
                                    <ContextMenuItem key={category.id} asChild className="flex gap-2 cursor-pointer" >
                                        <ContextMenuAction icon={email.category?.id === category.id ? "CheckIcon" : "EmptyIcon"} action={updateEmail.bind(null, { category: category.id })}>
                                            {category.name}
                                        </ContextMenuAction>
                                    </ContextMenuItem>
                                ))}
                            </ContextMenuSubContent>
                        </ContextMenuSub>

                    </>
                ) : (
                    <ContextMenuItem className="flex gap-2 cursor-pointer" asChild>
                        <ContextMenuAction icon={"Trash2Icon"} action={updateEmail.bind(null, { binned: !email.binnedAt })}>
                            Delete
                        </ContextMenuAction>
                    </ContextMenuItem>
                )}
                <ContextMenuSeparator />

                <ContextMenuItem className="flex gap-2 cursor-pointer" asChild>
                    <Link href={`/mail/${mailboxId}/${type === 'drafts' ? "draft/" : ""}${email.id}`} target="_blank">
                        <ExternalLink className="w-5 h-5 text-muted-foreground" />
                        Open in new tab
                    </Link>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>

    )
}