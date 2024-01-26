"use server";
import { addUserTokenToCookie } from "@/app/utils/jwt"
import { verifyPassword } from "@/app/utils/password";
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

    // get the user's mailbox then redirect to it
    const mailboxes = await prisma.mailboxForUser.findMany({
        where: {
            userId: user.id,
        },
        select: {
            mailboxId: true,
        }
    })

    const possibleMailbox = cookies().get("mailboxId")?.value
    if (possibleMailbox && mailboxes.some(({ mailboxId }) => mailboxId === possibleMailbox)) {
        redirect(`/mail/${possibleMailbox}`)
    } else {
        cookies().set("mailboxId", mailboxes[0].mailboxId);
        redirect(`/mail/${mailboxes[0].mailboxId}`)
    }
}