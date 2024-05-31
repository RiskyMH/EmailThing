import { getCurrentUser } from "@/utils/jwt";
import { db, User } from "@/db";
import { cache, Suspense } from "react";
import { Search } from "./nav.search";
import Link from "next/link";
import { CheckIcon, ChevronsUpDownIcon, PlusCircleIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { mailboxAliases, userMailboxAccess, userMailboxes } from "./tools";
import Sidebar from "./sidebar";
import { MobileNav } from "./sidebar.client";
import { eq } from "drizzle-orm";
import { gravatar } from "@/utils/tools";
import { redirect } from "next/navigation";
import Logo, { EmailThing, EmailthingText } from "@/components/logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/tw";
import { MailboxLink } from "./components.client";
import UserNav from "@/components/user-navbar";


export default function Header({ mailbox: mailboxId }: { mailbox: string }) {

    return (
        <div className="sticky flex items-center justify-between border-b-2 top-0 z-40 bg-secondary dark:bg-tertiary px-7">
            <header className="flex h-16 w-full items-center">
                <MobileNav>
                    <div className="flex gap-1 items-center">
                        <Logo className="h-7 w-7" />
                        <h2 className="inline-block whitespace-nowrap font-bold text-xl">
                            EmailThing
                        </h2>
                    </div>
                    <Sidebar mailbox={mailboxId} />

                    <div className="fixed bottom-3 w-[calc(75vw-3rem)]">
                        <Suspense fallback={<MailboxesFallback />}>
                            <Mailboxes mailbox={mailboxId} />
                        </Suspense>
                    </div>
                </MobileNav>

                <nav className="w-auto lg:w-[calc(15rem-1.75rem)] mx-auto me-auto sm:ms-0 sm:mx-0">
                    <Button asChild variant="ghost">
                        <Link
                            className="flex items-center gap-1 hover:bg-transparent sm:-ms-4 sm:me-8 group"
                            href={"/mail/" + mailboxId}
                        >
                            <EmailThing />
                        </Link>
                    </Button>

                </nav>

                <div className="hidden md:flex me-auto">
                    <Search className="relative w-full lg:w-96" mailboxId={mailboxId} />
                </div>
                <div className="flex gap-3 justify-end ms-auto self-center">
                    <div className="hidden sm:flex">
                        <Suspense fallback={<MailboxesFallback />}>
                            <Mailboxes mailbox={mailboxId} />
                        </Suspense>
                    </div>

                    <UserNav />
                </div>
            </header>
        </div>
    )
};

function MailboxesFallback() {
    return (
        // <div className="m-2 w-32 h-8 rounded-md bg-tertiary sm:bg-secondary animate-pulse" />
        <span />
    )
}

const Mailboxes = cache(async ({ mailbox: mailboxId }: { mailbox: string }) => {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) return null

    const mailboxes = await userMailboxes(userId);
    const { default: defaultAlias } = await mailboxAliases(mailboxId);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", className: "flex gap-1 pe-2 bg-tertiary sm:bg-transparent hover:sm:bg-tertiary dark:hover:sm:bg-secondary w-full" })}>
                <span className="self-center text-sm">{defaultAlias?.name}</span>
                <ChevronsUpDownIcon className="text-muted-foreground h-5 w-5 self-center" />
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
