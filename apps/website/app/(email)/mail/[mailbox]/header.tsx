import { getCurrentUser } from "@/app/utils/user";
import { prisma } from "@email/db";
import { Suspense } from "react";
import { Search } from "./nav.search";
import { UserNav } from "./user.nav.client";
import { getMailbox } from "./tools";
import Link from "next/link";
import { MailIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";


export default function Header({ mailbox: mailboxId }: { mailbox: string }) {
    return (
        <div className="sticky flex items-center justify-between border-b-2 top-0 z-40 bg-secondary dark:bg-tertiary px-7">
            <header className="flex h-16 w-full items-center">
                <nav className="w-auto lg:w-[calc(15rem-1.75rem)]">
                    <Button asChild variant="ghost">
                        <Link
                            className="flex items-center gap-2 hover:bg-transparent -ms-4 me-8 text-lg"
                            href={"/mail/" + mailboxId}
                        >
                            <MailIcon />
                            <span className="inline-block whitespace-nowrap font-bold">
                                EmailThing
                            </span>
                        </Link>
                    </Button>

                </nav>

                <div className="hidden md:flex me-auto">
                    <Search className="relative w-full lg:w-96" />
                </div>
                <div className="flex justify-end ms-auto">
                    <Suspense fallback={<UserMenuFallback />}>
                        <UserMenu mailbox={mailboxId} />
                    </Suspense>
                </div>
            </header>
        </div>
    )
};


async function getUser() {
    const userId = await getCurrentUser()
    if (!userId) return null;
    const user = prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            username: true,
            id: true
        }
    })
    return user;

}

function UserMenuFallback() {
    return (
        <div className="h-8 w-8 rounded-full bg-secondary animate-pulse" />
    )
}

async function UserMenu({ mailbox: mailboxId }: { mailbox: string }) {
    const user = await getUser()!
    const mailbox = await getMailbox(mailboxId, user!.id)!
    return (
        <UserNav mailboxId={mailboxId} user={{
            id: mailbox!.id!,
            name: user!.username,
            secondary: mailbox!.primaryAlias!.alias!,
        }} />
    );
}