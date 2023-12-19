'use server'
import { addUserTokenToCookie, verifyPassword } from "@/app/utils/user"
import { userAuthSchema } from "@/app/validations/auth"
import { prisma } from "@email/db"
import { redirect } from "next/navigation"


const errorMsg = "Invalid username or password"

export default async function signIn(username: string, password: string, callback?: string | null) {
    const parsedData = userAuthSchema.parse({ username, password })
    // redirect(callback || "/dashboard")

    // find user
    const user = await prisma.user.findFirst({
        where: {
            username: parsedData.username,
        },
        select: {
            id: true,
            password: true,
        },
    })

    if (!user) {
        return { error: errorMsg }
    }

    // verify password
    const verified = verifyPassword(parsedData.password, user.password)

    if (!verified) {
        return { error: errorMsg }
    }

    await addUserTokenToCookie(user)

    if (callback) redirect(callback)

    // get the user's mailbox then redirect to it
    const mailbox = await prisma.mailbox.findFirst({
        where: {
            users: {
                some: {
                    userId: user.id,
                }
            }
        },
        select: {
            id: true,
        }
    })

    redirect(`/mail/${mailbox?.id}`)
}