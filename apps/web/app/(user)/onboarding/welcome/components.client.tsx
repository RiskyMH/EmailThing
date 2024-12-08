"use client";

import type { changeBackupEmail } from "@/(user)/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/tw";
import { ChevronRight, Github, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
// import { changeBackupEmail } from "@/(user)/actions";

interface WelcomePageProps {
    githubStars: number;
    action: typeof changeBackupEmail;
}

export function Page({ githubStars, action }: WelcomePageProps) {
    const [show, setShow] = useState(false);
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        const timeout = setTimeout(() => setShow(true), 1000);
        return () => clearTimeout(timeout);
    }, []);

    async function actionn(data: FormData) {
        startTransition(async () => {
            const res = await action(null, data, true);

            if (res?.error) {
                return void toast.error(res.error);
            }

            return void toast.success("Please verify your backup email to continue.", {
                description:
                    "If you find our email in your spam folder, we would greatly appreciate it if you could mark it as 'Not Spam'.",
                duration: 10_000,
            });
        });
    }

    return (
        <>
            <div className="flex flex-col gap-3 pt-4">
                I made this for the myself but wanted to share it with others, so your support by starring my repo would
                mean lots to me.
                <Link
                    className={buttonVariants({
                        variant: !show ? "default" : "secondary",
                        className: "gap-2",
                    })}
                    href="https://github.com/RiskyMH/EmailThing"
                    target="_blank"
                    onClick={() => setShow(true)}
                >
                    <Github className="size-4" />
                    Star EmailThing on GitHub <span className="text-muted-foreground">({githubStars} stars)</span>
                </Link>
            </div>

            <div
                className={cn(
                    "flex flex-col gap-3 pt-4 opacity-0",
                    show && "animate-[fadeIn] opacity-100 duration-500",
                )}
            >
                Once you&lsquo;ve looked at my code and verified its sane, you can finish setting up your account.
                <form className="grid items-start gap-4 px-4 sm:px-0" action={actionn}>
                    <Label htmlFor="email" className="text-secondary-foreground">
                        What&apos;s your backup email?
                    </Label>
                    <Input
                        placeholder="your@gmail.com"
                        className="border-none bg-secondary"
                        name="email"
                        type="email"
                        required
                        disabled={pending}
                    />

                    <Button type="submit" disabled={pending} className="gap-2">
                        Open mailbox
                        {pending ? (
                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        ) : (
                            <ChevronRight className="size-5" />
                        )}
                    </Button>
                </form>
            </div>
        </>
    );
}
