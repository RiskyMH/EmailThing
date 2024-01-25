"use server";
import { addUserTokenToCookie, verifyPassword } from "@/app/utils/user"
import { userAuthSchema } from "@/app/validations/auth"
import { prisma } from "@email/db"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

const errorMsg = "Invalid username or password"

export default async function signIn(data: FormData, callback?: string | null): Promise<{ error?: string | null }> {
    const parsedData = userAuthSchema.safeParse({ username: data.get("username"), password: data.get("password") })
    if (!parsedData.success) {
        return {
            error: errorMsg
        }
    }

    if (!callback) {
        const referer = headers().get("referer")
        if (referer) callback = new URL(referer).searchParams?.get("from")
    }

    // find user
    const user = await prisma.user.findFirst({
        where: {
            username: parsedData.data.username,
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
    const verified = verifyPassword(parsedData.data.password, user.password)

    if (!verified) {
        return { error: errorMsg }
    }

    await addUserTokenToCookie(user)

    const possibleMailbox = cookies().get("mailboxId")?.value
    let mailboxId = null
    if (possibleMailbox) {
        mailboxId = possibleMailbox
    } else {
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

        mailboxId = mailbox?.id
        if (mailboxId) cookies().set("mailboxId", mailboxId);
    }

    if (callback) redirect(callback)
    redirect(`/mail/${mailboxId}`)
}