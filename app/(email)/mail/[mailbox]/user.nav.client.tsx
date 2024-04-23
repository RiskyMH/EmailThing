'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import Link from "next/link"
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon } from "lucide-react"
import { useMediaQuery } from "usehooks-ts";
import { useEffect, useState } from "react"
import { logout } from "./actions"

interface UserProps {
    user: {
        name: string,
        id: string,
        image?: string,
        secondary: string,
    },
    mailboxId: string,
    mailboxes: {
        id: string,
        name: string | null,
    }[]
}

function getInitials(name: string) {
    // first 2 characters of name
    return name.slice(0, 2).toUpperCase()
}

const changeMailboxCookie = (mailboxId: string) => {
    document.cookie = `mailboxId=${mailboxId}; path=/; Expires=Fri, 31 Dec 9999 23:59:59 GMT;`
}

export function UserNav({ user, mailboxId, mailboxes }: UserProps) {
    const [open, setOpen] = useState(false)
    const isDesktop = useMediaQuery("(min-width: 640px)");
    const [mobileSwitchMailbox, setMobileSwitchMailbox] = useState(false)

    useEffect(() => {
        if (open == false) {
            setMobileSwitchMailbox(false)
        }
    }, [open])

    const userIcon = (
        <Button
            variant="ghost"
            className="gap-3 flex ms-auto hover:bg-transparent p-1 rounded-full -me-2 relative sm:rounded-md sm:p-2 sm:-m-2 dark:sm:hover:bg-secondary sm:hover:bg-background"
            suppressHydrationWarning // i give up with sanity
        >
            <ChevronDownIcon className="h-5 w-5 text-muted-foreground -me-2 hidden sm:inline" />
            <span className="hidden sm:inline">{user.name}</span>
            <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user.image} alt={user.name} className="bg-background dark:bg-secondary" />
                <AvatarFallback className="bg-background dark:bg-secondary">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
        </Button>
    )

    // Mobile
    if (!isDesktop) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    {userIcon}
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{user.name}</DrawerTitle>
                        <DrawerDescription>{mobileSwitchMailbox ? "Switch Mailbox" : user.secondary}</DrawerDescription>
                    </DrawerHeader>

                    <div className="mx-4 flex flex-col gap-2 pt-2">
                        {mobileSwitchMailbox ? (
                            <>
                                {mailboxes.map(({ id, name }) => (
                                    <Button key={id} variant="secondary" asChild>
                                        <DrawerClose className="w-full" asChild>
                                            <Link href={`/mail/${id}`} onClick={() => changeMailboxCookie(id)}>
                                                {name || id}
                                            </Link>
                                        </DrawerClose>
                                    </Button>
                                ))}
                                {/* + new */}
                                <Button variant="secondary" asChild>
                                    <DrawerClose className="w-full">
                                        <PlusCircleIcon className="mr-2 h-4 w-4" />
                                        New mailbox
                                    </DrawerClose>
                                </Button>

                            </>
                        ) : (
                            <>
                                <Button variant="secondary" asChild>
                                    <DrawerClose asChild>
                                        <Link href="/settings" className="w-full">
                                            User settings
                                        </Link>
                                    </DrawerClose>
                                </Button>
                                <Button variant="secondary" className="w-full" onClick={() => setMobileSwitchMailbox(true)}>
                                    Switch Mailbox
                                    <ChevronRightIcon className="h-4 w-4 ms-2" />
                                </Button>
                                <Button variant="secondary" asChild>
                                    <DrawerClose className="w-full" onClick={() => void logout()}>
                                        Sign out
                                    </DrawerClose>
                                </Button>
                            </>
                        )}
                    </div>

                    <DrawerFooter>
                        {mobileSwitchMailbox ? (
                            <Button variant="default" onClick={() => setMobileSwitchMailbox(false)}>
                                <ChevronLeftIcon className="h-4 w-4 me-2" />
                                Back
                            </Button>

                        ) : (
                            <DrawerClose asChild>
                                <Button variant="default">Close</Button>
                            </DrawerClose>
                        )}
                    </DrawerFooter>
                </DrawerContent>
            </Drawer >

        )
    }

    // Desktop
    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                {userIcon}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <h3 className="text-sm truncate font-medium">
                            {user.name}
                        </h3>
                        <p className="text-xs truncate text-muted-foreground">
                            {user.secondary}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href={`/mail/${mailboxId}`} className="cursor-pointer">
                            Dashboard
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            Switch Mailbox
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                {mailboxes.map(({ id, name }) => (
                                    <DropdownMenuItem key={id} asChild>
                                        <Link href={`/mail/${id}`} className="cursor-pointer" onClick={() => changeMailboxCookie(id)}>
                                            {name}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                                    <span>New mailbox</span>
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                            User Settings
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <button className="w-full cursor-pointer" onClick={() => void logout()}>
                        Sign out
                    </button>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
