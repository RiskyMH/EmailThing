import { Search } from "./nav.search";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Sidebar from "./sidebar";
import { MobileNav } from "./sidebar.client";
import Logo, { EmailThing } from "@/components/logo";
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
                    <Sidebar mailbox={mailboxId} className="min-h-[calc(100%-2rem)]" />
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
                    {/* <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="auto" className="self-center p-1.5 rounded-full hidden sm:flex">
                                <BellIcon className="h-5 w-5 text-muted-foreground" />
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
    )
};

