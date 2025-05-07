<h1 align="center">
  <a href="https://emailthing.app/home" target="_blank">
    <img src="https://emailthing.app/logo.png" alt="EmailThing Logo" width="84">
  </a>
  <br>
  EmailThing (pwa app)
</h1>

<p align="center">The react PWA for receiving and managing your emails!</p>

## Getting Started

This repository contains the code for front-end app that displays and sends emails.

### Installing the dependencies

```sh
# in root directory
bun install
```

> **Note**: This project utilizes [Bun](https://bun.sh) as its package manager for the monorepo.

### Running the development environment

```sh
# in pwa directory
bun dev
```

### Building the production app

This will build the app and put the static HTML in the `dist` directory.

```sh
# in pwa directory
bun build
```

## Stack

* [React](https://react.dev/)
* [Bun](https://bun.sh/) (for dev/bundler and npm install)
* [Tailwind CSS](https://tailwindcss.com/)
* [TypeScript](https://www.typescriptlang.org/)
* [Shadcn ui](https://ui.shadcn.com/)
* [Tiptap](https://tiptap.dev/)
* [Dexie.js](https://dexie.org/)
* [svgl](https://svgl.app/) (brand icons)
* [React Router](https://reactrouter.com/)
* [Cloudflare Pages](https://pages.cloudflare.com/)

Custom components:
* Authentication (a custom & simple hashing of password)



