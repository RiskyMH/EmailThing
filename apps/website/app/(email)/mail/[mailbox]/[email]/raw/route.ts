import { getCurrentUser } from "@/app/utils/user"
import { prisma } from "@email/db"
import { notFound, redirect } from "next/navigation"


export async function GET(
    request: Request,
    {
        params,
    }: {
        params: {
            mailbox: string
            email: string
        }
    }
) {
    redirect(`/mail/${params.mailbox}/${params.email}/email.eml`)
}
