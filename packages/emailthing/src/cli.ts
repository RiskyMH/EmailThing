#!/usr/bin/env bun
// import { EmailThing } from "./api";

// console.info("EmailThing!");
// console.info(" - Not much yet, use the website for now: https://emailthing.app");
// console.info(` - Or try the experimental CLI with \`bunx @emailthing/${"cli"}}\``);

const fileArgv = process.argv.indexOf(import.meta.file);
const args = process.argv.slice(fileArgv !== -1 ? fileArgv + 1 : 2);
const isLatest = process.env.npm_lifecycle_script?.includes("@latest");

Bun.spawn(
    ["bun", "x", isLatest ? "@emailthing/cli@latest" : "@emailthing/cli", ...args],
    {
        stdout: "inherit",
        stderr: "inherit",
        stdin: "inherit",
        onExit: (_, code) => process.exit(code),
    }
);
// TODO: consider making it run `bun i @emailthing/cli` and then linking this file to that one to be faster for subsequent runs

// if (process.env.EMAILTHING_TOKEN) {
//     const emailthing = new EmailThing(process.env.EMAILTHING_TOKEN);
//     console.info("Logged in as:", await emailthing.whoami());
// }
