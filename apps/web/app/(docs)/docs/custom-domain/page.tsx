import { DocsPage } from "@/components/docs-page";
import { Components as MD } from "@/components/docs-page-components";
import type { Metadata } from "next";

export const metadata = {
    title: "Custom Domain",
    description: "How to add your custom domain to a mailbox",
    openGraph: {
        title: "Custom Domain",
        description: "How to add your custom domain to a mailbox",
        siteName: "EmailThing",
        images: ["/logo.png"],
        locale: "en_US",
        url: "https://emailthing.app/docs/custom-domain",
        type: "website",
    },
    alternates: {
        canonical: "https://emailthing.app/docs/custom-domain",
    },
} satisfies Metadata;

export default function AboutPage() {
    return (
        <DocsPage
            title="Custom Domain"
            description="How to add your custom domain to a mailbox"
            toc={[
                { title: "Send Emails", href: "#send-email" },
                { title: "Receive Emails", href: "#receive-emails" },
                {
                    title: "Receive Emails (advanced)",
                    href: "#receive-emails-advanced",
                },
            ]}
            // pager={{ prev: { title: "About", href: "/docs" }, next: { title: "B", href: "/docs/b" } }}
            pager={{ prev: { title: "About", href: "/docs" } }}
        >
            <MD.p>Follow the steps that the app shows you (from mailbox settings)</MD.p>

            <MD.h2 id="send-email">Send Emails</MD.h2>
            <MD.p>
                Make sure your{" "}
                <MD.a
                    href="https://www.cloudflare.com/en-au/learning/dns/dns-records/dns-spf-record/"
                    target="_blank"
                    rel="noreferrer"
                >
                    SPF TXT DNS record
                </MD.a>{" "}
                allows EmailThing to send emails on your behalf:
            </MD.p>
            <MD.p>
                <MD.code>v=spf1 include:_spf.mx.emailthing.app -all</MD.code>
            </MD.p>

            {/* // TODO: DKIM */}
            <p />
            <MD.h2 id="receive-email">Receive Emails</MD.h2>
            <MD.p>TODO</MD.p>
            {/* // TODO: Receive email */}

            <MD.h2 id="receive-email-advanced">Receive Emails (advanced)</MD.h2>
            <MD.p>TODO but its the Cloudflare Email Worker method</MD.p>
            {/* // TODO: Receive email docs */}
        </DocsPage>
    );
}
