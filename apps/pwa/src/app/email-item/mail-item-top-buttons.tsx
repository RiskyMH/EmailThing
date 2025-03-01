import { BackButton } from "@/(email)/mail/[mailbox]/[email]/components.client";
import { ContextMenuAction } from "@/(email)/mail/[mailbox]/components.client";
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

interface TopButtonsProps {
    mailboxId: string;
    emailId: string;
    email: {
        isStarred?: boolean;
        binnedAt?: Date | null;
        category?: string | null;
    };
    categories?: Array<{
        id: string;
        name: string;
    }>;
    onUpdateEmail: (updates: any) => void;
}

export default function TopButtons({ mailboxId, emailId, email, categories, onUpdateEmail }: TopButtonsProps) {
    return (
        <div className="-mt-1 flex w-full min-w-0 flex-row gap-6 border-b-2 pb-3 text-muted-foreground">
            <BackButton fallbackUrl={`/mail/${mailboxId}`} />

            <div className="-mx-2 border-e-2" />

            <ContextMenuAction
                icon="StarIcon"
                fillIcon={email.isStarred}
                action={() => onUpdateEmail({ isStarred: !email.isStarred })}
                tooltip={email.isStarred ? "Unstar" : "Star"}
            />
            <ContextMenuAction
                icon={!email.binnedAt ? "Trash2Icon" : "ArchiveRestoreIcon"}
                action={() => onUpdateEmail({ binnedAt: !email.binnedAt ? new Date() : null })}
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
                            icon={!email.category ? "CheckIcon" : "EmptyIcon"}
                            action={() => onUpdateEmail({ category: null })}
                        >
                            None
                        </ContextMenuAction>
                    </DropdownMenuItem>
                    {categories?.map((category) => (
                        <DropdownMenuItem key={category.id} asChild className="flex w-full cursor-pointer gap-2">
                            <ContextMenuAction
                                icon={email.category === category.id ? "CheckIcon" : "EmptyIcon"}
                                action={() => onUpdateEmail({
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
