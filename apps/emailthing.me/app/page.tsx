import { buttonVariants } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export default async function Home() {
    return (
        <>
            <section className="flex flex-col gap-6 pt-6 pb-8 md:pt-10 md:pb-12 lg:py-32">
                <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-balance text-center">
                    <h1 className="block font-heading text-3xl sm:text-5xl md:text-6xl">
                        <span className="inline-block whitespace-nowrap bg-gradient-to-br from-[#FF9797] to-[#6D6AFF] bg-clip-text text-transparent">
                            EmailThing.me
                        </span>{" "}
                        is your own contact page to make emailing easy!
                    </h1>

                    <p className="max-w-[42rem] text-balance text-muted-foreground leading-normal sm:text-xl sm:leading-8">
                        Very much WIP, but if you ever wanted a contact form that can email you with responses, here is
                        the place!
                    </p>
                    <div className="flex gap-4">
                        <Link
                            href="https://emailthing.app/register?from=/settings/emailthing-me"
                            className={buttonVariants({
                                variant: "default",
                                size: "lg",
                            })}
                            target="_blank"
                        >
                            Setup your own!
                        </Link>
                        <Link
                            href="/@RiskyMH"
                            className={buttonVariants({
                                variant: "outline",
                                size: "lg",
                            })}
                        >
                            Example
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}

export const metadata: Metadata = {
    alternates: {
        canonical: "https://emailthing.me",
    },
    title: {
        absolute: "EmailThing.me | Custom forms to make emailing you easy!",
    },
};
