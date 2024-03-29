<h1 align="center">
  <img src="https://emailthing.xyz/icon.png" alt="EmailThing Logo" width="84">
  <br>
  EmailThing
</h1>

<p align="center">A web app for receiving and sending your emails!</p>

## Getting Started

This repo contains the code for front-end app that displays and sends emails.

### Installing the dependencies

```sh
bun install
```

> **Note**: This project uses [Bun](https://bun.sh), so make sure you installed that first.

### Configuring the env vars

If you are developing locally you need to create `.env` files. Refer to the table below for all the env vars in the project.


| Name                                   | Description                                                                              | Required? |
| -------------------------------------- | ---------------------------------------------------------------------------------------- | --------- |
| `DATABASE_URL`                         | The connection string/path to connect to the Sqlite DB (can be just `file:./db.sqlite)   | ✔️        |
| `DATABASE_TOKEN`                       | The token for DB (if using Turso)                                                        | ❌        |
| `NEXT_PUBLIC_APP_URL`                  | The URL where the app is hosted                                                          | ❌        |
| `NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY` | The public key for sending notifications                                                 | ✔️        |
| `WEB_NOTIFICATIONS_PRIVATE_KEY`        | The private key for sending notifications                                                | ✔️        |
| `EMAIL_AUTH_TOKEN`                     | The secret key for sending through cloudflare worker (more on this below)                | ✔️        |
| `EMAIL_DKIM_PRIVATE_KEY`               | The DKIM private key                                                                     | ❌        |
| `S3_KEY_ID`                            | The Access Key ID for S3                                                                 | ✔️        |
| `S3_SECRET_ACCESS_KEY`                 | The Secret Access Key for S3                                                             | ✔️        |
| `S3_URL`                               | The Client URL for S3                                                                    | ✔️        |

### Running the development projects

To run the Next.js website and deploy database schema, use the following commands:

```sh
bun db:push
bun dev --turbo
```

### How does this work?

EmailThing currently only deals with the front-end of the app. For actually sending or receiving emails, it makes use of [Cloudflare Email Workers](https://developers.cloudflare.com/email-routing/email-workers/) to receive emails, and [MailChannels](https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels) to send.

To do this locally, refer to [./cloudflare-workers/README.md](./cloudflare-workers/README.md) for more information.

## Why did you make this?

I made this because I wanted to have a way to deal with my emails from a custom domain. The options from Gmail were too expensive, and I couldn't find a good alternative, so I made my own. I tried to make it in a way that gives you the most control over your emails (ie owning the worker receiving emails).

### How to set up the database and app?

There was a lot of hard-coding that I have done in this. However, after setting up the database, you will need to manual create yourself an account in the `User` table with admin access. This will allow you to create other users and manage the app. 

Currently, there isn't a way to add default domains, so you will also need to manual add those using the `MailboxDefaultDomain` table. I also have hard coded the url to send emails through, so you will need to change that in the appropriate files.

## Credits

There was lots of people/organizations that have helped make this possible. Here are some of them:

* [Vercel](https://vercel.com) for providing the hosting of my app (and making Next.js).
* [Cloudflare](https://cloudflare.com) for providing workers and email routing.
* [MailChannels](https://mailchannels.com) for providing a simple transactional email API.
* [Turso](https://turso.tech) for providing a good pricing for database.
* [Members of Next.js Discord](https://discord.gg/NextJS) for helping me with motivation and testing.
* And one of the most important, [Dawid Jankowski](https://dribbble.com/shots/15142673-E-mail-Client-Inbox-Dark-Mode) for providing the design to base the app on.
* *and many more that I can't possibly mention...*

### Im confused, how can I get help?

If you are confused or have a bug, feel free to join the [Discord server](https://discord.gg/GT9Q2Yz4VS) and ask for help. I will be happy to help you out.

I currently would prefer it to be done on Discord rather than opening an issue, as it allows me to chat better and understand the problem faster.
