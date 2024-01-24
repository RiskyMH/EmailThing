import { getCurrentUser } from "@/app/utils/user";
import { prisma } from "@email/db";
import { Suspense } from "react";
import { Search } from "./nav.search";
import { UserNav } from "./user.nav.client";
import Link from "next/link";
import { MailIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { mailboxAliases, userMailboxAccess } from "./tools";
import Sidebar from "./sidebar";
import { MobileNav } from "./sidebar.client";


export default function Header({ mailbox: mailboxId }: { mailbox: string }) {
    return (
        <div className="sticky flex items-center justify-between border-b-2 top-0 z-40 bg-secondary dark:bg-tertiary px-7">
            <header className="flex h-16 w-full items-center">
                <MobileNav>
                    <div className="flex gap-2 items-center">
                        <MailIcon />
                        <h1 className="inline-block whitespace-nowrap font-bold text-xl">
                            EmailThing
                        </h1>
                    </div>
                    <Sidebar mailbox={mailboxId} />
                </MobileNav>

                <nav className="w-auto lg:w-[calc(15rem-1.75rem)] mx-auto me-auto sm:ms-0">
                    <Button asChild variant="ghost">
                        <Link
                            className="flex items-center gap-2 hover:bg-transparent sm:-ms-4 sm:me-8"
                            href={"/mail/" + mailboxId}
                        >
                            <MailIcon />
                            <h1 className="inline-block whitespace-nowrap font-bold text-lg">
                                EmailThing
                            </h1>
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

}

function UserMenuFallback() {
    return (
        <div className="h-8 w-8 rounded-full bg-secondary animate-pulse" />
    )
}

async function UserMenu({ mailbox: mailboxId }: { mailbox: string }) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("No access to mailbox");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            username: true,
            id: true
        }
    })
    if (!user) throw new Error("No user found")

    const { default: defaultAlias } = await mailboxAliases(mailboxId);

    return (
        <UserNav mailboxId={mailboxId} user={{
            id: mailboxId,
            name: user.username,
            secondary: defaultAlias!.alias!,
        }} />
    );
}