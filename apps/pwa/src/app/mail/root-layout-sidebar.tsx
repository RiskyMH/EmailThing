import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MailboxLink } from "@/(email)/mail/[mailbox]/components.client";
import { cn } from "@/utils/tw";

import {
    CheckIcon,
    ChevronsUpDownIcon,
    FileIcon,
    InboxIcon,
    LogInIcon,
    PenSquareIcon,
    PlusCircleIcon,
    SendIcon,
    SettingsIcon,
    ShieldAlertIcon,
    StarIcon,
    TimerIcon,
    Trash2Icon,
    UserCircle2,
} from "lucide-react";
import Link from "@/components/link";
import { getEmailCount } from "@/utils/data/queries/email-list";
import { useLiveQuery } from "dexie-react-hooks";
import { useGravatar } from "@/utils/fetching";
import { useParams } from "react-router-dom";
import { getMailboxDefaultAlias, getUserMailboxes } from "@/utils/data/queries/mailbox";
import { usePathname } from "next/navigation";

export const Sidebar = ({ className }: { className?: string }) => {
    const params = useParams<"mailboxId" | "mailId">()
    const mailboxId = params.mailboxId || "demo"


    const items = [
        {
            name: "Inbox",
            icon: InboxIcon,
            href: `/mail/${mailboxId}`,
            alaisMatch: `/mail`
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
            name: "Temporary Mail",
            icon: TimerIcon,
            href: `/mail/${mailboxId}/temp`,
        },
        "---",
        {
            name: "Trash",
            icon: Trash2Icon,
            href: `/mail/${mailboxId}/trash`,
        },
        {
            name: "Spam",
            icon: ShieldAlertIcon,
            href: `/mail/${mailboxId}/#spam`,
            disabled: true,
        },
    ] as const;

    return (
        <div
            className={cn(
                "flex min-h-screen flex-col overflow-y-auto text-tertiary-foreground sm:shrink-0 sm:bg-tertiary sm:p-2 lg:w-60 sm:max-lg:p-2",
                className,
            )}
        >

            <Button asChild variant="secondary" size="sm" className="gap-2 rounded-lg p-5 px-3 lg:px-6 mx-">
                <Link href={`/mail/${mailboxId}/draft/new`}>
                    <PenSquareIcon className="size-5 text-muted-foreground sm:max-lg:text-foreground/80" />
                    <span className="sm:max-lg:hidden">New Message</span>
                </Link>
            </Button>

            <div className="flex flex-col gap-1.5 py-2 text-sm mt-2">
                {items.map((item) => (
                    item === "---"
                        ? <hr className="bg-border sm:max-lg:w-full m-2 sm:max-lg:m-0" />
                        : <LinkElement key={item.href} {...item} />
                ))}
            </div>

            <div className="mt-auto flex flex-col justify-end gap-1">
                <Mailboxes mailbox={mailboxId} />
            </div>
        </div>
    );
};

export default Sidebar;

function LinkElement({
    href,
    name,
    icon: Icon,
    disabled,
    className,
    alaisMatch,
}: {
    href: string;
    name: string;
    icon: any;
    disabled?: boolean;
    className?: string;
    alaisMatch?: string;
}) {
    const pathName = usePathname();

    const isActive = pathName === href || (alaisMatch && pathName === alaisMatch)


    return (
        <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
                disabled && "group relative flex h-9 w-full cursor-not-allowed items-center gap-4 rounded px-5 opacity-50",
                "flex w-full justify-normal gap-3 self-center px-3 py-2.5 text-center transition-colors text-foreground/80 lg:self-auto",
                isActive && "text-blue dark:text-foreground bg-accent/65",
                "hover:bg-accent/65 active:bg-accent/80",
                className,
            )}
        >
            <Link href={href || "#"}>
                {/* {isActive && (
                    <span className="sm:-ms-5 absolute start-0 me-1 h-9 w-1 self-center rounded-e bg-blue sm:relative sm:start-auto dark:bg-foreground" />
                )} */}

                <Icon className={cn("size-5 self-center sm:max-lg:mx-auto text-muted-foreground group-hover:text-foreground", isActive && "text-blue dark:text-foreground")} />
                <span className={cn("self-center sm:max-lg:hidden", isActive && "font-bold")}>{name}</span>
                {name === "Inbox" ? (
                    <ItemCount mailboxId={href.split("/")[2]} type="unread" primary />
                ) : name === "Draft" ? (
                    <ItemCount mailboxId={href.split("/")[2]} type="drafts" />
                ) : name === "Trash" ? (
                    <ItemCount mailboxId={href.split("/")[2]} type="binned" />
                ) : name === "Temporary Mail" ? (
                    <ItemCount mailboxId={href.split("/")[2]} type="temp" />
                ) : null}
            </Link>
        </Button>
    );
}




function ItemCount({
    mailboxId,
    type,
    primary = false,
}: {
    mailboxId: string;
    type: "unread" | "binned" | "drafts" | "temp";
    primary?: boolean;
}) {
    const count = useLiveQuery(async () => {
        return await getEmailCount(mailboxId, type);
    });
    if (!count || count === 0) return <></>

    return (
        <span
            className={`${primary ? "bg-blue text-blue-foreground py-0.5 px-1 min-w-6" : "text-muted-foreground pe-1"} float-right ms-auto select-none self-center rounded text-xs sm:max-lg:hidden -me-1`}
        >
            {count}
        </span>
    );
}

function MailboxesFallback() {
    return (
        <div className="flex h-10 w-full animate-pulse gap-3 rounded-md bg-tertiary px-3 py-2 sm:max-lg:px-1">
            <div className="size-7 animate-pulse rounded-full bg-secondary sm:max-lg:mx-auto" />

            <ChevronsUpDownIcon className="ms-auto size-5 self-center text-muted-foreground sm:max-lg:hidden" />
        </div>
    );
}

const Mailboxes = ({ mailbox: mailboxId }: { mailbox: string }) => {

    const settingsLink = (
        <>
            <hr className="w-full bg-border " />
            <LinkElement
                name="Mailbox Config"
                icon={SettingsIcon}
                href={`/mail/${mailboxId}/config`}
            // className="py-4"
            />
        </>
    )

    const _mailboxes = useLiveQuery(async () => getUserMailboxes(), [])
    const mailboxes = _mailboxes?.filter(m => m.id !== "demo")

    const defaultAlias = useLiveQuery(async () => getMailboxDefaultAlias(mailboxId), [mailboxId])
    const gravatarImg = useGravatar(defaultAlias?.alias ?? "ab@c.com")

    if (mailboxId !== "demo") {
        if (!mailboxes) return null
        if (mailboxes.length < 2) return settingsLink
    }

    return (
        <> {settingsLink}
            <DropdownMenu>
                <DropdownMenuTrigger
                    className={cn(buttonVariants({ variant: "ghost" }), "sm:max-lg:h-9 h-12 flex w-full gap-2 px-3 text-left sm:max-lg:px-1", mailboxId === "demo" && "h-10")}
                >
                    {mailboxId === "demo" ? (
                        <UserCircle2 className="size-6 text-yellow-500 sm:max-lg:ms-auto sm:max-lg:-me-0.5" />
                    ) : (
                        // null
                        <Avatar className="size-7 -ms-1 sm:max-lg:ms-auto sm:max-lg:-me-1">
                            <AvatarImage className="rounded-full" src={gravatarImg} />
                            <AvatarFallback className="size-full rounded-full bg-secondary p-1 text-muted-foreground text-xs">
                                {(defaultAlias?.alias || "ab").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <div className="flex flex-col overflow-hidden text-ellipsis">
                        <span className="text-foreground text-sm sm:max-lg:hidden overflow-hidden text-ellipsis">
                            {mailboxId === "demo" ? "Demo" : defaultAlias?.alias}
                        </span>
                        <span className="text-muted-foreground text-xs sm:max-lg:hidden">
                            {mailboxId === "demo"
                                ? "Test account"
                                : mailboxes?.find(m => m.id === mailboxId)?.role === "OWNER" ? "Personal" : "Personal (shared)"
                            }
                        </span>
                    </div>

                    <ChevronsUpDownIcon className="ms-auto size-5 self-center text-muted-foreground sm:max-lg:hidden" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {mailboxes?.map((m) => (
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
                    {(mailboxId === "demo" && !mailboxes?.length) ? (
                        <DropdownMenuItem asChild>
                            <Link href="/register">
                                <LogInIcon className="mr-2 size-4 text-muted-foreground" />
                                <span>Register</span>
                            </Link>
                        </DropdownMenuItem>
                    ) : (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>
                                <PlusCircleIcon className="mr-2 size-4 text-muted-foreground" />
                                <span>New shared mailbox</span>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};
