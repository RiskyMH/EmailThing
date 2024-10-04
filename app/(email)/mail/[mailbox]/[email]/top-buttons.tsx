import TooltipText from "@/components/tooltip-text";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ForwardIcon, ReplyAllIcon, ReplyIcon, TagIcon } from "lucide-react";
import Link from "next/link";
import { updateEmail as updateEmailAction } from "../actions";
import { ContextMenuAction } from "../components.client";
import { mailboxCategories } from "../tools";
import { BackButton } from "./components.client";
import { getEmail } from "./tools";

interface TopButtonsProps {
    mailboxId: string;
    emailId: string;
}

export default async function TopButtons({ mailboxId, emailId }: TopButtonsProps) {
    const email = await getEmail(mailboxId, emailId);
    const categories = await mailboxCategories(mailboxId);
    if (!email) return;
    const updateEmail = updateEmailAction.bind(null, mailboxId, emailId, "mail-page");

    return (
        <div className="-mt-1 flex w-full min-w-0 flex-row gap-6 border-b-2 pb-3 text-muted-foreground">
            <BackButton fallbackUrl={`/mail/${mailboxId}`} />
            <div className="-mx-2 border-e-2" />

            <ContextMenuAction
                icon="StarIcon"
                fillIcon={email.isStarred}
                action={updateEmail.bind(null, { isStarred: !email.isStarred })}
                tooltip={email.isStarred ? "Unstar" : "Star"}
            />
            <ContextMenuAction
                icon={!email.binnedAt ? "Trash2Icon" : "ArchiveRestoreIcon"}
                action={updateEmail.bind(null, { binned: !email.binnedAt })}
                tooltip={!email.binnedAt ? "Delete" : "Restore to inbox"}
            />

            <DropdownMenu>
                <TooltipText text="Categorize as">
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="auto"
                            className="-m-2 rounded-full p-2 text-muted-foreground hover:text-foreground"
                        >
                            <TagIcon className="size-5" />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipText>
                <DropdownMenuContent>
                    <DropdownMenuItem asChild className="flex w-full cursor-pointer gap-2">
                        <ContextMenuAction
                            icon={!email.category?.id ? "CheckIcon" : "EmptyIcon"}
                            action={updateEmail.bind(null, { category: null })}
                        >
                            None
                        </ContextMenuAction>
                    </DropdownMenuItem>
                    {categories?.map((category) => (
                        <DropdownMenuItem key={category.id} asChild className="flex w-full cursor-pointer gap-2">
                            <ContextMenuAction
                                icon={email.category?.id === category.id ? "CheckIcon" : "EmptyIcon"}
                                action={updateEmail.bind(null, {
                                    category: category.id,
                                })}
                            >
                                {category.name}
                            </ContextMenuAction>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="-mx-2 border-e-2" />
            <TooltipText text="Reply">
                <Button
                    variant="ghost"
                    size="auto"
                    className="-m-2 rounded-full p-2 text-muted-foreground hover:text-foreground"
                    asChild
                >
                    <Link href={`/mail/${mailboxId}/draft/new?reply=${emailId}`}>
                        <ReplyIcon className="size-5" />
                    </Link>
                </Button>
            </TooltipText>
            <TooltipText text="Reply All">
                <Button
                    variant="ghost"
                    size="auto"
                    className="-m-2 rounded-full p-2 text-muted-foreground hover:text-foreground"
                    asChild
                >
                    <Link href={`/mail/${mailboxId}/draft/new?replyAll=${emailId}`}>
                        <ReplyAllIcon className="size-5" />
                    </Link>
                </Button>
            </TooltipText>
            <TooltipText text="Forward">
                <Button
                    variant="ghost"
                    size="auto"
                    className="-m-2 rounded-full p-2 text-muted-foreground hover:text-foreground"
                    asChild
                >
                    <Link href={`/mail/${mailboxId}/draft/new?forward=${emailId}`}>
                        <ForwardIcon className="size-5" />
                    </Link>
                </Button>
            </TooltipText>
        </div>
    );
}
