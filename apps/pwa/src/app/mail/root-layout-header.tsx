import Logo, { EmailThing } from "@/components/logo";
import { Button } from "@/components/ui/button";
import UserNav from "@/components/user-navbar";
import Link from "next/link";
import { Search } from "@/(email)/mail/[mailbox]/nav.search";
import Sidebar from "./root-layout-sidebar";
import { MobileNav } from "@/(email)/mail/[mailbox]/sidebar.client";
import { useParams } from "react-router-dom";

export default function Header() {
    const params = useParams<"mailboxId" | "mailId">()
    const mailboxId = params.mailboxId || "demo"

    return (
        <div className="sticky top-0 z-40 flex items-center justify-between border-b-2 bg-secondary px-7 dark:bg-tertiary">
            <header className="flex h-16 w-full items-center">
                <MobileNav>
                    <div className="flex items-center gap-1">
                        <Logo className="size-7" />
                        <h2 className="inline-block whitespace-nowrap font-bold text-xl">EmailThing</h2>
                    </div>
                    <Sidebar className="min-h-[calc(100%-2rem)]" />
                </MobileNav>

                <nav className="mx-auto me-auto w-auto sm:mx-0 sm:ms-0 lg:w-[calc(15rem-1.75rem)]">
                    <Button asChild variant="ghost">
                        <Link
                            className="sm:-ms-4 group flex items-center gap-1 hover:bg-transparent sm:me-8"
                            href={`/mail/${mailboxId}`}
                        >
                            <EmailThing />
                        </Link>
                    </Button>
                </nav>

                <div className="me-auto hidden md:flex">
                    <Search className="relative w-full lg:w-96" mailboxId={mailboxId} />
                </div>
                <div className="ms-auto flex justify-end gap-3 self-center">
                    {/* <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="auto" className="self-center p-1.5 rounded-full hidden sm:flex">
                                <BellIcon className="size-5 text-muted-foreground" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="text-sm w-full">
                            //todo: indeed to
                            not implemented yet
                        </PopoverContent>
                    </Popover> */}

                    <UserNav />
                </div>
            </header>
        </div>
    );
}
