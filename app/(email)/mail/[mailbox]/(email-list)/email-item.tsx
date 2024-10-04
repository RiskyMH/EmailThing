import LocalTime from "@/components/localtime";
import TooltipText from "@/components/tooltip-text";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/utils/tw";
import { ExternalLink, ForwardIcon, ReplyAllIcon, ReplyIcon, TagIcon } from "lucide-react";
import Link from "next/link";
import { deleteEmail, updateEmail as updateEmailAction } from "../actions";
import { ClientStar, ContextMenuAction } from "../components.client";
import type { mailboxCategories } from "../tools";
import type { getDraftJustEmailsList, getJustEmailsList } from "./tools";

export interface EmailItemProps {
    email: Awaited<ReturnType<typeof getJustEmailsList>>[0] | Awaited<ReturnType<typeof getDraftJustEmailsList>>[0];
    mailboxId: string;
    type: "inbox" | "sent" | "drafts" | "trash" | "starred" | "temp";
    categories?: Awaited<ReturnType<typeof mailboxCategories>> | null;
}

export function EmailItem({ email, mailboxId, type, categories }: EmailItemProps) {
    const emailId = email.id;
    const updateEmail = updateEmailAction.bind(null, mailboxId, emailId, type);

    const category = categories?.find((c) => c.id === email.categoryId);
    const link = `/mail/${mailboxId}/${type === "drafts" ? "draft/" : ""}${email.id}`;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <Link
                    href={link}
                    className={cn(
                        "inline-flex h-16 gap-4 rounded px-5 py-1.5 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        email.isRead ? "hover:bg-card/60" : "bg-card text-card-foreground shadow-sm hover:bg-card/60",
                    )}
                >
                    <TooltipText text={category?.name ?? "No category"}>
                        <span
                            className="m-2 mx-auto inline-block size-3 shrink-0 self-center rounded-full"
                            style={{
                                backgroundColor: category?.color ?? "grey",
                            }}
                        />
                    </TooltipText>

                    <TooltipText
                        text={email.from?.name || email.from?.address || "There should be an email here"}
                        subtext={email.from?.name && email.from?.address ? `(${email.from?.address})` : ""}
                    >
                        <span className="w-56 self-center truncate">{email.from?.name || email.from?.address}</span>
                    </TooltipText>

                    <TooltipText text={email.subject || "No subject was provided"}>
                        <span className={cn("w-80 self-center truncate font-bold", !email.subject && "italic")}>
                            {email.subject || "(no subject)"}
                        </span>
                    </TooltipText>

                    <span className="hidden w-full shrink-[2] gap-4 self-center sm:inline-flex">
                        {!email.isRead && (
                            <span className="inline h-6 select-none self-center rounded bg-red px-3 py-1 font-bold text-white text-xs">
                                NEW
                            </span>
                        )}
                        <span className="line-clamp-2 break-all text-muted-foreground text-sm">{email.snippet}</span>
                    </span>
                    <ClientStar
                        enabled={!!email.isStarred}
                        action={updateEmail.bind(null, {
                            isStarred: !email.isStarred,
                        })}
                        className="-me-2 ms-auto hidden shrink-0 self-center text-muted-foreground hover:text-foreground sm:inline-block"
                    />
                    <LocalTime
                        type="hour-min/date"
                        time={email.createdAt}
                        className="float-right w-16 shrink-0 self-center text-right text-muted-foreground text-sm"
                    />
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

                        <ContextMenuItem className="flex w-full cursor-pointer gap-2" asChild>
                            <ContextMenuAction
                                icon="StarIcon"
                                fillIcon={email.isStarred}
                                action={updateEmail.bind(null, {
                                    isStarred: !email.isStarred,
                                })}
                            >
                                {email.isStarred ? "Unstar" : "Star"}
                            </ContextMenuAction>
                        </ContextMenuItem>
                        <ContextMenuItem className="flex w-full cursor-pointer gap-2" asChild>
                            <ContextMenuAction
                                icon={!email.binnedAt ? "Trash2Icon" : "ArchiveRestoreIcon"}
                                action={updateEmail.bind(null, {
                                    binned: !email.binnedAt,
                                })}
                            >
                                {!email.binnedAt ? "Delete" : "Restore to inbox"}
                            </ContextMenuAction>
                        </ContextMenuItem>
                        {email.binnedAt && (
                            <ContextMenuItem className="flex w-full cursor-pointer gap-2" asChild>
                                <ContextMenuAction
                                    icon="Trash2Icon"
                                    action={deleteEmail.bind(null, mailboxId, emailId, type)}
                                >
                                    Delete forever
                                </ContextMenuAction>
                            </ContextMenuItem>
                        )}
                        <ContextMenuItem className="flex w-full cursor-pointer gap-2" asChild>
                            <ContextMenuAction
                                icon={email.isRead ? "BellDotIcon" : "MailOpenIcon"}
                                action={updateEmail.bind(null, {
                                    isRead: !email.isRead,
                                })}
                            >
                                {email.isRead ? "Mark as unread" : "Mark as read"}
                            </ContextMenuAction>
                        </ContextMenuItem>
                        <ContextMenuSeparator />

                        {type !== "temp" && (
                            <ContextMenuSub>
                                <ContextMenuSubTrigger className="flex w-full cursor-pointer gap-2">
                                    <TagIcon className="size-5 text-muted-foreground" />
                                    Categorize as
                                </ContextMenuSubTrigger>
                                <ContextMenuSubContent className="w-48">
                                    <ContextMenuItem asChild className="flex w-full cursor-pointer gap-2">
                                        <ContextMenuAction
                                            icon={!email.categoryId ? "CheckIcon" : "EmptyIcon"}
                                            action={updateEmail.bind(null, {
                                                category: null,
                                            })}
                                        >
                                            None
                                        </ContextMenuAction>
                                    </ContextMenuItem>

                                    {categories?.map((category) => (
                                        <ContextMenuItem
                                            key={category.id}
                                            asChild
                                            className="flex w-full cursor-pointer gap-2"
                                        >
                                            <ContextMenuAction
                                                icon={email.categoryId === category.id ? "CheckIcon" : "EmptyIcon"}
                                                action={updateEmail.bind(null, {
                                                    category: category.id,
                                                })}
                                            >
                                                {category.name}
                                            </ContextMenuAction>
                                        </ContextMenuItem>
                                    ))}
                                </ContextMenuSubContent>
                            </ContextMenuSub>
                        )}
                    </>
                ) : (
                    <ContextMenuItem className="flex w-full cursor-pointer gap-2" asChild>
                        <ContextMenuAction icon="Trash2Icon" action={deleteEmail.bind(null, mailboxId, emailId, type)}>
                            Delete forever
                        </ContextMenuAction>
                    </ContextMenuItem>
                )}
                <ContextMenuSeparator />

                <ContextMenuItem className="flex cursor-pointer gap-2" asChild>
                    <Link href={link} target="_blank">
                        <ExternalLink className="size-5 text-muted-foreground" />
                        Open in new tab
                    </Link>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
