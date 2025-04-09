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
import { SidebarLink } from "@/(email)/mail/[mailbox]/sidebar.client";
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
import { Suspense, use } from "react";
import { getEmailCount } from "@/utils/data/queries/email-list";
import { useLiveQuery } from "dexie-react-hooks";
import { useGravatar } from "@/utils/fetching";
import { useParams } from "react-router-dom";
import { getMailboxDefaultAlias, getUserMailboxes } from "@/utils/data/queries/mailbox";

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
    return (
        <Button
            asChild
            variant="ghost"
            className={cn(
                "flex w-full justify-normal gap-4 self-center px-3 py-6 text-center font-bold transition-colors hover:text-foreground lg:self-auto",
                className,
            )}
        >
            <SidebarLink href={href} className="" disabled={disabled} alaisMatch={alaisMatch}>
                <Icon className="size-6 self-center sm:max-lg:mx-auto" />
                <span className="self-center sm:max-lg:hidden">{name}</span>
                {name === "Inbox" ? (
                    <ItemCount mailboxId={href.split("/")[2]} type="unread" primary />
                ) : name === "Draft" ? (
                    <ItemCount mailboxId={href.split("/")[2]} type="drafts" />
                ) : name === "Trash" ? (
                    <ItemCount mailboxId={href.split("/")[2]} type="binned" />
                ) : name === "Temporary Mail" ? (
                    <ItemCount mailboxId={href.split("/")[2]} type="temp" />
                ) : null}
            </SidebarLink>
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
            className={`${primary ? "bg-blue text-blue-foreground" : "bg-secondary text-foreground"} float-right ms-auto select-none self-center rounded px-3 py-1 font-bold text-xs sm:max-lg:hidden`}
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
    // const userId = await getCurrentUser();
    // if (!(userId && (await userMailboxAccess(mailboxId, userId)))) return null;

    // const mailboxes = await userMailboxes(userId);
    // const { default: defaultAlias } = await mailboxAliases(mailboxId);
    const userId = "a"

    // type _mailboxes = Awaited<ReturnType<typeof import("@/(email)/mail/[mailbox]/tools")["userMailboxes"]>>
    // const mailboxes = [
    //     {
    //         id: mailboxId,
    //         name: "demo@emailthing.xyz",
    //         alias: "demo@emailthing.xyz",
    //         role: "DEMO",
    //     },
    // ]
    const _mailboxes = useLiveQuery(async () => getUserMailboxes(), [])
    const mailboxes = _mailboxes?.filter(m => m.id !== "demo")

    // type _defaultAlias = Awaited<ReturnType<typeof import("@/(email)/mail/[mailbox]/tools")["mailboxAliases"]>>
    // const { default: defaultAlias } = {
    //     default: {
    //         alias: "demo@emailthing.xyz",
    //         name: "Demo"
    //     }
    // }
    const defaultAlias = useLiveQuery(async () => getMailboxDefaultAlias(mailboxId), [mailboxId])

    // const gravatarImg = use(gravatar(defaultAlias?.alias ?? "ab@c.com"))
    const gravatarImg = useGravatar(defaultAlias?.alias ?? "ab@c.com")

    if (!defaultAlias) return <MailboxesFallback />

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: "ghost" }), "flex w-full gap-3 px-3 text-left sm:max-lg:px-1")}
            >
                {mailboxId === "demo" ? (
                    <UserCircle2 className="size-6 text-yellow-500 md:me-1" />
                ) : (
                    <Avatar className="size-7">
                        <AvatarImage className="rounded-full" src={gravatarImg} />
                        <AvatarFallback className="size-full rounded-full bg-secondary p-1 text-muted-foreground text-xs">
                            {(defaultAlias?.alias || "ab").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                )}
                <span className="text-foreground text-sm sm:max-lg:hidden">{defaultAlias?.name}</span>

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
                {(mailboxId === "demo" && !mailboxes?.length) && (
                    <DropdownMenuItem asChild>
                        <Link href="/register">
                            <LogInIcon className="mr-2 size-4 text-muted-foreground" />
                            <span>Register</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                    <PlusCircleIcon className="mr-2 size-4 text-muted-foreground" />
                    <span>New mailbox</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
