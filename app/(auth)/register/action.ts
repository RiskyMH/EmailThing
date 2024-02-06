"use server";
import { addUserTokenToCookie } from "@/utils/jwt"
import { createPasswordHash, verifyPassword } from "@/utils/password";
import { userAuthSchema } from "@/validations/auth"
import { prisma } from "@/utils/prisma"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

const errorMsg = "Invalid username or password"
const noInvite = "You need an invite code to signup right now"

export default async function signUp(data: FormData): Promise<{ error?: string | null }> {
    const parsedData = userAuthSchema.safeParse({ username: data.get("username"), password: data.get("password") })
    if (!parsedData.success) {
        return {
            error: parsedData.error.errors[0].message
        }
    }

    // currently you require invite code to sign up
    const referer = headers().get("referer")
    if (!referer) return { error: noInvite }
    const inviteCode = new URL(referer).searchParams?.get("invite")
    if (!inviteCode) return { error: noInvite }

    // check if invite code is valid
    const invite = await prisma.inviteCode.findFirst({
        where: {
            code: inviteCode,
            expiresAt: {
                gte: new Date()
            }
        }
    })

    if (!invite) {
        return { error: "Invalid invite code" }
    }

    // check if username used
    const existingUser = await prisma.user.findFirst({
        where: {
            username: parsedData.data.username
        }
    })

    if (existingUser) {
        return { error: "Username already taken" }
    }

    // check email alaises to
    const existingEmail = await prisma.mailboxAlias.findFirst({
        where: {
            alias: parsedData.data.username + "@emailthing.xyz"
        }
    })

    if (existingEmail) {
        return { error: "Email already taken" }
    }

    // create user and their mailbox
    const user = await prisma.user.create({
        data: {
            username: parsedData.data.username,
            password: await createPasswordHash(parsedData.data.password),
            email: parsedData.data.username + "@emailthing.xyz"
        }
    })

    const mailbox = await prisma.mailbox.create({
        data: {
            aliases: {
                create: {
                    alias: parsedData.data.username + "@emailthing.xyz",
                    default: true,
                    name: parsedData.data.username
                }
            },
        }
    })

    await prisma.mailboxForUser.create({
        data: {
            mailboxId: mailbox.id,
            userId: user.id,
        }
    })

    // invalidate invite code
    await prisma.inviteCode.update({
        where: {
            code: invite.code
        },
        data: {
            usedAt: new Date(),
            usedBy: user.id
        }
    })

    // add user token to cookie
    await addUserTokenToCookie(user)
    // add mailboxId to cookie
    cookies().set("mailboxId", mailbox.id)

    // redirect to mail
    redirect(`/mail/${mailbox.id}`)
}