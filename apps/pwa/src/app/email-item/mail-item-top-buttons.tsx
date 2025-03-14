import { ContextMenuAction } from "@/(email)/mail/[mailbox]/components.client";
import TooltipText from "@/components/tooltip-text";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCategories, getEmail } from "@/utils/data/queries/email-list";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeftIcon, ForwardIcon, ReplyAllIcon, ReplyIcon, TagIcon } from "lucide-react";
import Link from "next/link";
import { useNavigate } from "react-router-dom";

interface TopButtonsProps {
    mailboxId: string;
    emailId: string;
    categories?: Array<{
        id: string;
        name: string;
    }>;
    email: {
        isStarred?: boolean;
        binnedAt?: Date | null;
        categoryId?: string | null;
    };
    onUpdateEmail: (updates: any) => void;
}

export default function TopButtons({ mailboxId, emailId, email, onUpdateEmail }: TopButtonsProps) {
    const data = useLiveQuery(async () => {
        // const email = getEmail(mailboxId, emailId)
        //     .then(email => ({ isStarred: email?.isStarred, binnedAt: email?.binnedAt, categoryid: email?.categoryId }))
        const categories = getCategories(mailboxId)

        return Promise.all([email, categories])
    }, [mailboxId, emailId])

    const categories = data ? data[1] : []
    // const email = data ? data[0] : { isStarred: false, binnedAt: null, category: null }

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
                            icon={!email.categoryId ? "CheckIcon" : "EmptyIcon"}
                            action={() => onUpdateEmail({ categoryId: null })}
                        >
                            None
                        </ContextMenuAction>
                    </DropdownMenuItem>
                    {categories?.map((category) => (
                        <DropdownMenuItem key={category.id} asChild className="flex w-full cursor-pointer gap-2">
                            <ContextMenuAction
                                icon={email.categoryId === category.id ? "CheckIcon" : "EmptyIcon"}
                                action={() => onUpdateEmail({
                                    categoryId: category.id,
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

export function BackButton({ fallbackUrl }: { fallbackUrl?: string }) {
    const navigate = useNavigate();

    return (
        <TooltipText text="Back">
            <Button
                variant="ghost"
                size="auto"
                className="-m-2 rounded-full p-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                    if (history.length > 1) {
                        return navigate(-1);
                    }
                    return navigate(fallbackUrl || "/");
                }}
            >
                <ArrowLeftIcon className="size-5" />
            </Button>
        </TooltipText>
    );
}
