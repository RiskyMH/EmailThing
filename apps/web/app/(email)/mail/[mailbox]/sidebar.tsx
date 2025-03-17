import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DraftEmail, Email, db } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { gravatar } from "@/utils/tools";
import { cn } from "@/utils/tw";
import { and, count, eq, isNotNull, isNull } from "drizzle-orm";
import {
    CheckIcon,
    ChevronsUpDownIcon,
    FileIcon,
    InboxIcon,
    PenSquareIcon,
    PlusCircleIcon,
    SendIcon,
    SettingsIcon,
    ShieldAlertIcon,
    StarIcon,
    TimerIcon,
    Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { Suspense, cache } from "react";
import { MailboxLink } from "./components.client";
import { SidebarLink } from "./sidebar.client";
import { mailboxAliases, userMailboxAccess, userMailboxes } from "./tools";

export const Sidebar = cache(({ mailbox: mailboxId, className }: { mailbox: string; className?: string }) => {
    const items = [
        {
            name: "Inbox",
            icon: InboxIcon,
            href: `/mail/${mailboxId}`,
        },
        {
            name: "Draft",
            icon: FileIcon,
            href: `/mail/${mailboxId}/drafts`,
        },
        {
            name: "Starred",
            icon: StarIcon,
            href: `/mail/${mailboxId}/starred`,
        },
        {
            name: "Sent",
            icon: SendIcon,
            href: `/mail/${mailboxId}/sent`,
        },
        {
            name: "Trash",
            icon: Trash2Icon,
            href: `/mail/${mailboxId}/trash`,
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
            disabled: true,
        },
    ];

    return (
        <div
            className={cn(
                "flex min-h-screen flex-col overflow-y-auto text-tertiary-foreground sm:shrink-0 sm:bg-tertiary sm:p-3 lg:w-60",
                className,
            )}
        >
            <br className="sm:hidden" />

            <Button asChild variant="secondary" className="my-3 w-full gap-2 rounded p-6 px-4 font-bold lg:px-6">
                <Link href={`/mail/${mailboxId}/draft/new`}>
                    <PenSquareIcon className="size-5" />
                    <span className="sm:max-lg:hidden">New Message</span>
                </Link>
            </Button>

            <div className="flex flex-col gap-2 py-2 text-sm">
                {items.map((item) => (
                    <LinkElement key={item.href} {...item} />
                ))}

                {/* <hr className="bg-border w-full" />
                <LinkElement
                    name="Mailbox Config"
                    icon={SettingsIcon}
                    href={`/mail/${mailboxId}/config`}
                /> */}
            </div>

            <div className="mt-auto flex flex-col justify-end gap-1">
                <hr className="w-full bg-border " />
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
    );
});

export default Sidebar;

function LinkElement({
    href,
    name,
    icon: Icon,
    disabled,
    className,
}: {
    href: string;
    name: string;
    icon: any;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <Button
            asChild
            variant="ghost"
            className={cn(
                "flex w-full justify-normal gap-4 self-center px-3 py-6 text-center font-bold transition-colors hover:text-foreground lg:self-auto",
                className,
            )}
        >
            <SidebarLink href={href} className="" disabled={disabled}>
                <Icon className="size-6 self-center sm:max-lg:mx-auto" />
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
                ) : name === "Temporary Mail" ? (
                    <Suspense>
                        <ItemCount mailboxId={href.split("/")[2]} type="temp" />
                    </Suspense>
                ) : null}
            </SidebarLink>
        </Button>
    );
}

const getCounts = cache(async (mailboxId: string) => {
    const userId = await getCurrentUser();
    if (!(await userMailboxAccess(mailboxId, userId))) return {};

    const unreadEmails = await db
        .select({ count: count() })
        .from(Email)
        .where(
            and(eq(Email.mailboxId, mailboxId), eq(Email.isRead, false), isNull(Email.binnedAt), isNull(Email.tempId), eq(Email.isDeleted, false)),
        )
        .execute();

    const binnedEmails = await db
        .select({ count: count() })
        .from(Email)
        .where(and(eq(Email.mailboxId, mailboxId), isNotNull(Email.binnedAt), eq(Email.isDeleted, false)))
        .execute();

    const drafts = await db
        .select({ count: count() })
        .from(DraftEmail)
        .where(and(eq(DraftEmail.mailboxId, mailboxId), eq(DraftEmail.isDeleted, false)))
        .execute();

    const tempEmails = await db
        .select({ count: count() })
        .from(Email)
        .where(and(eq(Email.mailboxId, mailboxId), eq(Email.isRead, false), isNotNull(Email.tempId), eq(Email.isDeleted, false)))
        .execute();

    return {
        unread: unreadEmails[0].count,
        binned: binnedEmails[0].count,
        drafts: drafts[0].count,
        temp: tempEmails[0].count,
    };
});

async function ItemCount({
    mailboxId,
    type,
    primary = false,
}: {
    mailboxId: string;
    type: "unread" | "binned" | "drafts" | "temp";
    primary?: boolean;
}) {
    // return <></>
    const counts = await getCounts(mailboxId);
    const item = counts[type];
    if (!item || item === 0) {
        return <></>;
    }

    return (
        <span
            className={`${primary ? "bg-blue text-blue-foreground" : "bg-secondary text-foreground"} float-right ms-auto select-none self-center rounded px-3 py-1 font-bold text-xs sm:max-lg:hidden`}
        >
            {item}
        </span>
    );
}

function MailboxesFallback() {
    return (
        <div className="flex h-10 w-full animate-pulse gap-3 rounded-md bg-tertiary px-3 py-2 sm:max-lg:px-1">
            <div className="size-7 animate-pulse rounded-full bg-secondary" />

            <ChevronsUpDownIcon className="ms-auto size-5 self-center text-muted-foreground sm:max-lg:hidden" />
        </div>
    );
}

const Mailboxes = async ({ mailbox: mailboxId }: { mailbox: string }) => {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) return null;

    const mailboxes = await userMailboxes(userId);
    const { default: defaultAlias } = await mailboxAliases(mailboxId);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: "ghost" }), "flex w-full gap-3 px-3 text-left sm:max-lg:px-1")}
            >
                <Avatar className="size-7">
                    <AvatarImage className="rounded-full" src={await gravatar(defaultAlias?.alias ?? "ab@c.com")} />
                    <AvatarFallback className="size-full rounded-full bg-secondary p-1 text-muted-foreground text-xs">
                        {(defaultAlias?.alias || "ab").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span className="text-foreground text-sm sm:max-lg:hidden">{defaultAlias?.name}</span>

                <ChevronsUpDownIcon className="ms-auto size-5 self-center text-muted-foreground sm:max-lg:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {mailboxes.map((m) => (
                    <DropdownMenuItem key={m.id} asChild className="flex cursor-pointer gap-2">
                        <MailboxLink mailboxId={m.id}>
                            {m.id === mailboxId ? (
                                <CheckIcon className="size-4 text-muted-foreground" />
                            ) : (
                                <span className="w-4" />
                            )}
                            {m.name}
                        </MailboxLink>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                    <PlusCircleIcon className="mr-2 size-4 text-muted-foreground" />
                    <span>New mailbox</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
