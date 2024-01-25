import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const runtime = 'edge'

export async function GET() {
    // get the mailbox based on maiboxId cookie
    const mailboxId = cookies().get("mailboxId");
    if (mailboxId) {
        redirect(`/mail/${mailboxId.value}`)    
    } else {
        redirect("/login")
    }
}