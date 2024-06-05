import { buttonVariants } from '@/components/ui/button'
import type { Metadata } from 'next'
import Link from 'next/link'

export default async function Home() {

    return (
        <>
            <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center" style={{ textWrap: "balance" }}>
                    <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl block">
                        <span className='inline-block whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-br from-[#FF9797] to-[#6D6AFF]'>EmailThing.me</span>{" "}
                        is your own contact page to make emailing easy!
                    </h1>

                    <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8" style={{ textWrap: 'balance' }} >
                        Very much WIP, but if you ever wanted a contact form that can email you with responses, here is the place!
                    </p>
                    <div className="flex gap-4">
                        <Link
                            href="https://emailthing.xyz/register?from=/settings/emailthing-me"
                            className={buttonVariants({ variant: "default", className: "h-11 rounded-md px-8" })}
                            target="_blank"
                        >
                            Setup your own!
                        </Link>
                        <Link
                            href="/emailme/@RiskyMH"
                            className={buttonVariants({ variant: "outline", className: "h-11 rounded-md px-8" })}
                        >
                            Example
                        </Link>
                    </div>

                </div>
            </section >
        </>
    )
}

export const metadata: Metadata = {
    alternates: {
        // canonical: "https://emailthing.me",
    },
    title: {
        absolute: "EmailThing.me | Custom forms to make emailing you easy!",
    },
    // todo: when the domain is acquired fix:
    robots: {
        index: false
    }
}
