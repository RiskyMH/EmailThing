import { getCurrentUser } from "@/app/utils/jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const runtime = 'edge'
export const revalidate = 0

export async function GET() {
    // check if user token is valid (if expired, redirect to login)
    const userId = await getCurrentUser();
    
    // get the mailbox based on mailboxId cookie
    const mailboxId = cookies().get("mailboxId");
    
    if (mailboxId && userId) {
        redirect(`/mail/${mailboxId.value}`)
    } 
    cookies().delete("token")
    redirect("/login")
}