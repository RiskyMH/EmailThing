import { DocsPage } from "@/components/docs-page"
import { Components as MD } from "@/components/docs-page-components"
import type { Metadata } from "next"

export const metadata = {
    title: "Custom Domain",
    description: "How to add your custom domain to a mailbox",
    openGraph: {
        title: "Custom Domain",
        description: "How to add your custom domain to a mailbox",
        siteName: "EmailThing",
        images: ["/logo.png"],
        locale: "en_US",
        url: "https://emailthing.xyz/docs/custom-domain",
        type: "website"
    },
    alternates: {
        canonical: "https://emailthing.xyz/docs/custom-domain",
    },    

} satisfies Metadata


export default function AboutPage() {
    return (
        <DocsPage
            title="Custom Domain"
            description="How to add your custom domain to a mailbox"
            toc={[
                { title: "Hi", href: "#HI" },
                { title: "Hi2", href: "#HI2" },
                { title: "Hi3", href: "#HI3" },
            ]}
            pager={{ prev: { title: "About", href: "/docs" }, next: { title: "B", href: "/docs/b" } }}
        >
            <MD.p>Follow the steps that the app shows you (from mailbox settings)</MD.p>
            <MD.h2 id="HI">HI</MD.h2>
            <div className="h-56"></div>
            <MD.h2 id="HI2">HI2</MD.h2>
            <div className="h-56"></div>
            <MD.h2 id="HI2">HI2</MD.h2>
            <div className="h-56"></div>
            <MD.code>HII</MD.code>

        </DocsPage>
    )
}

