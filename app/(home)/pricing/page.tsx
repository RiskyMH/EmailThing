import Link from "next/link"

import { cn } from "@/utils/tw"
import { buttonVariants } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"
import { Suspense } from "react"
import TooltipText from "@/components/tooltip-text"

export const metadata = {
  title: "Pricing",
  description: "Whats included in FREE plan? Everything!",
  alternates: {
    canonical: "https://emailthing.app/pricing",
  },
}

export default function PricingPage() {
  return (
    <section className="container flex flex-col gap-6 py-8 md:max-w-[64rem] md:py-12 lg:py-24">
      <div className="mx-auto flex w-full flex-col gap-4 md:max-w-[58rem]">
        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Simple, transparent pricing
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Unlock simple features for your email needs.
        </p>
      </div>
      <div className="grid w-full items-start gap-10 rounded-lg bg-card p-10 md:grid-cols-[1fr_200px]">
        <div className="grid gap-6">
          <h3 className="text-xl font-bold sm:text-2xl">
            What&apos;s included in the FREE plan
          </h3>
          <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <li className="flex items-center">
              <CheckIcon className="mr-2 size-4" /> Receive & Send Emails
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 size-4" /> 100mb Storage
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 size-4" /> 3 custom domain per mailbox
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 size-4" /> 3 users per mailbox
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 size-4" /> 5 Mailboxes
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 size-4" /> Basic Support
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-4 text-center">
          <div>
            <h4 className="text-7xl font-bold">$0</h4>
            <p className="text-sm font-medium text-muted-foreground">
              Billed Monthly
            </p>
          </div>
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
            Get Started
          </Link>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[58rem] flex-col gap-4">
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:leading-7">
          <strong>EmailThing is only a free app right now.</strong> {" "}
          If you would like to donate and keep the project free for everyone, you can do so on my{" "}
          <Link href="https://github.com/sponsors/RiskyMH" className="underline hover:text-foreground" target="_blank">
            donation page
          </Link>{" "}
          like these few people:
        </p>

        <Suspense fallback={null}>
          <Sponsors />
        </Suspense>
      </div>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "description": "Whats included in FREE plan? Everything!",
          })
        }} />
    </section>
  )
}


async function Sponsors() {
  const res = await fetch("https://ghs.vercel.app/v3/sponsors/riskymh", { next: { revalidate: 1200 } })
  const _sponsors = await res.json() as {
    status: string,
    sponsors: {
      current: { username: string, avatar: string }[],
      past: { username: string, avatar: string }[]
    }
  };

  const sponsors = [
    ..._sponsors.sponsors.current.map(sponsor => ({
      username: sponsor.username,
      avatar: sponsor.avatar,
      type: 'current'
    })).sort((a, b) => a.username.localeCompare(b.username)),

    ..._sponsors.sponsors.past.map(sponsor => ({
      username: sponsor.username,
      avatar: sponsor.avatar,
      type: 'past'
    })).sort((a, b) => a.username.localeCompare(b.username)),
  ];

  return (
    <div className="flex gap-4">
      {sponsors.map(s => (
        <TooltipText text={s.username} key={s.username} subtext={s.type === 'past' ? "(past sponsor)" : undefined}>
          <a href={`https://github.com/${s.username}`} target="_blank" className="rounded-full size-12 data-[type=past]:grayscale" data-type={s.type}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.avatar} alt={`GitHub avatar for "${s.username}"`} className="size-full rounded-full" />
          </a>
        </TooltipText>
      ))}
    </div>
  )
}