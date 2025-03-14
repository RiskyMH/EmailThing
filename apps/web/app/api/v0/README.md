# EmailThing API

https://emailthing.app/api/v0/

JS SDK: https://www.npmjs.com/package/emailthing

**NOTE:** This is v0 still and can contain breaking changes.

## Headers

The headers all routes use and require.

| Header          | Type     | Description                                 |
| --------------- | -------- | ------------------------------------------- |
| `Authorization` | `string` | The token to use, (eg `Bearer et__abcd...`) |
| `Content-Type`  | `string` | Currently only supports `application/json`  |

## [`POST /api/v0/receive-email`](./receive-email/route.ts)

Sending your emails to the front-end app. Mainly for custom domains and cloudflare email workers.

**JSON Body:**
| Key     | Value    | Description                                |
| ------- | -------- | ------------------------------------------ |
| `to`    | `string` | The email address the email was sent to.   |
| `from`  | `string` | The email address the email was sent from. |
| `email` | `string` | The raw email content.                     |

**Example:**
```json
{
  "to": "RiskyMH@riskymh.dev",
  "from": "RiskyMH@emailthing.xyz",
  "email": 
"Date: Mon, 1 Apr 2025 01:00:00 +0000
From: RiskyMH <RiskyMH@emailthing.xyz>
Subject: Hello, World!
To: <RiskyMH@riskymh.dev>
Content-Type: text/plain

Hello, World!"
}
```

## [`POST /api/v0/send`](./send/route.ts)

Send an email with an mailbox alias. 

**JSON Body:**
| Key                   | Value       | Description                            |
| --------------------- | ----------- | -------------------------------------- |
| `to`                  | `string[]`  | Recipient email address.               |
| `cc`                  | `string[]?` | Cc recipient email address.            |
| `bcc`                 | `string[]?` | Bcc recipient email address.           |
| `reply_to`            | `string?`   | Reply-to email address.                |
| `from`                | `string`    | Sender email address.                  |
| `subject`             | `string`    | Email subject.                         |
| `html`                | `string?`   | The HTML version of the message.       |
| `text`                | `string?`   | The plain text version of the message. |
| `headers`             | `object?`   | Custom headers to add to the email.    |

**Example:**
```json
{
  "to": [
    "RiskyMH@riskymh.dev",
    "EmailThing <Me@riskymh.deb",
  ],
  "cc": [
    "HI <hi@emailthing.xyz>"
  ],
  "bcc": [
    "verysecret@mydomain.com"
  ],
  "reply_to": "no-reply@emailthing.xyz",
  "from": "You know who <RiskyMH@emailthing.xyz>",
  "subject": "Hello, World!",
  "text": "Hello, World!",
  "html": "<h1>Hello, World!</h1>",
  "headers": {
    "X-Entity-Ref-ID":  "23456789",
  },
  "config": {
    // no config options right now
  }
}

// minimal:
{
  "to": ["RiskyMH@riskymh.dev"],
  "from": "RiskyMH@emailthing.xyz",
  "subject": "Hello, World!",
  "text": "Hello, World!",
}
```

**Response (200)**
```json
{
  "success": true,
}
```

**Response (400)**
```json
{
  "error": "Invalid email address"
}
```

## [`GET /api/v0/whoami`](./whoami/route.ts)

Get the current token's information.

**Response (200)**
```json
{
  "mailboxId": "somerandomid",
}
