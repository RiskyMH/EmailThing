import { Search } from "./nav.search";
import Logo, { EmailThing } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import UserNav from "@/components/user-navbar";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { type PropsWithChildren, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useWindowSize } from "usehooks-ts";
import Sidebar from "./root-layout-sidebar";

export default function Header() {
  const params = useParams<"mailboxId" | "mailId">();
  const mailboxId = params.mailboxId || "demo";

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between bg-sidebar-bg px-7">
      <header className="flex h-16 w-full items-center">
        <MobileNav>
          <div className="mb-2 flex items-center gap-1 p-3">
            <Logo className="size-7" />
            <h2 className="inline-block whitespace-nowrap font-bold text-xl">EmailThing</h2>
          </div>
          <Sidebar className="min-h-[calc(100svh-5.3rem)]" />
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

export function MobileNav({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const windowSize = useWindowSize();
  useEffect(() => setOpen(false), [windowSize]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="-ms-2 me-auto inline p-2 hover:bg-transparent sm:hidden" asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="overflow-y-auto overflow-x-hidden p-3"
        onClick={() => setOpen(false)}
      >
        {children}
      </SheetContent>
    </Sheet>
    // <Drawer open={open} onOpenChange={setOpen} direction="left">
    //     <DrawerTrigger className="-ms-2 me-auto inline p-2 hover:bg-transparent sm:hidden" asChild>
    //         <Button variant="ghost" size="icon">
    //             <MenuIcon />
    //         </Button>
    //     </DrawerTrigger>
    //     <DrawerContent className="overflow-y-auto overflow-x-hidden p-3">
    //         <DrawerClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
    //             <XIcon className="size-4" />
    //             <span className="sr-only">Close</span>
    //         </DrawerClose>
    //         {children}
    //     </DrawerContent>
    // </Drawer>
  );
}
