import { getCurrentUser } from "@/utils/jwt";
import { createId } from '@paralleldrive/cuid2';
import { db, InviteCode, User } from "@/db";
import { and, eq } from "drizzle-orm";

export const revalidate = 0;

export async function GET() {
    const currentUser = await getCurrentUser()

    const user = await db.query.User.findFirst({
        where: and(
            eq(User.id, currentUser || ''),
            eq(User.admin, true)
        ),
        columns: {
            id: true
        }
    })

    if (!user) {
        return new Response('Unauthorized', { status: 401 })
    }

    const inviteCode = createId()

    await db.insert(InviteCode)
        .values({
            code: inviteCode,
            expiresAt: new Date(Date.now() + 86400000),
            createdBy: user.id
        })
        .execute()

    return new Response(`https://emailthing.xyz/register?invite=${inviteCode}`, { status: 200, headers: { 'Content-Type': 'text/plain' } })
}