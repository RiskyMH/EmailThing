<h1 align="center">
  <a href="https://emailthing.app/home" target="_blank">
    <img src="https://emailthing.app/logo.png" alt="EmailThing Logo" width="84">
  </a>
  <br>
  EmailThing
</h1>

<p align="center">A web app for receiving and sending your emails!</p>

## Getting Started

There are 3 apps in this repository. It originally started with the web app, but I have since added a PWA and API to improve the user experience and replace the web app.
<!-- table for the 3 apps (web, pwa, api) - web being default -->
<table>
  <tr>
    <td align="center" width="33%" valign="top">
      <!-- <br> -->
      <h3>
      <img src="https://svgl.app/library/nextjs_icon_dark.svg" alt="Next.js Logo" width="50">
      <br>
      <a href="./apps/web#readme"><b>Web</b></a> <em>(original)</em>
      </h3>
      <br>
      The original web app that was made with Next.js. 
      <br><br>
      <p>This is right now whats used in production, however the others are being focused on and this soon will just be here as deprecated and historic value.</p>
    </td>
    <td align="center" width="33%" valign="top">
      <!-- <br> -->
      <h3>
      <img src="https://react.dev/images/brand/logo_dark.svg" alt="React.js Logo" width="50">
      <br>
      <a href="./apps/pwa#readme"><b>PWA</b></a> <em>(in progress)</em>
      </h3>
      <br>
      The PWA app that was made with React & Bun bundler. This is a complete rewrite of the web app.
      <br><br>
      <a href="https://pwa.emailthing.app">Try it out.</a>
    </td>
    <td align="center" width="33%" valign="top">
      <!-- <br> -->
      <h3>
      <img src="https://bun.sh/logo.svg" alt="Next.js Logo" width="50">
      <br>
      <a href="./apps/api#readme"><b>API</b></a> <em>(in progress)</em>
      </h3>
      <br>
      The API that was made with Bun's <code>Bun.serve</code>. This is a complete rewrite of the web app (api section).
    </td>
  </tr>
</table>

## Selfhost or contributing

Please refer the individual app README files for more information on how to selfhost or contribute to the project.
* [`apps/web`](./apps/web/README.md)
* [`apps/pwa`](./apps/pwa/README.md)
* [`apps/api`](./apps/api/README.md)

## How it works

<em>(what is planned for the new PWA and API)</em>

**React SPA:** A simple local first React app that is hosted on Cloudflare Pages and can manage your emails. This will send api calls to the API to change the database.

**API:** A Bun based API that is hosted on VPS. Will handle all the email sending and receiving as well as the syncing apis.


### Why did you make this?

I made this because I wanted to have a way to deal with my emails from a custom domain. The options from Gmail were too expensive, and I couldn't find a good alternative, so I made my own. I tried to make it in a way that gives you the most control over your emails (ie owning the worker receiving emails).


## Credits

Many individuals and organizations have contributed to the creation of this project. Special thanks to:

* [Vercel](https://vercel.com) for hosting the application and for developing Next.js.
* [Cloudflare](https://cloudflare.com) for providing S3, workers, and email routing.
* [Xata](https://xata.io) for providing a good pricing for database.
* [Alfonsusac](https://github.com/alfonsusac) for designing the logo and sticker.
* [Members of Next.js Discord](https://discord.gg/NextJS) for helping me with motivation and testing.
* *and many more that I can't possibly mention...*

## Need Help?

If you encounter any issues or have questions, please join our [Discord server](https://discord.gg/GT9Q2Yz4VS) for assistance. I'm more than willing to help. Please seek support through Discord rather than opening an issue, as it facilitates better communication and understanding of your problem.

