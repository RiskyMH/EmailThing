import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata = {
    title: "API Documentation",
    description: "The many routes of EmailThing API and how to use them",
    openGraph: {
        title: "Custom Domain",
        description: "The many routes of EmailThing API and how to use them",
        siteName: "EmailThing",
        images: ["/logo.png"],
        locale: "en_US",
        url: "https://emailthing.xyz/docs/api",
        type: "website"
    },
    alternates: {
        canonical: "https://emailthing.xyz/docs/api",
    },
} satisfies Metadata


export default function APIDocs() {
    // temp docs
    redirect("https://github.com/RiskyMH/EmailThing/tree/main/app/api/v0#readme")
}