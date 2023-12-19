import { Button } from "@/app/components/ui/button";
import { prisma } from "@email/db";
import { FileIcon, InboxIcon, PenSquareIcon, SendIcon, ShieldAlertIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { SideBarLink } from "./sidebar.client";
import { Suspense } from "react";

export default function Sidebar({ mailbox: mailboxId }: { mailbox: string }) {

    const items = [
        {
            name: "Inbox",
            icon: InboxIcon,
            href: `/mail/${mailboxId}`
        },
        {
            name: "Drafts",
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
            name: "Bin",
            icon: ShieldAlertIcon,
            href: `/mail/${mailboxId}/bin`
        },
    ]

    return (
        <div className="h-auto min-h-screen bg-tertiary text-tertiary-foreground w-64 p-3">
            <br className="h-5" />

            <Button asChild variant="secondary" className="rounded w-full gap-2 p-6 font-bold my-3">
                <Link href="#new">
                    <PenSquareIcon className="h-5 w-5" /> New Message
                </Link>
            </Button>

            <br className="h-4" />

            <div className="flex flex-col p-2 gap-8 text-sm">
                {items.map(item => (<LinkElement key={item.href} {...item} />))}
            </div>
        </div>
    )

}

function LinkElement({ href, name, icon: Icon }: { href: string, name: string, icon: any }) {

    return (
        // <Button asChild variant="ghost" className="rounded w-full gap-2 p-6 font-bold">
        <SideBarLink href={href} className="flex gap-4 hover:text-foreground font-bold transition-colors">
            <Icon className="h-6 w-6" /> <span className="self-center">{name}</span>
            {(name === "Inbox") && (
                <Suspense>
                    <UnreadEmailsCount mailboxId={href.split("/")[2]} />
                </Suspense>
            )}
        </SideBarLink>
        // </Button>
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
        <span className="bg-blue text-blue-foreground rounded font-bold px-3 py-1 text-xs ml-auto float-right self-center select-none">
            {unreadEmails}
        </span>
    )

}
