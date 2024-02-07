import { getCurrentUser } from "@/utils/jwt";
import prisma from "@/utils/prisma";
import { createId } from '@paralleldrive/cuid2';

export async function GET() {
    const currentUser = await getCurrentUser()
    const user = await prisma.user.findUnique({
        where: {
            id: currentUser || '',
            admin: true
        },
        select: {
            id: true
        }
    })

    if (!user) {
        return new Response('Unauthorized', { status: 401 })
    }

    const invite = await prisma.inviteCode.create({
        data: {
            code: createId(),
            expiresAt: new Date(Date.now() + 86400000),
            createdBy: user.id
        }
    })

    return Response.json({
        ...invite,
        url: `https://emailthing.xyz/register?invite=${invite.code}`
    }, { status: 200 })
}