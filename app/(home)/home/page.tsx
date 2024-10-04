import GitHubIcon from "@/components/icons/github";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/tw";
import {
    CloudCogIcon,
    type LucideIcon,
    ReceiptTextIcon,
    SmartphoneIcon,
    TimerIcon,
    UsersIcon,
    WebhookIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";

export default async function Home() {
    const currentMailbox = cookies().get("mailboxId")?.value;

    return (
        <>
            <section className="flex flex-col gap-6 pt-6 pb-8 md:pt-10 md:pb-12 lg:py-32 sm:[.kawaii_&]:pt-10 lg:[.kawaii_&]:pb-10">
                <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                    <Link
                        href="https://discord.gg/GT9Q2Yz4VS"
                        className="rounded-2xl bg-tertiary px-4 py-1.5 font-medium text-sm"
                        target="_blank"
                    >
                        Follow along on Discord
                    </Link>
                    <h1 className="block text-balance font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl [.kawaii_&]:hidden">
                        <span className="sr-only">EmailThing is </span>
                        <span className="uppercase">a</span>
                        {"n "}
                        <span className="inline-block whitespace-nowrap bg-gradient-to-br from-[#FF9797] to-[#6D6AFF] bg-clip-text text-transparent">
                            email app
                        </span>
                        where you can receive and send emails!
                    </h1>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.svg" loading="lazy" className="hidden" alt="EmailThing logo" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/emailthing-kawaii.svg"
                        loading="lazy"
                        className="hidden self-center sm:h-[20rem] [.kawaii_&]:flex"
                        alt="EmailThing kawaii logo by Alfonsusac"
                    />
                    <p className="max-w-[42rem] text-balance text-muted-foreground leading-normal sm:text-xl sm:leading-8">
                        I didn&apos;t like options for custom domains and email, so I decided to build an email app and
                        make it open source.
                    </p>
                    <div className="flex gap-4">
                        {currentMailbox ? (
                            <Link href={`/mail/${currentMailbox}`} className={cn(buttonVariants({ size: "lg" }))}>
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
                            className={cn(
                                buttonVariants({
                                    variant: "outline",
                                    size: "lg",
                                    className: "gap-1 px-5 font-medium",
                                }),
                            )}
                        >
                            <GitHubIcon className="me-1 mb-[0.1rem] size-4" />
                            GitHub
                            <span className="font-normal text-muted-foreground">
                                •
                                <Suspense fallback="∞">
                                    <GitHubStars />
                                </Suspense>
                            </span>
                        </Link>
                    </div>
                </div>
            </section>
            <section
                id="features"
                className="container flex flex-col gap-6 bg-slate-50 py-8 md:py-12 lg:py-24 dark:bg-transparent"
            >
                <div className="mx-auto flex max-w-[58rem] flex-col items-center gap-4 text-center">
                    <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Features</h2>
                    <p className="max-w-[85%] text-muted-foreground leading-normal sm:text-lg sm:leading-7">
                        This project is an experiment to see how to even go about making an email client. It tries to
                        make uses of the latest features of Next.js 14 and the web.
                    </p>
                </div>
                <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                    <Feature
                        icon={WebhookIcon}
                        title="API integration"
                        description={
                            <>
                                You can send emails and do other things with our API.{" "}
                                <Link href="/docs/api" className="font-bold hover:underline">
                                    read docs
                                </Link>
                                .
                            </>
                        }
                    />
                    <Feature
                        icon={ReceiptTextIcon}
                        title="Contact page"
                        description={
                            <>
                                You can setup your very own contact page.{" "}
                                <Link
                                    href="https://emailthing.me/@riskymh"
                                    className="font-bold hover:underline"
                                    target="_blank"
                                >
                                    see example
                                </Link>
                                .
                            </>
                        }
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
                    <p className="sm:-lg text-muted-foreground leading-normal sm:leading-7">
                        EmailThing is still in its early days, so feel free to suggest improvements and report bugs!
                    </p>
                </div>
            </section>
            <section id="open-source" className="container py-8 md:py-12 lg:py-24">
                <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
                    <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Proudly Open Source</h2>
                    <p className="max-w-[85%] text-muted-foreground leading-normal sm:text-lg sm:leading-7">
                        EmailThing is open source and powered by open source software. <br /> The code is available on{" "}
                        <Link
                            href="https://github.com/RiskyMH/EmailThing"
                            target="_blank"
                            className="underline underline-offset-4"
                        >
                            GitHub
                        </Link>
                        .
                    </p>
                </div>
            </section>
        </>
    );
}

export const metadata: Metadata = {
    alternates: {
        canonical: "https://emailthing.app/home",
    },
    title: {
        absolute: "EmailThing",
    },
};

async function GitHubStars() {
    const githubStars = (
        await (
            await fetch("https://api.github.com/repos/RiskyMH/EmailThing", {
                next: { revalidate: 60 },
            })
        ).json()
    ).stargazers_count;
    return githubStars;
}

function Feature({
    title,
    description,
    icon: Icon,
}: { title: string; description: string | ReactNode; icon: LucideIcon }) {
    return (
        <div className="relative overflow-hidden rounded-lg bg-card p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <Icon className="size-12" />
                <div className="flex flex-col gap-2">
                    <h3 className="font-bold">{title}</h3>
                    <p className="text-muted-foreground text-sm">{description}</p>
                </div>
            </div>
        </div>
    );
}
