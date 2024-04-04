import { ArrowLeftIcon, TagIcon, ReplyIcon, ReplyAllIcon, ForwardIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ContextMenuAction } from "../components.client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import TooltipText from "@/components/tooltip-text"
import { mailboxCategories } from "../tools";
import { getEmail } from "./tools";
import { updateEmail as updateEmailAction } from "../actions"
import { BackButton } from "./components.client"

interface TopButtonsProps {
    mailboxId: string;
    emailId: string
}

export default async function TopButtons({ mailboxId, emailId }: TopButtonsProps) {
    const email = await getEmail(mailboxId, emailId)
    const categories = await mailboxCategories(mailboxId)
    if (!email) return;
    const updateEmail = updateEmailAction.bind(null, mailboxId, emailId, 'mail-page')

    return (
        <div className="flex flex-row w-full min-w-0 pb-3 border-b-2 -mt-1 gap-6 text-muted-foreground">
            <BackButton fallbackUrl={`/mail/${mailboxId}`} />
            <div className="border-e-2 -mx-2" />

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
                        <Button variant="ghost" size="auto" className="rounded-full p-2 -m-2 text-muted-foreground hover:text-foreground">
                            <TagIcon className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipText>
                <DropdownMenuContent>
                    <DropdownMenuItem asChild className="flex gap-2 cursor-pointer w-full">
                        <ContextMenuAction icon={!email.category?.id ? "CheckIcon" : "EmptyIcon"} action={updateEmail.bind(null, { category: null })}>
                            None
                        </ContextMenuAction>
                    </DropdownMenuItem>
                    {categories?.map(category => (
                        <DropdownMenuItem key={category.id} asChild className="flex gap-2 cursor-pointer w-full" >
                            <ContextMenuAction icon={email.category?.id === category.id ? "CheckIcon" : "EmptyIcon"} action={updateEmail.bind(null, { category: category.id })}>
                                {category.name}
                            </ContextMenuAction>
                        </DropdownMenuItem>
                    ))}

                </DropdownMenuContent>
            </DropdownMenu>

            <div className="border-e-2 -mx-2" />
            <TooltipText text="Reply">
                <Button variant="ghost" size="auto" className="rounded-full p-2 -m-2 text-muted-foreground hover:text-foreground" asChild>
                    <Link href={`/mail/${mailboxId}/draft/new?reply=${emailId}`}>
                        <ReplyIcon className="h-5 w-5" />
                    </Link>
                </Button>
            </TooltipText>
            <TooltipText text="Reply All">
                <Button variant="ghost" size="auto" className="rounded-full p-2 -m-2 text-muted-foreground hover:text-foreground" asChild>
                    <Link href={`/mail/${mailboxId}/draft/new?replyAll=${emailId}`}>
                        <ReplyAllIcon className="h-5 w-5" />
                    </Link>
                </Button>
            </TooltipText>
            <TooltipText text="Forward">
                <Button variant="ghost" size="auto" className="rounded-full p-2 -m-2 text-muted-foreground hover:text-foreground" asChild>
                    <Link href={`/mail/${mailboxId}/draft/new?forward=${emailId}`}>
                        <ForwardIcon className="h-5 w-5" />
                    </Link>
                </Button>
            </TooltipText>
        </div >

    )
}