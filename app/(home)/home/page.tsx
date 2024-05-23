import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser } from '@/utils/jwt'
import { cn } from '@/utils/tw'
import { ShieldAlertIcon, CloudCogIcon, UsersIcon, SmartphoneIcon, TimerIcon, LucideIcon, WebhookIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ReactNode } from 'react'

export default async function Home() {
  const userId = await getCurrentUser()
  const currentMailbox = cookies().get("mailboxId")?.value

  return (
    <>
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <Link
            href="https://discord.gg/GT9Q2Yz4VS"
            className="rounded-2xl bg-tertiary px-4 py-1.5 text-sm font-medium"
            target="_blank"
          >
            Follow along on Discord
          </Link>
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            <span className='sr-only'>EmailThing is </span>
            <span className='uppercase'>a</span>n email app where you can receive and send emails!
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8" style={{ textWrap: 'balance' }} >
            I didn&apos;t like options for custom domains and email, so I decided to build an email app and make it open source.
          </p>
          <div className="space-x-4">
            {userId ? (
              <Link href={currentMailbox ? `/mail/${currentMailbox}` : "/mail"} className={cn(buttonVariants({ size: "lg" }))}>
                Open Mailbox
              </Link>
            ) : (
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
                Get Started
              </Link>
            )}
            <Link
              href="https://github.com/RiskyMH/EmailThing"
              target="_blank"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              GitHub
            </Link>
          </div>
        </div>
      </section>
      <section
        id="features"
        className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24"
      >
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Features
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            This project is an experiment to see how to even go about making an email client.
            It tries to make uses of the latest features of Next.js 14 and the web.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <Feature
            icon={WebhookIcon}
            title="API integration"
            description={(<>
              You can send emails and do other things with our API. {" "}
              <Link href="/docs/api" className="font-bold hover:underline">
                read docs
              </Link>.
            </>)}
          />
          <Feature
            icon={ShieldAlertIcon}
            title="Anti-spam"
            description={(<>
              We use {" "}
              <a href="https://www.cloudflare.com/en-au/developer-platform/email-routing/" className="font-bold hover:underline" target="_blank">
                Cloudflare Email Routing
              </a>
              {" "} to try and minimize spam.
            </>)}
          />
          <Feature
            icon={CloudCogIcon}
            title="Custom domain"
            description="Why not use your own domain? We support it!"
          />
          <Feature
            icon={UsersIcon}
            title="Multi-user support"
            description="Useful for teams, you can add up to 3 users per mailbox."
          />
          <Feature
            icon={TimerIcon}
            title="Temporary Email"
            description="Incase you need a burner email, we got you covered."
          />
          <Feature
            icon={SmartphoneIcon}
            title="Mobile support"
            description="EmailThing is mobile friendly, so you can use it on the go."
          />
        </div>
        <div className="mx-auto text-center md:max-w-[58rem]">
          <p className="leading-normal text-muted-foreground sm:-lg sm:leading-7">
            EmailThing is still in its early days, so feel free to suggest improvements and report bugs!
          </p>
        </div>
      </section >
      <section id="open-source" className="container py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Proudly Open Source
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            EmailThing is open source and powered by open source software. <br />{" "}
            The code is available on{" "}
            <Link
              href="https://github.com/RiskyMH/EmailThing"
              target="_blank"
              className="underline underline-offset-4"
            >
              GitHub
            </Link>
            .{" "}
          </p>
        </div>
      </section>
    </>
  )
}

export const metadata: Metadata = {
  alternates: {
    canonical: "https://emailthing.xyz/home",
  },
  title: {
    absolute: "EmailThing",
  }
}


function Feature({ title, description, icon: Icon }: { title: string, description: string | ReactNode, icon: LucideIcon }) {
  return (
    <div className="bg-card relative overflow-hidden rounded-lg p-2">
      <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
        <Icon className="h-12 w-12" />
        <div className="space-y-2">
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}