'use client';

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, Github, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import { cn } from "@/utils/tw";
import { toast } from "sonner";


export function Page({ githubStars, action }: any) {
    const [show, setShow] = useState(false)
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        setTimeout(() => setShow(true), 2500)
    }, [])

    async function actionn(data: FormData) {
        // @ts-ignore - the types seem to be wrong with async
        startTransition(async () => {
            const res = await action(data.get("email") as string, true)
            
            if (res?.error) {
               return toast.error(res.error)
            }
            
            return toast.success("Your backup email has been saved.")
        })
    }

    return (
        <>
            <div className="pt-4 flex flex-col gap-3">
                If you would like to star this project on GitHub, please click the button below.
                <Link
                    className={buttonVariants({ variant: !show ? "default" : "secondary", className: "gap-2" })}
                    href="https://github.com/RiskyMH/Email" target="_blank"
                    onClick={() => setShow(true)}
                >
                    <Github className="h-4 w-4" />
                    Star EmailThing on GitHub <span className="text-muted-foreground">({githubStars} stars)</span>
                </Link>
            </div>

            <div className={cn("pt-4 flex flex-col gap-3 animate-out opacity-0", show && "opacity-100")}>
                Once you&lsquo;ve starred the project, you can continue setting up your account.
                <form className="grid items-start gap-4 px-4 sm:px-0" action={actionn} >
                    <Label htmlFor="email" className="text-secondary-foreground">What&apos;s your backup email?</Label>
                    <Input
                        placeholder="your@gmail.com"
                        className="border-none bg-secondary"
                        name="email"
                        type="email"
                        required
                        disabled={pending}
                    />

                    <Button type="submit" disabled={pending} className="gap-2">
                        Continue
                        {pending ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                    </Button>
                </form>
            </div >
        </>
    )
}