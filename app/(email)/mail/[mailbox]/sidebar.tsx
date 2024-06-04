import { Button, buttonVariants } from "@/components/ui/button";
import { db, DraftEmail, Email } from "@/db";
import { FileIcon, InboxIcon, PenSquareIcon, SendIcon, ShieldAlertIcon, StarIcon, Trash2Icon, SettingsIcon, TimerIcon, CheckIcon, ChevronsUpDownIcon, PlusCircleIcon } from "lucide-react";
import Link from "next/link";
import { SidebarLink } from "./sidebar.client";
import { Suspense, cache } from "react";
import { cn } from "@/utils/tw";
import { getCurrentUser } from "@/utils/jwt";
import { mailboxAliases, userMailboxAccess, userMailboxes } from "./tools";
import { and, count, eq, isNotNull } from "drizzle-orm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MailboxLink } from "./components.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { gravatar } from "@/utils/tools";

export const Sidebar = cache(({ mailbox: mailboxId, className }: { mailbox: string, className?: string }) => {

    const items = [
        {
            name: "Inbox",
            icon: InboxIcon,
            href: `/mail/${mailboxId}`
        },
        {
            name: "Draft",
            icon: FileIcon,
            href: `/mail/${mailboxId}/drafts`
        },
        {
            name: "Starred",
            icon: StarIcon,
            href: `/mail/${mailboxId}/starred`
        },
        {
            name: "Sent",
            icon: SendIcon,
            href: `/mail/${mailboxId}/sent`
        },
        {
            name: "Trash",
            icon: Trash2Icon,
            href: `/mail/${mailboxId}/trash`
        },
        {
            name: "Temporary Mail",
            icon: TimerIcon,
            href: `/mail/${mailboxId}/temp`,
        },
        {
            name: "Spam",
            icon: ShieldAlertIcon,
            href: `/mail/${mailboxId}/#spam`,
            disabled: true
        },
    ]

    return (
        <div className={cn("min-h-screen sm:bg-tertiary text-tertiary-foreground lg:w-60 sm:p-3 sm:flex-shrink-0 flex flex-col overflow-y-auto", className)}>

            <br className="sm:hidden" />

            <Button asChild variant="secondary" className="rounded w-full gap-2 p-6 px-4 lg:px-6 font-bold my-3">
                <Link href={`/mail/${mailboxId}/draft/new`}>
                    <PenSquareIcon className="h-5 w-5" />
                    <span className="sm:max-lg:hidden">New Message</span>
                </Link>
            </Button>

            <div className="flex flex-col gap-2 py-2 text-sm">
                {items.map(item => (<LinkElement key={item.href} {...item} />))}

                {/* <hr className="bg-border w-full" />
                <LinkElement
                    name="Mailbox Config"
                    icon={SettingsIcon}
                    href={`/mail/${mailboxId}/config`}
                /> */}
            </div>

            <div className="flex mt-auto justify-end flex-col gap-1">
                <hr className="bg-border w-full " />
                <LinkElement
                    name="Mailbox Config"
                    icon={SettingsIcon}
                    href={`/mail/${mailboxId}/config`}
                    className="py-4"
                />
                <Suspense fallback={<MailboxesFallback />}>
                    <Mailboxes mailbox={mailboxId} />
                </Suspense>
            </div>
        </div>
    )

})

export default Sidebar;

function LinkElement({ href, name, icon: Icon, disabled, className }: { href: string, name: string, icon: any, disabled?: boolean, className?: string }) {
    return (
        <Button asChild variant="ghost" className={cn("flex py-6 px-3 gap-4 hover:text-foreground font-bold transition-colors justify-normal self-center w-full lg:self-auto text-center", className)}>
            <SidebarLink href={href} className="" disabled={disabled}>
                <Icon className="h-6 w-6 self-center sm:max-lg:mx-auto" />
                <span className="self-center sm:max-lg:hidden">{name}</span>
                {name === "Inbox" ? (
                    <Suspense>
                        <ItemCount mailboxId={href.split("/")[2]} type="unread" primary />
                    </Suspense>
                ) : name === "Draft" ? (
                    <Suspense>
                        <ItemCount mailboxId={href.split("/")[2]} type="drafts" />
                    </Suspense>
                ) : name === "Trash" ? (
                    <Suspense>
                        <ItemCount mailboxId={href.split("/")[2]} type="binned" />
                    </Suspense>
                ) : null}
            </SidebarLink>
        </Button>
    )
}

const getCounts = cache(async (mailboxId: string) => {
    const userId = await getCurrentUser()
    if (!await userMailboxAccess(mailboxId, userId)) return {}

    const unreadEmails = await db
        .select({ count: count() })
        .from(Email)
        .where(and(
            eq(Email.mailboxId, mailboxId),
            eq(Email.isRead, false)
        ))
        .execute()

    const binnedEmails = await db
        .select({ count: count() })
        .from(Email)
        .where(and(
            eq(Email.mailboxId, mailboxId),
            isNotNull(Email.binnedAt)
        ))
        .execute()

    const drafts = await db
        .select({ count: count() })
        .from(DraftEmail)
        .where(eq(DraftEmail.mailboxId, mailboxId))
        .execute()

    return {
        unread: unreadEmails[0].count,
        binned: binnedEmails[0].count,
        drafts: drafts[0].count,
    }
})


async function ItemCount({ mailboxId, type, primary = false }: { mailboxId: string, type: "unread" | "binned" | "drafts", primary?: boolean }) {
    // return <></>
    const counts = await getCounts(mailboxId)
    const item = counts[type]
    if (!item || item === 0) {
        return <></>
    }

    return (
        <span className={`${primary ? "bg-blue text-blue-foreground" : "bg-secondary text-foreground"} rounded font-bold px-3 py-1 text-xs ms-auto float-right self-center select-none sm:max-lg:hidden`}>
            {item}
        </span>
    )
}


function MailboxesFallback() {
    return (
        <div className="w-full h-10 py-2 rounded-md bg-tertiary animate-pulse flex gap-3 px-3 sm:max-lg:px-1">
            <div className="h-7 w-7 bg-secondary animate-pulse rounded-full" />

            <ChevronsUpDownIcon className="text-muted-foreground h-5 w-5 ms-auto self-end sm:max-lg:hidden" />
        </div>
    )
}

const Mailboxes = (async ({ mailbox: mailboxId }: { mailbox: string }) => {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) return null

    const mailboxes = await userMailboxes(userId);
    const { default: defaultAlias } = await mailboxAliases(mailboxId);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "flex gap-3 px-3 sm:max-lg:px-1 w-full text-left")}>
                <Avatar className="h-7 w-7">
                    <AvatarImage className="rounded-full" src={await gravatar(defaultAlias?.alias ?? "ab@c.com")} />
                    <AvatarFallback className="rounded-full text-muted-foreground bg-secondary p-1 text-xs w-full h-full">
                        {(defaultAlias?.alias || "ab").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span className="text-sm sm:max-lg:hidden text-foreground">{defaultAlias?.name}</span>

                <ChevronsUpDownIcon className="text-muted-foreground h-5 w-5 ms-auto self-end sm:max-lg:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {mailboxes.map(m => (
                    <DropdownMenuItem key={m.id} asChild className="flex gap-2 cursor-pointer">
                        <MailboxLink mailboxId={m.id}>
                            {m.id === mailboxId ? <CheckIcon className="text-muted-foreground h-4 w-4" /> : <span className="w-4" />}
                            {m.name}
                        </MailboxLink>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                    <PlusCircleIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>New mailbox</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
})
