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
import Link from "next/link"
import { ChevronDownIcon } from "lucide-react"

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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative p-2 -m-2 gap-3 group dark:hover:bg-secondary hover:bg-background"
                >
                    <ChevronDownIcon className="h-5 w-5 text-muted/50 -me-2" />
                    {user.name}
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
