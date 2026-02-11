# EmailThing

> This is a package with the SDK for [EmailThing](https://emailthing.app/home) to use with the API, and also has a CLI version so you can view your emails and send them from the terminal.

**NOTE:** This is v0 still and can contain breaking changes.

## SDK

JavaScript library for the [EmailThing API](https://emailthing.app/docs/api).

### Setup

First, you need to get an API key, which is available in the EmailThing mailbox config page.

```js
import { EmailThing } from 'emailthing';
const emailthing = new EmailThing('et__aaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbbb');
```

### Usage

Send your first email:

```js
await emailthing.send({
  from: 'you@example.com',
  to: ['user@gmail.com'],
  subject: 'hello world',
  text: 'it works!',
});
```

You can also use more advanced features:

```js
await emailthing.send({
  from: 'Me <you@example.com>',
  to: [
    'Friend <user@gmail.com',
    'Better Friend <user@emailthing.xyz>'
  ],
  cc: ['Me <you@example.com>'],
  bcc: ['Me <you@example.com>'],
  reply_to: 'Everyone <you@example.com>',
  subject: 'hello world',
  text: 'it works!',
  html: '<h1>it works!</h1>',
  headers: {
    'X-Entity-Ref-ID': '23456789',
  },
  config: {
    // no config options right now
  },
});
```

## CLI

An in-progress visual terminal interface for the [EmailThing](https://emailthing.app/home) site.

Modes provided by [`@emailthing/cli`](https://www.npmjs.com/package/@emailthing/cli):
* Normal interactive: navigate mailboxes, read and compose emails from your terminal
* Agent mode: let your agent interact with your emails via command line

> Note: This requires [Bun](https://bun.com/) as its runtime.

```sh
$ bunx emailthing
$ bunx @emailthing/cli
# Welcome to EmailThing CLI!
# <interactive terminal UI starts here>

$ bunx @emailthing/cli agent list # see your email list
$ bunx @emailthing/cli agent email id12345 # see that email
```
