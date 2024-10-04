import LocalTime from "@/components/localtime";
import TooltipText from "@/components/tooltip-text";
import { cn } from "@/utils/tw";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/ui/context-menu";
import Link from "next/link";
import { ClientStar, ContextMenuAction } from "../components.client";
import { getJustEmailsList, getDraftJustEmailsList } from "./tools";
import { ReplyIcon, ReplyAllIcon, ForwardIcon, TagIcon, ExternalLink } from "lucide-react";
import { mailboxCategories } from "../tools";
import { deleteEmail, updateEmail as updateEmailAction } from "../actions"

export interface EmailItemProps {
    email: Awaited<ReturnType<typeof getJustEmailsList>>[0] | Awaited<ReturnType<typeof getDraftJustEmailsList>>[0];
    mailboxId: string;
    type: "inbox" | "sent" | "drafts" | "trash" | "starred" | "temp";
    categories?: Awaited<ReturnType<typeof mailboxCategories>> | null;
}

export function EmailItem({ email, mailboxId, type, categories }: EmailItemProps) {
    const emailId = email.id
    const updateEmail = updateEmailAction.bind(null, mailboxId, emailId, type)

    const category = categories?.find(c => c.id === email.categoryId)
    const link = `/mail/${mailboxId}/${type === 'drafts' ? "draft/" : ""}${email.id}`

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <Link
                    href={link}
                    className={cn("rounded h-16 px-5 py-1.5 inline-flex gap-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", email.isRead ? "hover:bg-card/60" : "text-card-foreground bg-card hover:bg-card/60 shadow-sm")}
                >
                    <TooltipText text={category?.name ?? "No category"}>
                        <span
                            className="self-center rounded-full size-3 m-2 inline-block mx-auto shrink-0"
                            style={{ backgroundColor: category?.color ?? "grey" }}
                        />
                    </TooltipText>

                    <TooltipText text={email.from?.name || email.from?.address || "There should be an email here"} subtext={email.from?.name && email.from?.address ? `(${email.from?.address})` : ''}>
                        <span className="self-center w-56 truncate">
                            {email.from?.name || email.from?.address}
                        </span>
                    </TooltipText>

                    <TooltipText text={email.subject || "No subject was provided"}>
                        <span className={cn("self-center w-80 font-bold truncate", !email.subject && "italic")}>
                            {email.subject || "(no subject)"}
                        </span>
                    </TooltipText>

                    <span className="self-center w-full hidden sm:inline-flex gap-4 shrink-[2]">
                        {!email.isRead && (
                            <span className="select-none bg-red self-center text-white text-xs rounded px-3 py-1 font-bold inline h-6">
                                NEW
                            </span>
                        )}
                        <span className="text-muted-foreground line-clamp-2 text-sm break-all">
                            {email.snippet}
                        </span>
                    </span>
                    <ClientStar enabled={!!email.isStarred} action={updateEmail.bind(null, { isStarred: !email.isStarred })} className="self-center text-muted-foreground hover:text-foreground shrink-0 ms-auto -me-2 hidden sm:inline-block" />
                    <LocalTime type="hour-min/date" time={email.createdAt} className="float-right self-center text-muted-foreground text-sm shrink-0 w-16 text-right" />
                </Link>
            </ContextMenuTrigger>
            <ContextMenuContent>

                {!["drafts", "temp"].includes(type) ? (
                    <>
                        <ContextMenuItem className="flex gap-2" asChild>
                            <Link href={`/mail/${mailboxId}/draft/new?reply=${emailId}`}>
                                <ReplyIcon className="size-5 text-muted-foreground" />
                                Reply
                            </Link>
                        </ContextMenuItem>
                        <ContextMenuItem className="flex gap-2" asChild>
                            <Link href={`/mail/${mailboxId}/draft/new?replyAll=${emailId}`}>
                                <ReplyAllIcon className="size-5 text-muted-foreground" />
                                Reply to all
                            </Link>
                        </ContextMenuItem>
                        <ContextMenuItem className="flex gap-2" asChild>
                            <Link href={`/mail/${mailboxId}/draft/new?forward=${emailId}`}>
                                <ForwardIcon className="size-5 text-muted-foreground" />
                                Forward
                            </Link>
                        </ContextMenuItem>
                        <ContextMenuSeparator />

                        <ContextMenuItem className="flex gap-2 cursor-pointer w-full" asChild>
                            <ContextMenuAction icon="StarIcon" fillIcon={email.isStarred} action={updateEmail.bind(null, { isStarred: !email.isStarred })}>
                                {email.isStarred ? "Unstar" : "Star"}
                            </ContextMenuAction>
                        </ContextMenuItem>
                        <ContextMenuItem className="flex gap-2 cursor-pointer w-full" asChild>
                            <ContextMenuAction icon={!email.binnedAt ? "Trash2Icon" : "ArchiveRestoreIcon"} action={updateEmail.bind(null, { binned: !email.binnedAt })}>
                                {!email.binnedAt ? "Delete" : "Restore to inbox"}
                            </ContextMenuAction>
                        </ContextMenuItem>
                        {email.binnedAt && (
                            <ContextMenuItem className="flex gap-2 cursor-pointer w-full" asChild>
                                <ContextMenuAction icon="Trash2Icon" action={deleteEmail.bind(null, mailboxId, emailId, type)}>
                                    Delete forever
                                </ContextMenuAction>
                            </ContextMenuItem>
                        )}
                        <ContextMenuItem className="flex gap-2 cursor-pointer w-full" asChild>
                            <ContextMenuAction icon={email.isRead ? "BellDotIcon" : "MailOpenIcon"} action={updateEmail.bind(null, { isRead: !email.isRead })}>
                                {email.isRead ? "Mark as unread" : "Mark as read"}
                            </ContextMenuAction>
                        </ContextMenuItem>
                        <ContextMenuSeparator />

                        {type !== "temp" && (
                            <ContextMenuSub>
                                <ContextMenuSubTrigger className="flex gap-2 cursor-pointer w-full">
                                    <TagIcon className="size-5 text-muted-foreground" />
                                    Categorize as
                                </ContextMenuSubTrigger>
                                <ContextMenuSubContent className="w-48">
                                    <ContextMenuItem asChild className="flex gap-2 cursor-pointer w-full" >
                                        <ContextMenuAction icon={!email.categoryId ? "CheckIcon" : "EmptyIcon"} action={updateEmail.bind(null, { category: null })}>
                                            None
                                        </ContextMenuAction>
                                    </ContextMenuItem>

                                    {categories?.map(category => (
                                        <ContextMenuItem key={category.id} asChild className="flex gap-2 cursor-pointer w-full" >
                                            <ContextMenuAction icon={email.categoryId === category.id ? "CheckIcon" : "EmptyIcon"} action={updateEmail.bind(null, { category: category.id })}>
                                                {category.name}
                                            </ContextMenuAction>
                                        </ContextMenuItem>
                                    ))}
                                </ContextMenuSubContent>
                            </ContextMenuSub>
                        )}
                    </>
                ) : (
                    <ContextMenuItem className="flex gap-2 cursor-pointer w-full" asChild>
                        <ContextMenuAction icon="Trash2Icon" action={deleteEmail.bind(null, mailboxId, emailId, type)}>
                            Delete forever
                        </ContextMenuAction>
                    </ContextMenuItem>
                )}
                <ContextMenuSeparator />

                <ContextMenuItem className="flex gap-2 cursor-pointer" asChild>
                    <Link href={link} target="_blank">
                        <ExternalLink className="size-5 text-muted-foreground" />
                        Open in new tab
                    </Link>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>

    )
}
