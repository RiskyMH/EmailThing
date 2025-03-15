import { marked } from "marked";

export async function welcomeEmail({ mailboxId, username }: { mailboxId: string; username: string }) {
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

    const html = (typeof window === "undefined" && process?.platform === "win32")
        ? undefined
        : await marked.parse(msg)

    const snippet = `Hi @${username}, Welcome to EmailThing! We're excited to have you on board. With EmailThing, you can enjoy a range of features designed to make managing your emails a breeze`;
    const title = "Welcome to EmailThing!";

    return {
        body: msg,
        html,
        subject: title,
        snippet,
    }
}
