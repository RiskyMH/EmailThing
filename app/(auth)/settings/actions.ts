'use server'

import { getCurrentUser } from "@/utils/jwt"
import { createPasswordHash, verifyPassword } from "@/utils/password"
import prisma from "@/utils/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function changeUsername(username: string) {
    const userId = await getCurrentUser()
    if (!userId) return

    // check if taken (but not by the user)
    const existingUser = await prisma.user.findFirst({
        where: {
            username,
            NOT: {
                id: userId
            }
        }
    })

    if (existingUser) return { error: 'Username already taken' }

    // update username
    await prisma.user.update({
        where: { id: userId },
        data: { username }
    })

    revalidatePath('/settings')
}

export async function changePassword(oldPassword: string, newPassword: string) {
    const userId = await getCurrentUser()
    if (!userId) return

    // check old password
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { error: 'User not found' }

    const validPassword = verifyPassword(oldPassword, user.password)
    if (!validPassword) return { error: 'Current password is not correct' }

    // update password
    await prisma.user.update({
        where: { id: userId },
        data: {
            password: await createPasswordHash(newPassword)
        }
    })

    revalidatePath('/settings')
}


export async function logout() {
    const c = cookies()
    c.delete('token')
    c.delete('mailboxId')

    redirect("/login")
}