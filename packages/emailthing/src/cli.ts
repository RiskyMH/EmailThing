#!/usr/bin/env bun
import { EmailThing } from "./api"

console.log("EmailThing!")
console.log("Not much yet, use the website for now: https://emailthing.app")

if (process.env.EMAILTHING_TOKEN) {
    const emailthing = new EmailThing(process.env.EMAILTHING_TOKEN)
    console.log("Logged in as:", await emailthing.whoami())
}
