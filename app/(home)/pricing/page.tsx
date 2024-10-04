import Link from "next/link"

import { cn } from "@/utils/tw"
import { buttonVariants } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"
import { Suspense } from "react"
import TooltipText from "@/components/tooltip-text"
import { unstable_cache } from "next/cache"

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
          <Link href="https://github.com/sponsors/RiskyMH" className="hover:underline text-blue-500" target="_blank">
            donation page
          </Link>{" "}
          like these awesome people:
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


// BELOW IS JUST GETTING AND SHOWING SPONSORS
// not that related to pricing tbh

function parseSponsors(html: string) {
  const users = [];

  const regex = /<a[^>]*href="\/([^"]+)"[^>]*>\s*<img[^>]*src="([^"]+)"[^>]*alt="[^"]*"\s*\/>/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const username = match[1];
    const avatar = match[2];
    users.push({ username, avatar, name: undefined });
  }

  return users;
}

async function getActiveSponsors(): Promise<{ username: string, avatar: string, name?: string }[]> {
  if (!process.env.GITHUB_PAT) {
    return fetch("https://github.com/sponsors/riskymh/sponsors_partial?filter=active")
      .then(e => e.text())
      .then(parseSponsors)
  }

  const res = await fetch("https://api.github.com/graphql", {
    method: 'POST',
    headers: {
      authorization: `token ${process.env.GITHUB_PAT}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ query: `{ user(login: \"riskymh\") { ... on Sponsorable { sponsors(first: 100) { totalCount nodes { ... on User { login name avatarUrl } ... on Organization { login name avatarUrl } } } } } } }` })
  })

  const body = await res.json()

  return body.data.user.sponsors.nodes.map((e: Record<string, string>) => ({
    username: e.login,
    name: e.name,
    avatar: e.avatarUrl,
  } as const))

}

const getSponsors = unstable_cache(async () => {
  const [active, inactive] = await Promise.all([
    getActiveSponsors(),

    fetch("https://github.com/sponsors/riskymh/sponsors_partial?filter=inactive")
      .then(e => e.text())
      .then(parseSponsors),
  ])

  return [
    ...active.map(sponsor => ({
      ...sponsor,
      type: 'current' as const
    })),

    ...inactive.map(sponsor => ({
      ...sponsor,
      type: 'past' as const
    })),
  ];
}, [], { revalidate: 1000 })

async function Sponsors() {
  const sponsors = await getSponsors()

  return (
    <div className="flex gap-6 overflow-auto flex-wrap justify-center">
      <TooltipText text='RiskyMH 😀' subtext="(me, the creator)">
        <a href="https://github.com/RiskyMH" target="_blank" className="rounded-full size-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://avatars.githubusercontent.com/RiskyMH" alt={`GitHub avatar for "RiskyMH"`} className="size-full rounded-full" loading="lazy" />
        </a>
      </TooltipText>

      {sponsors.map(s => (
        <TooltipText
          text={(s.name && s.name !== s.username) ? s.name : `@${s.username}`}
          key={s.username}
          subtext={s.type === 'past' ? "(past sponsor)" : ((s.name && s.name !== s.username) ? `@${s.username}` : undefined)}
        >
          <a href={`https://github.com/${s.username}`} target="_blank" className="rounded-full size-12 data-[type=past]:grayscale" data-type={s.type}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.avatar} alt={`GitHub avatar for "${s.username}"`} className="size-full rounded-full" loading="lazy" />
          </a>
        </TooltipText>
      ))}
    </div>
  )
}