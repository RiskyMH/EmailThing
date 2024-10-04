#!/usr/bin/env bun
import { EmailThing } from "./api";

console.info("EmailThing!");
console.info("Not much yet, use the website for now: https://emailthing.app");

if (process.env.EMAILTHING_TOKEN) {
    const emailthing = new EmailThing(process.env.EMAILTHING_TOKEN);
    console.info("Logged in as:", await emailthing.whoami());
}
