"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { Suspense, use, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

interface UserProps {
    user: {
        name: string;
        image?: Promise<string>;
        secondary: string;
    };
}

const logout = () => { window.location = '/' }

function getInitials(name: string) {
    // first 2 characters of name
    return name.slice(0, 2).toUpperCase();
}

export function UserDropDown({ user }: UserProps) {
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 640px)");
    const image = use<string | undefined>(user?.image ?? Promise.resolve(''))

    const userIcon = (
        <Button
            variant="ghost"
            className="size-8 self-center rounded-full bg-transparent hover:bg-transparent"
            suppressHydrationWarning // i give up with sanity
        >
            <Avatar className="size-8 rounded-full">
                <AvatarImage src={image} alt={user?.name} />
                <AvatarFallback className="bg-primary/80 text-white transition-all hover:bg-primary/70 dark:bg-secondary dark:text-foreground dark:hover:bg-secondary/80">
                    {user?.name ? getInitials(user?.name) : ""}
                </AvatarFallback>
            </Avatar>
        </Button>
    );

    // Mobile
    if (!isDesktop) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>{userIcon}</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{user.name}</DrawerTitle>
                        <DrawerDescription>{user.secondary}</DrawerDescription>
                    </DrawerHeader>

                    <div className="mx-4 flex flex-col gap-2 pt-2">
                        <Button variant="secondary" asChild>
                            <DrawerClose asChild>
                                <Link to="/settings" className="w-full">
                                    User settings
                                </Link>
                            </DrawerClose>
                        </Button>
                        <Button variant="secondary" asChild>
                            <DrawerClose asChild>
                                <Link to="/home" className="w-full">
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
            </Drawer>
        );
    }

    // Desktop
    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>{userIcon}</DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                        <h3 className="truncate font-medium text-sm">{user.name}</h3>
                        <p className="truncate text-muted-foreground text-xs">{user.secondary}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link to="/" className="cursor-pointer">
                            Dashboard
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to="/settings" className="cursor-pointer">
                            User Settings
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to="/home" className="cursor-pointer">
                            EmailThing Home
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <button className="w-full cursor-pointer" onClick={() => void logout()} type="button">
                        Sign out
                    </button>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
