import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/utils/tw'
import { ShieldAlertIcon, CloudCogIcon, UsersIcon, SmartphoneIcon, TimerIcon, LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ReactNode } from 'react'

export default function Home() {
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
            An email app where you can receive and send emails!
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8" style={{ textWrap: 'balance' }} >
            I didn&apos;t like options for custom domains and email, so I decided to build an email app and make it open source.
          </p>
          <div className="space-x-4">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
              Get Started
            </Link>
            <Link
              href="https://github.com/RiskyMH/Email"
              target="_blank"
              rel="noreferrer"
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
          <div className="bg-card relative overflow-hidden rounded-lg p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <svg viewBox="0 0 24 24" className="h-12 w-12 fill-current">
                <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.573 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z" />
              </svg>
              <div className="space-y-2">
                <h3 className="font-bold">Next.js 14</h3>
                <p className="text-sm text-muted-foreground">
                  App dir, Routing, Layouts, Loading UI and Server Actions.
                </p>
              </div>
            </div>
          </div>

          <Feature
            icon={ShieldAlertIcon}
            title="Anti-spam"
            description={(<>
              We use {" "}
              <a href="https://www.cloudflare.com/en-au/developer-platform/email-routing/" className="font-bold hover:underline" target="_blank" rel="noreferrer">
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
            description="Useful for teams, you can add up to 5 users per mailbox."
          />
          <Feature
            icon={TimerIcon}
            title="Temporary Email"
            description="Incase you need a burner email, we got you covered. [coming soon]"
          />
          <Feature
            icon={SmartphoneIcon}
            title="Mobile support"
            description="Emailthing is mobile friendly, so you can use it on the go."
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
              href="https://github.com/RiskyMH/Email"
              target="_blank"
              rel="noreferrer"
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
    absolute: "Emailthing",
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