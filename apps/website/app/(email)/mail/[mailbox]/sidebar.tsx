import { Button } from "@/app/components/ui/button";
import { prisma } from "@email/db";
import { FileIcon, InboxIcon, PenSquareIcon, SendIcon, ShieldAlertIcon, StarIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { SidebarLink } from "./sidebar.client";
import { Suspense } from "react";

export default function Sidebar({ mailbox: mailboxId }: { mailbox: string }) {

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
            href: `/mail/${mailboxId}/bin`
        },
        {
            name: "Spam",
            icon: ShieldAlertIcon,
            href: `/mail/${mailboxId}/#spam`
        },
    ]

    return (
        <div className="min-h-screen bg-tertiary text-tertiary-foreground lg:w-60 p-3 flex-shrink-0 hidden sm:inline">

            <Button asChild variant="secondary" className="rounded w-full gap-2 p-6 px-4 lg:px-6 font-bold my-3">
                <Link href="#new">
                    <PenSquareIcon className="h-5 w-5" /> <span className="hidden lg:inline">New Message</span>
                </Link>
            </Button>

            <br className="h-4" />

            <div className="flex flex-col gap-2 py-2 text-sm">
                {items.map(item => (<LinkElement key={item.href} {...item} />))}
            </div>
        </div>
    )

}

function LinkElement({ href, name, icon: Icon }: { href: string, name: string, icon: any }) {

    return (
        <Button asChild variant="ghost" className="flex py-6 px-3 gap-4 hover:text-foreground font-bold transition-colors justify-normal self-center lg:self-auto">
            <SidebarLink href={href} className="">
                <Icon className="h-6 w-6" /> <span className="self-center hidden lg:inline">{name}</span>
                {(name === "Inbox") && (
                    <Suspense>
                        <UnreadEmailsCount mailboxId={href.split("/")[2]} />
                    </Suspense>
                )}
            </SidebarLink>
        </Button>
    )
}

async function UnreadEmailsCount({ mailboxId }: { mailboxId: string }) {

    const unreadEmails = await prisma.email.count({
        where: {
            mailbox: {
                id: mailboxId
            },
            isRead: false
        }
    })
    if (unreadEmails === 0) {
        return null
    }

    return (
        <span className="bg-blue text-blue-foreground rounded font-bold px-3 py-1 text-xs ms-auto float-right self-center select-none hidden lg:inline">
            {unreadEmails}
        </span>
    )

}
