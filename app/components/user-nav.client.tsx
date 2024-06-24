'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
import { useMediaQuery } from "usehooks-ts";
import { useState } from "react"
import { logout } from "@/actions"


interface UserProps {
    user: {
        name: string,
        image?: string,
        secondary: string,
    },
}

function getInitials(name: string) {
    // first 2 characters of name
    return name.slice(0, 2).toUpperCase()
}

export function UserDropDown({ user }: UserProps) {
    const [open, setOpen] = useState(false)
    const isDesktop = useMediaQuery("(min-width: 640px)");

    const userIcon = (
        <Button
            variant="ghost"
            className="size-8 rounded-full self-center bg-transparent hover:bg-transparent"
            suppressHydrationWarning // i give up with sanity
        >
            <Avatar className="size-8 rounded-full">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="bg-primary/80 text-white dark:text-foreground dark:bg-secondary dark:hover:bg-secondary/80 hover:bg-primary/70 transition-all">
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
                                <Link href="/settings" className="w-full">
                                    User settings
                                </Link>
                            </DrawerClose>
                        </Button>
                        <Button variant="secondary" asChild>
                            <DrawerClose asChild>
                                <Link href="/home" className="w-full">
                                    EmailThing Home
                                </Link>
                            </DrawerClose>
                        </Button>
                        <Button variant="secondary" asChild>
                            <DrawerClose className="w-full" onClick={() => void logout()}>
                                Sign out
                            </DrawerClose>
                        </Button>
                    </div>

                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="default">Close</Button>
                        </DrawerClose>
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
                    <div className="flex flex-col gap-1">
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
                        <Link href="/" className="cursor-pointer">
                            Dashboard
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                            User Settings
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/home" className="cursor-pointer">
                            EmailThing Home
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
