import { InviteCode } from "@emailthing/db";
import { db } from "@emailthing/db/connect";
import { createId } from "@paralleldrive/cuid2";

process.env.SECRET_SPECIAL_TOKEN_YAY ||= Bun.randomUUIDv7();

export async function GET(request: Request) {
  // scamful way of getting bot :)
  if (
    process.env.SECRET_SPECIAL_TOKEN_YAY !==
    request.headers.get("authorization")
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const inviteCode = createId();

  await db
    .insert(InviteCode)
    .values({
      code: inviteCode,
      expiresAt: new Date(Date.now() + 86400000),
      createdBy: "p56vs4esg0tp4pys8l7dyszs",
    })
    .execute();

  return new Response(`https://emailthing.app/register?invite=${inviteCode}`, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
