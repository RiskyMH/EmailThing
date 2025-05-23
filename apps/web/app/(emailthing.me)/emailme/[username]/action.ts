"use server";

import { makeHtml } from "@/(email)/mail/[mailbox]/draft/[draft]/tools";
import db, { User } from "@/db";
import { env } from "@/utils/env";
import { sendEmail } from "@/utils/send-email";
import { and, eq } from "drizzle-orm";
import { Mailbox, createMimeMessage } from "mimetext";
import { headers } from "next/headers";
import { parse as markedParse } from "marked";

const MAX_REQUESTS_PER_WINDOW = 5;
const WINDOW_DURATION_MS = 60 * 1000;

const ratelimit = new Map<string, { count: number; resetAt: Date }>();

export async function emailMeForm(
    _prevState: any,
    data: FormData,
): Promise<{ error?: string; success?: string } | undefined> {
    const username = data.get("username") as string;
    const user = await db.query.User.findFirst({
        where: and(eq(User.username, username), eq(User.publicContactPage, true)),
        columns: {
            username: true,
            email: true,
            publicEmail: true,
            id: true,
        },
    });
    if (!user) return { error: "Can't find user to email" };

    // turnstile verify user
    if (env.TURNSTILE_SECRET_KEY) {
        const formData = new FormData();
        // formData.append("secret", "1x0000000000000000000000000000000AA")
        formData.append("secret", env.TURNSTILE_SECRET_KEY);
        formData.append("response", data.get("cf-turnstile-response") as string);
        formData.append("remoteip", (await headers()).get("CF-Connecting-IP") as string);

        const turnstile = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: formData,
        });

        const result = await turnstile.json();
        if (!result.success) {
            return { error: "Failed cloudflare turnstile recapture test..." };
        }
        // return { success: "test done" }
    } else {
        console.warn("No turnstile setup, allowing request");
    }

    const key = user.id;
    const rate = ratelimit.get(key);

    if (!rate || rate.resetAt < new Date()) {
        // Reset the rate limit if it's expired
        ratelimit.set(key, {
            count: 1,
            resetAt: new Date(Date.now() + WINDOW_DURATION_MS),
        });
    } else {
        // Increment the request count if within the window
        rate.count++;
        if (rate.count > MAX_REQUESTS_PER_WINDOW) {
            const timeUntilReset = rate.resetAt.getTime() - Date.now();
            return { error: "Too many requests. Please try again later." };
        }
    }

    const name = data.get("name") as string | null;
    const email = data.get("email") as string | null;
    const subject = data.get("subject") as string | null;
    const message = data.get("message") as string | null;

    if (!message) return { error: "You must provide a message" };

    const mail = createMimeMessage();
    mail.setSender({
        addr: `${username}@emailthing.me`,
        name: `${name || email || "Someone"} (emailthing.me)`,
    });
    mail.setRecipient(user.publicEmail || user.email);
    mail.setSubject(subject ? `${subject}` : "New message from your contact form");
    mail.addMessage({
        contentType: "text/plain",
        data: `${message}

---

Sent from "${name || "*unknown*"}"${email ? ` (${email})` : ""} using your [EmailThing.me](https://emailthing.me/@${username}) contact form.
`,
    });
    mail.addMessage({
        contentType: "text/html",
        data: makeHtml(
            /* html */ `${markedParse(message, { breaks: true, async: false })}

            
<footer>
<hr class="hidden">
<p>${name ? `Sent from "${name}"` : "Sent from <em>unknown</em>"} ${email ? `(<a href="mailto:${email}">${email}</a>)` : ""} using your <a href="https://emailthing.me/@${username}">EmailThing.me</a> contact form.</p>
</footer>

<style>
${
    /* css */ `
   footer {
      font-size: 14px;
      color: #666;
   }
   footer a {
      color: #666;
      font-weight: 600;
   }
   footer a:hover {
      color: #333;
   }

   @media (prefers-color-scheme: dark) {
      footer a {
         color: #666;
      }
      footer a:hover {
         color: #888;
      }
   }

   .hidden {
      display: none;
   }
   `
        .replace(/\s+/g, " ")
        .trim()
}
</style>
`,
        ),
    });
    if (email) mail.setHeader("Reply-To", new Mailbox({ addr: email, name: name ?? undefined }));

    const e = await sendEmail({
        from: `${username}@emailthing.me`,
        to: [user.publicEmail || user.email],
        data: mail,
    });

    if (e?.error) return { error: "Failed to notify user" };

    return { success: "Successfully sent your message!" };
}
