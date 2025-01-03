import { db } from "@emailthing/db/connect";
import { InviteCode, User } from "@emailthing/db";
import { getCurrentUser } from "@/utils/jwt";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

export const revalidate = 0;

export async function GET() {
    const currentUser = await getCurrentUser();

    const user = await db.query.User.findFirst({
        where: and(eq(User.id, currentUser || ""), eq(User.admin, true)),
        columns: {
            id: true,
        },
    });

    if (!user) {
        // scamful way of getting bot :)
        if (process.env.SECRET_SPECIAL_TOKEN_YAY !== (await headers()).get("Authorization")) {
            return new Response("Unauthorized", { status: 401 });
        }
    }

    const inviteCode = createId();

    await db
        .insert(InviteCode)
        .values({
            code: inviteCode,
            expiresAt: new Date(Date.now() + 86400000),
            createdBy: user?.id ?? "p56vs4esg0tp4pys8l7dyszs",
        })
        .execute();

    return new Response(`https://emailthing.app/register?invite=${inviteCode}`, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
    });
}
