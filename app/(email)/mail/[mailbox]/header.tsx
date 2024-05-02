import { getCurrentUser } from "@/utils/jwt";
import { db, Mailbox, MailboxForUser, User, MailboxAlias } from "@/db";
import { Suspense } from "react";
import { Search } from "./nav.search";
import { UserNav } from "./user.nav.client";
import Link from "next/link";
import { MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mailboxAliases, userMailboxAccess, userMailboxes } from "./tools";
import Sidebar from "./sidebar";
import { MobileNav } from "./sidebar.client";
import { eq } from "drizzle-orm";
import { gravatar } from "@/utils/tools";
import { redirect } from "next/navigation";
import Logo from "@/components/logo";


export default function Header({ mailbox: mailboxId }: { mailbox: string }) {
    return (
        <div className="sticky flex items-center justify-between border-b-2 top-0 z-40 bg-secondary dark:bg-tertiary px-7">
            <header className="flex h-16 w-full items-center">
                <MobileNav>
                    <div className="flex gap-2 items-center">
                        <Logo className="h-7 w-7" />
                        <h1 className="inline-block whitespace-nowrap font-bold text-xl">
                            EmailThing
                        </h1>
                    </div>
                    <Sidebar mailbox={mailboxId} />
                </MobileNav>

                <nav className="w-auto lg:w-[calc(15rem-1.75rem)] mx-auto me-auto sm:ms-0 sm:mx-0">
                    <Button asChild variant="ghost">
                        <Link
                            className="flex items-center gap-2 hover:bg-transparent sm:-ms-4 sm:me-8 group"
                            href={"/mail/" + mailboxId}
                        >
                            <Logo className="h-7 w-7" />
                            <h1 className="inline-block whitespace-nowrap font-bold text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-br from-[#FF9797] to-[#6D6AFF]">
                                EmailThing
                            </h1>
                        </Link>
                    </Button>

                </nav>

                <div className="hidden md:flex me-auto">
                    <Search className="relative w-full lg:w-96" mailboxId={mailboxId} />
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

function UserMenuFallback() {
    return (
        <div className="h-8 w-8 rounded-full bg-secondary animate-pulse" />
    )
}

async function UserMenu({ mailbox: mailboxId }: { mailbox: string }) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) return null

    const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            username: true,
            onboardingStatus: true
        }
    })
    if (!user) return null
    if (!user.onboardingStatus?.initial) return redirect("/onboarding/welcome");

    const { default: defaultAlias } = await mailboxAliases(mailboxId);
    const mailboxes = await userMailboxes(userId);


    return (
        <UserNav mailboxId={mailboxId} mailboxes={mailboxes} user={{
            id: mailboxId,
            name: user.username,
            secondary: defaultAlias?.alias ?? "email@email.?",
            image: defaultAlias?.alias ? await gravatar(defaultAlias.alias) : undefined,
        }} />
    );
}