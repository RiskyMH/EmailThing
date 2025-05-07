<h1 align="center">
  <a href="https://emailthing.app/home" target="_blank">
    <img src="https://emailthing.app/logo.png" alt="EmailThing Logo" width="84">
  </a>
  <br>
  EmailThing (web app)
</h1>

<p align="center">The full stack web app for receiving and sending your emails!</p>

## Getting Started

This repository contains the code for front-end app that displays and sends emails.

### Installing the dependencies

```sh
# in root directory
bun install
```

> **Note**: This project utilizes [Bun](https://bun.sh) as its package manager for the monorepo.

### Configuring the env vars

If you are developing locally you need to create an `.env` file. Refer to the table below for all the environment variables in the project.


| Name                                   | Description                                                                              | Required? |
| -------------------------------------- | ---------------------------------------------------------------------------------------- | --------- |
| `DATABASE_URL`                         | The connection string/path to connect to the Sqlite DB (can be just `file:./db.sqlite`)   | ✔️        |
| `DATABASE_TOKEN`                       | The token for DB (if using Turso)                                                        | ❌        |
| `NEXT_PUBLIC_APP_URL`                  | The URL where the app is hosted                                                          | ❌        |
| `NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY` | The public key for sending notifications                                                 | ✔️        |
| `WEB_NOTIFICATIONS_PRIVATE_KEY`        | The private key for sending notifications                                                | ✔️        |
| `EMAIL_AUTH_TOKEN`                     | The secret key for sending through cloudflare worker (more on this below)                | ✔️        |
| `EMAIL_DKIM_PRIVATE_KEY`               | The DKIM private key                                                                     | ❌        |
| `S3_KEY_ID`                            | The Access Key ID for S3                                                                 | ✔️        |
| `S3_SECRET_ACCESS_KEY`                 | The Secret Access Key for S3                                                             | ✔️        |
| `S3_URL`                               | The Client URL for S3                                                                    | ✔️        |

### Running the development environment

To launch the Next.js website and deploy the database schema, utilize the following commands:

```sh
# in root directory
bun db:push

# in web directory
bun dev --turbo
```

## How it works

EmailThing primarily handles the front-end aspect of the email management application. For sending and receiving emails, it makes use of [Cloudflare Email Workers](https://developers.cloudflare.com/email-routing/email-workers/) to incoming emails, and [MailChannels](https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels) to outgoing emails (currently experimenting with custom sending though).

To do this locally, refer to [/cloudflare-workers/README.md](../../cloudflare-workers/README.md) for more information.


### How to set up the database and app?

There was a lot of hard-coding that I have done in this. However, after setting up the database, you can run the [`create-admin.ts`](../../scripts/create-admin.ts) script to make an admin user. This will allow you to create other users (through `/api/invite`) and manage the app. 

Currently, there isn't a way to add default domains, so you will also need to manual add those using the `default_domain` table. I also have hard coded the url to send emails through, so you will need to change that in the appropriate files.

## Credits

Many individuals and organizations have contributed to the creation of this project. Special thanks to:

* [Vercel](https://vercel.com) for hosting the application and for developing Next.js.
* [Cloudflare](https://cloudflare.com) for providing workers and email routing.
* [Turso](https://turso.tech) for providing a good pricing for database.
* [Alfonsusac](https://github.com/alfonsusac) for designing the logo and sticker.
* [Members of Next.js Discord](https://discord.gg/NextJS) for helping me with motivation and testing.
* And one of the most important, [Dawid Jankowski](https://dribbble.com/shots/15142673-E-mail-Client-Inbox-Dark-Mode) for providing the design to base the app on.
* *and many more that I can't possibly mention...*

## Need Help?

If you encounter any issues or have questions, please join our [Discord server](https://discord.gg/GT9Q2Yz4VS) for assistance. I'm more than willing to help. Please seek support through Discord rather than opening an issue, as it facilitates better communication and understanding of your problem.

