import db, { User } from "@/db"
import { gravatar } from "@/utils/tools"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { eq } from "drizzle-orm"
import { Suspense } from "react"
import Link from "next/link"
import { getCurrentUser } from "@/utils/jwt"
import { buttonVariants } from "./ui/button"


export default async function UserNav() {
    const userId = await getCurrentUser()
    return userId ? (
        <Suspense fallback={<div className="h-8 w-8 rounded-full bg-secondary animate-pulse" />}>
            <UserIcon userId={userId} />
        </Suspense>
    ) : (
        <Link
            href="/login"
            className={buttonVariants({ variant: "secondary", size: "sm", className: "px-4" })}
        >
            Login
        </Link>
    )

}

async function UserIcon({ userId }: { userId: string }) {
    const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            username: true,
            email: true
        }
    })
    if (!user) return "Error?"

    return (
        <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage src={await gravatar(user.email)} alt={user.username} className="bg-background dark:bg-secondary" />
            <AvatarFallback className="bg-background dark:bg-secondary">
                {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
        </Avatar>
    )
}
