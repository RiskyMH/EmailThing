'use server'

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function logout() {
    const c = cookies()
    c.delete('token')
    c.delete('mailboxId')

    redirect("/login")
}
