import db from "@/db";
import { Email, EmailRecipient, EmailSender } from "@emailthing/dbb";
import { createId } from "@paralleldrive/cuid2";

export function emailUser({ userId, mailboxId, username }: { userId: string; mailboxId: string; username: string }) {
    const msg = `### Hi **@${username}**,

Welcome to EmailThing!

We're excited to have you on board. With EmailThing, you can enjoy a range of features designed to make managing your emails a breeze:

*   **API Integration**: Send emails and more with our [API].
*   **Custom Domains**: Use your [own domain] for your emails.
*   **Multi-User Support**: [Invite others] to your mailbox.
*   **Temporary Email**: Need a burner email? [Get many here].
*   **Progressive Web App (PWA)**: Install EmailThing to your home screen on mobile for easy access and notifications.
    [Set up notifications] on both desktop and mobile.
*   **Contact Page**: Create your own [contact page] to receive messages with a simple form.

EmailThing is proudly open source. Check out our [GitHub] for more details.

To get started, visit and explore all that we have to offer.

If you have any questions or feedback, feel free to reach out.

Best regards,
[RiskyMH] (creator and founder)


<!-- Links -->
[RiskyMH]: https://riskymh.dev
[API]: https://emailthing.app/docs/api
[own domain]: https://emailthing.app/mail/${mailboxId}/config
[Invite others]: https://emailthing.app/mail/${mailboxId}/config
[Get many here]: https://emailthing.app/mail/${mailboxId}/temp
[Set up notifications]: https://emailthing.app/settings/notifications
[contact page]: https://emailthing.app/settings/emailthing-me
[GitHub]: https://github.com/RiskyMH/EmailThing`;

    // const html = makeHtml(await marked.parse(msg))

    const snippet = `Hi @${username}, Welcome to EmailThing! We're excited to have you on board. With EmailThing, you can enjoy a range of features designed to make managing your emails a breeze`;
    const title = "Welcome to EmailThing!";
    // const email = createMimeMessage()
    // email.setSender({ addr: "system@emailthing.dev", name: "EmailThing" })
    // email.setRecipient({ addr: `${username}@emailthing.xyz`, name: username })
    // email.setSubject("Welcome to EmailThing!")
    // email.addMessage({
    //     contentType: "text/plain",
    //     data: msg
    // })
    // email.addMessage({
    //     contentType: "text/html",
    //     encoding: "base64",
    //     data: Buffer.from(html).toString("base64")
    // })
    // email.setHeader("X-EmailThing", "official")
    // email.setHeader("Reply-To", new MimeMailbox("contact@emailthing.xyz"))

    // return sendEmail({
    //     from: "system@emailthing.dev",
    //     to: [`${username}@emailthing.xyz`],
    //     data: email.asRaw()
    // })
    const emailId = createId();
    return [
        db.insert(Email).values({
            id: emailId,
            body: msg,
            // html,
            subject: title,
            snippet,
            raw: "draft",
            mailboxId,
            isRead: false,
            replyTo: "hello@riskymh.dev",
            size: 0,
            createdAt: new Date(),
        }),

        db.insert(EmailRecipient).values({
            emailId,
            name: username,
            address: `${username}@emailthing.xyz`,
        }),

        db.insert(EmailSender).values({
            emailId,
            name: "EmailThing",
            address: "system@emailthing.app",
        }),
    ] as const;

    // TODO: maybe just directly add to db instead of weird proxy...
}
