import { DocsPage } from "@/components/docs-page";
import { Callout, Components as MD, MdxCard } from "@/components/docs-page-components";

export default function AboutPage() {
  return (
    <DocsPage
      title="Introduction"
      description="An email app where you can receive and send emails!"
      toc={[
        {
          title: "Features",
          href: "#features",
          children: [
            { title: "API", href: "#api" },
            { title: "Custom Domain", href: "#custom-domain" },
          ],
        },
      ]}
      pager={{
        next: { title: "Custom Domain", href: "/docs/custom-domain" },
      }}
    >
      <MD.p>
        EmailThing is a basic email client things of sending and receiving email through a website. The main
        reason I made this was so I can use my custom domain to send emails with (and this is probably the only
        reason you may want to use).
      </MD.p>

      <Callout>
        <MD.p>
          This site is a work in progress. If you see dummy text on a page, it means I&apos;m still working on
          it. You can follow updates on Discord.
        </MD.p>
      </Callout>

      <MD.h2 id="features">Features</MD.h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MdxCard href="/docs/api">
          <MD.h3 id="api">API</MD.h3>
          <MD.p>Another way of sending emails!</MD.p>
        </MdxCard>

        <MdxCard href="/docs/custom-domain">
          <MD.h3 id="custom-domain">Custom Domains</MD.h3>
          <MD.p>Being restricted to a specific domain is boring, so why not use your own fancy one!</MD.p>
        </MdxCard>
      </div>
    </DocsPage>
  );
}
