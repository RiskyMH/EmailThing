import { Link } from "react-router-dom";
import HomeLayout from "./layout";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/tw";
import { CheckIcon } from "lucide-react";
import { Suspense } from "react";
import TooltipText from "@/components/tooltip-text";
import { getSponsors } from "./fetch.macro" with { type: "macro" };

export default function Pricing() {

    return (
        <section className="container flex flex-col gap-6 py-8 md:max-w-[64rem] md:py-12 lg:py-24">
            <div className="mx-auto flex w-full flex-col gap-4 md:max-w-[58rem]">
                <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                    Simple, transparent pricing
                </h2>
                <p className="max-w-[85%] text-muted-foreground leading-normal sm:text-lg sm:leading-7">
                    Unlock simple features for your email needs.
                </p>
            </div>
            <div className="grid w-full items-start gap-10 rounded-lg bg-card p-10 md:grid-cols-[1fr_200px]">
                <div className="grid gap-6">
                    <h3 className="font-bold text-xl sm:text-2xl">What&apos;s included in the FREE plan</h3>
                    <ul className="grid gap-3 text-muted-foreground text-sm sm:grid-cols-2">
                        <li className="flex items-center">
                            <CheckIcon className="mr-2 size-4" /> Receive & Send Emails
                        </li>
                        <li className="flex items-center">
                            <CheckIcon className="mr-2 size-4" /> 100mb Storage
                        </li>
                        <li className="flex items-center">
                            <CheckIcon className="mr-2 size-4" /> 3 Custom domain per mailbox
                        </li>
                        <li className="flex items-center">
                            <CheckIcon className="mr-2 size-4" /> 3 Users per mailbox
                        </li>
                        <li className="flex items-center">
                            <CheckIcon className="mr-2 size-4" /> 5 Mailboxes per user
                        </li>
                        <li className="flex items-center">
                            <CheckIcon className="mr-2 size-4" /> Basic Support
                        </li>
                    </ul>
                </div>
                <div className="flex flex-col gap-4 text-center">
                    <div>
                        <h4 className="font-bold text-7xl">$0</h4>
                        <p className="font-medium text-muted-foreground text-sm">Billed Monthly</p>
                    </div>
                    <Link to="/register" className={cn(buttonVariants({ size: "lg" }))}>
                        Get Started
                    </Link>
                </div>
            </div>
            <div className="mx-auto flex w-full max-w-[58rem] flex-col gap-4">
                <p className="max-w-[85%] text-muted-foreground leading-normal sm:leading-7">
                    <strong>EmailThing is only a free app right now.</strong> If you would like to donate and keep the
                    project free for everyone, you can do so on my{" "}
                    <Link
                        to="https://github.com/sponsors/RiskyMH"
                        className="text-blue-500 hover:underline"
                        target="_blank"
                    >
                        donation page
                    </Link>{" "}
                    like these awesome people:
                </p>

                <Suspense fallback={null}>
                    <Sponsors />
                </Suspense>
            </div>
            <script
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        description: "Whats included in FREE plan? Everything!",
                    }),
                }}
            />
        </section>
    );
}

function Sponsors() {
    const sponsors = getSponsors() as any as Awaited<ReturnType<typeof getSponsors>>;

    return (
        <div className="flex flex-wrap justify-center gap-6 overflow-auto">
            <TooltipText text="RiskyMH 😀" subtext="(me, the creator)">
                <a href="https://github.com/RiskyMH" target="_blank" className="size-12 rounded-full" rel="noreferrer">
                    <img
                        src="https://avatars.githubusercontent.com/RiskyMH"
                        alt={`GitHub avatar for "RiskyMH"`}
                        className="size-full rounded-full"
                        loading="lazy"
                        crossOrigin="anonymous"
                    />
                </a>
            </TooltipText>

            {sponsors.map((s) => (
                <TooltipText
                    text={s.name && s.name !== s.username ? s.name : `@${s.username}`}
                    key={s.username}
                    subtext={
                        s.type === "past"
                            ? "(past sponsor)"
                            : s.name && s.name !== s.username
                                ? `@${s.username}`
                                : undefined
                    }
                >
                    <a
                        href={`https://github.com/${s.username}`}
                        target="_blank"
                        className="size-12 rounded-full data-[type=past]:grayscale"
                        data-type={s.type}
                        rel="noreferrer"
                    >
                        <img
                            src={s.avatar}
                            alt={`GitHub avatar for "${s.username}"`}
                            className="size-full rounded-full"
                            loading="lazy"
                            crossOrigin="anonymous"
                        />
                    </a>
                </TooltipText>
            ))}
        </div>
    );
}
