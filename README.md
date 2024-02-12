<h1 align="center">
  <img src="https://emailthing.xyz/icon.png" alt="EmailThing Logo" width="84">
  <br>
  EmailThing
</h1>

<p align="center">A web application for managing your emails with ease!</p>

## Getting Started

This repository contains the source code for a front-end application designed for displaying and managing emails.

### Installing Dependencies

To install the required dependencies, execute the following command:

```sh
bun install
```

> **Note**: This project utilizes [Bun](https://bun.sh) as its package manager. Ensure Bun is installed on your system before proceeding.

### Configuring Environment Variables

For local development, it's necessary to create a`.env` file. The table below lists all the environment variables required for the project:

| Name                                   | Description                                                                              | Required? |
| -------------------------------------- | ---------------------------------------------------------------------------------------- | --------- |
| `DATABASE_URL`                         | The connection string to connect to the DB                                               | ✔️        |
| `NEXT_PUBLIC_APP_URL`                  | The URL where the app is hosted                                                          | ❌        |
| `NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY` | The public key for sending notifications                                                 | ✔️        |
| `WEB_NOTIFICATIONS_PRIVATE_KEY`        | The private key for sending notifications                                                | ✔️        |
| `EMAIL_AUTH_TOKEN`                     | The secret key for sending through cloudflare worker (more on this below)                | ✔️        |
| `EMAIL_DKIM_PRIVATE_KEY`               | The DKIM private key                                                                     | ❌        |
| `JWT_TOKEN`                            | The secret key for generating JWT tokens                                                 | ✔️        |

### Running the Development Environment

To launch the Next.js website and deploy the database schema, utilize the following commands:

```sh
bun db:push
bun dev --turbo
```

### How It Works

EmailThing primarily handles the front-end aspect of the email management application. For sending and receiving emails, it relies on [Cloudflare Email Workers](https://developers.cloudflare.com/email-routing/email-workers/) for incoming emails and [MailChannels](https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels) for outgoing emails.

For local development, consult the Cloudflare Workers [README](./cloudflare-workers/README.md) for detailed instructions.

## Why did you make this?

I made this because I wanted to have a way to deal with my emails from a custom domain. The options from Gmail were too expensive, and I couldn't find a good alternative, so I made my own. I tried to make it in a way that gives you the most control over your emails (ie owning the worker receiving emails).

### Setting Up the Database and Application

Initial setup involves some manual configurations. After preparing the database, you must manually create an admin account in the `User` table. This enables the creation and management of other user accounts.

At present, the application does not support adding default domains automatically. You need to manually insert these into the `MailboxDefaultDomain` table. Additionally, the URL for sending emails is hardcoded within the project files, necessitating manual updates to reflect your specific configuration.

## Acknowledgments

Many individuals and organizations have contributed to the realization of this project. Special thanks to:

* [Vercel](https://vercel.com) for hosting the application and for developing Next.js.
* [Cloudflare](https://cloudflare.com) for providing workers and email routing services.
* [MailChannels](https://mailchannels.com) for offering a straightforward transactional email API.
* [Planetscale](https://planetscale.com) for their user-friendly database services.
* The Next.js Discord community ([Discord link](https://discord.gg/NextJS)) for their support and motivation.
* Dawid Jankowski ([portfolio](https://dribbble.com/shots/15142673-E-mail-Client-Inbox-Dark-Mode)) for the design inspiration.
* And many others whose contributions have been invaluable.

### Need Help?

If you encounter any issues or have questions, please join our [Discord server](https://discord.gg/GT9Q2Yz4VS) for assistance. I'm more than willing to help. For a quicker resolution, please seek support through Discord rather than opening an issue, as it facilitates better communication and understanding of your problem.