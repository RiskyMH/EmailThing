import db from "@/db";
import { emailMeRatelimit } from "@/utils/redis-ratelimit";
import { sendEmail } from "@/utils/send-email";
import { User } from "@emailthing/db";
import { and, eq, sql } from "drizzle-orm";

// GET /api/internal/emailthing-me?username=<username>
// POST /api/internal/emailthing-me?username=<username> (with json body)

process.env.EMAILTHING_ME_TOKEN ||= Bun.randomUUIDv7();

const fetchUser = async (username: string) => {
  const [user] = await db
    .select({
      username: User.username,
      email: User.email,
      publicEmail: User.publicEmail,
    })
    .from(User)
    .where(
      and(
        eq(sql`lower(${User.username})`, sql`lower(${username})`),
        eq(User.publicContactPage, true)
      )
    )
    .limit(1);
  return user;
};

export async function GET(request: Request) {
  if (
    request.headers.get("authorization") !==
    `Bearer ${process.env.EMAILTHING_ME_TOKEN}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const username = new URL(request.url).searchParams.get("username");
  if (!username) return new Response("Username is required", { status: 400 });

  const user = await fetchUser(username);
  if (!user) return new Response("User not found", { status: 404 });

  return Response.json({
    username: user.username,
    email: user.email,
    publicEmail: user.publicEmail,
  });
}

export async function POST(request: Request) {
  if (
    request.headers.get("Authorization") !==
    `Bearer ${process.env.EMAILTHING_ME_TOKEN}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const username = new URL(request.url).searchParams.get("username");
  if (!username) return new Response("Username is required", { status: 400 });

  const user = await fetchUser(username);
  if (!user) return new Response("User not found", { status: 404 });

  // there are checks on the emailthing.me site itself, but just as backup
  const ratelimit = await emailMeRatelimit(username);
  if (!ratelimit.allowed) {
    return new Response("user ratelimited", { status: 429, headers: { "Retry-After": (ratelimit.retryAfter / 1000).toString() } });
  }

  const rawEmail = await request.text();
  const e = await sendEmail({
    from: `${username}@emailthing.me`,
    to: [user.publicEmail || user.email],
    data: rawEmail,
  });
  if (!e) return new Response("Failed to send email", { status: 500 });

  return Response.json({ success: true });
}
