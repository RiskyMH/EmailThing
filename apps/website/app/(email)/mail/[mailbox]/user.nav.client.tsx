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

function UserIcon({ user }: { user: UserProps["user"] }) {
    return (
        <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage
                src={user.image}
                alt={`${user.name}`}
                className="group-hover:bg-secondary dark:group-hover:bg-tertiary bg-background dark:bg-secondary"
            />
            <AvatarFallback className="group-hover:bg-secondary dark:group-hover:bg-tertiary bg-background dark:bg-secondary">
                {getInitials(user.name)}
            </AvatarFallback>
        </Avatar>

    )
}

export function UserNav({ user, mailboxId }: UserProps) {
    const [open, setOpen] = useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (!isDesktop) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger className="inline sm:hidden ms-auto hover:bg-transparent p-1 rounded-full -me-2" asChild>
                    <Button variant="ghost" size="icon">
                        <UserIcon user={user} />
                    </Button>
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
                                <Link href="/login" className="w-full">
                                    Switch User
                                </Link>
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


    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative p-2 -m-2 gap-3 group dark:hover:bg-secondary hover:bg-background"
                >
                    <ChevronDownIcon className="h-5 w-5 text-muted-foreground -me-2" />
                    {user.name}
                    <UserIcon user={user} />
                </Button>
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
                    <Link href="/login" className="cursor-pointer">
                        Sign out
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
