'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Button } from "@/app/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/app/components/ui/drawer"
import Link from "next/link"
import { ChevronDownIcon } from "lucide-react"
import { useMediaQuery } from "usehooks-ts";
import { useState } from "react"
import { logout } from "./actions"

interface UserProps {
    user: {
        name: string,
        id: string,
        image?: string,
        secondary: string,
    },
    mailboxId: string
}

function getInitials(name: string) {
    // first 2 characters of name
    return name.slice(0, 2).toUpperCase()
}

export function UserNav({ user, mailboxId }: UserProps) {
    const [open, setOpen] = useState(false)
    const isDesktop = useMediaQuery("(min-width: 640px)");

    const userIcon = (
        <Button
            variant="ghost"
            className="gap-3 flex ms-auto hover:bg-transparent p-1 rounded-full -me-2 relative sm:rounded-md sm:p-2 sm:-m-2 dark:sm:hover:bg-secondary sm:hover:bg-background"
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
                        <DrawerDescription>{user.secondary}</DrawerDescription>
                    </DrawerHeader>

                    <div className="mx-4 flex flex-col gap-2 pt-2">
                        <Button variant="secondary" asChild>
                            <DrawerClose asChild>
                                <Link href="#settings" className="w-full">
                                    User settings
                                </Link>
                            </DrawerClose>
                        </Button>
                        <Button variant="secondary" asChild>
                            <DrawerClose asChild>
                                <Button className="w-full" onClick={() => void logout()}>
                                    Sign out
                                </Button>
                            </DrawerClose>
                        </Button>
                    </div>

                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="default">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

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
                    <DropdownMenuItem asChild>
                        <Link href={`/mail/${mailboxId}/config`} className="cursor-pointer">
                            Mailbox Config
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="#settings" className="cursor-pointer">
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
