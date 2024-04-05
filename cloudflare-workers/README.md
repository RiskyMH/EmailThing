# EmailThing - Cloudflare Workers

This is the code for the Cloudflare Workers that handle the sending and receiving of emails for EmailThing.

## [Receiving Emails](./receiving-emails.js)

This worker is responsible for receiving emails sent to the domain. It uses the `fetch` API to send the email to the front-end app.

To set this up, you need to add a route in your Cloudflare dashboard to point to this worker. You then will need to create a Cloudflare Worker to handle this route. Make sure to add the `auth` environment variable to the worker with the same value as the custom domain settings gave. You will also be able to add the `forward` environment variable to the worker and if provided, Cloudflare will also forward the email to the given address. Make sure you update the zone mentioned in the worker to your own zone/domain (and if self hosting change the domain to your own).

For anyone curious, all this is doing is receiving the email and then sending the raw body to the front-end app.

> **Note**: This worker is what is recommended to use for custom domains (even if not self hosting).

## [Sending Emails](./sending-emails.js)

This worker is responsible for sending emails. It uses the `fetch` API to send the email to the MailChannels API. You can think of this as a proxy as thats all it is doing. Make sure to add the `auth` environment variable to the worker with the same value as the `EMAIL_AUTH_TOKEN` in the front-end app.

Refer to the [Mailchannels Transactional API documentation](https://api.mailchannels.net/tx/v1/documentation) for more information on how to send emails.

As you have full control with the emails, you can decide which mailbox to send to (if any). This means you can have multiple mailboxes for one domain.

> **Note**: This is more or less abusing the [free deal](https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels) that was given to Cloudflare workers.
