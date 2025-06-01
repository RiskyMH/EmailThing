import { Button, buttonVariants } from "@/components/ui/button";
// import {
//     Dialog,
//     DialogClose,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from "@/components/ui/dialog"
import {
    SmartDrawer,
    SmartDrawerTrigger,
    SmartDrawerContent,
    SmartDrawerHeader,
    SmartDrawerTitle,
    SmartDrawerDescription,
    SmartDrawerFooter,
    SmartDrawerClose,
} from "@/components/ui/smart-drawer";

import { useEffect, useState, useTransition } from "react";
import changeUserSettings from "./_api";
import { toast } from "sonner";
import { defaultStars } from "@/home/home";
import { Input } from "@/components/ui/input";
import { ChevronRight, Loader2 } from "lucide-react";
import GitHubIcon from "@/components/icons/github";
import { cn } from "@/utils/tw";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import Link from "@/components/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getMe } from "@/utils/data/queries/user";

export default function OnboardingWelcome() {
    // a modal that shows a welcome message and a button to continue
    const [open, setOpen] = useState(true);

    const [showFull, setShowFull] = useState(false);
    const [pending, startTransition] = useTransition();
    const navigate = useNavigate();

    useEffect(() => {
        const timeout = setTimeout(() => setShowFull(true), 3000);
        return () => clearTimeout(timeout);
    }, []);

    async function actionn(data: FormData) {
        startTransition(async () => {

            if (window.location.pathname.includes("/mail/demo")) {
                void toast.warning("You can't change the backup email for the demo mailbox.");
                setOpen(false);
                setTimeout(() => navigate({ search: "" }), 100);
                return;
            }

            const res = await changeUserSettings("change-backup-email", {
                email: data.get("email") as string,
            });

            if ("error" in res) {
                return void toast.error(res.error);
            }

            toast.success("Please verify your backup email to continue.", {
                description:
                    "If you find our email in your spam folder, we would greatly appreciate it if you could mark it as 'Not Spam'.",
                duration: 10_000,
            });
            setTimeout(() => {
                setOpen(false);
                setTimeout(() => navigate({ search: "" }), 100);
            }, 500);
        });
    }

    const currentUser = useLiveQuery(getMe);

    return (
        <SmartDrawer
            // maybe make it less buggy
            // normally its good, but as this can get so tall,
            // vaul can get a little messy on mobile lol
            repositionInputs={false}
            open={open}
            onOpenChange={(open) => {
                if (!open) {
                    setOpen(false);
                    setTimeout(() => navigate({ search: "" }), 100);
                }
            }}
        >
            <SmartDrawerContent className="overflow-y-auto">
                <SmartDrawerHeader>
                    <SmartDrawerTitle>Welcome to EmailThing! 👋 </SmartDrawerTitle>
                    <SmartDrawerDescription>
                        <p>
                            <strong>EmailThing is a new way to manage your email.</strong>{" "}
                            You can use it to send and receive emails, and even create your own email addresses.
                            We&lsquo;re excited to have you on board!
                        </p>
                    </SmartDrawerDescription>
                </SmartDrawerHeader>

                <div className="flex flex-col gap-4 max-sm:p-4">
                    <div className="flex flex-col gap-3 ">
                        <p className="text-sm">
                            I made this for myself but wanted to share it with others, so your support by starring my repo would
                            mean lots to me.
                        </p>
                        <Link
                            className={buttonVariants({
                                variant: !showFull ? "default" : "secondary",
                                className: "gap-2",
                            })}
                            href="https://github.com/RiskyMH/EmailThing"
                            target="_blank"
                            onClick={() => setShowFull(true)}
                        >
                            <GitHubIcon className="size-4" />
                            Star EmailThing on GitHub <span className="text-muted-foreground">({defaultStars} stars)</span>
                        </Link>
                    </div>

                    <hr className="border-border" />

                    <form className="flex flex-col gap-4" action={actionn}>
                        <p className="text-sm text-muted-foreground -mb-1">
                            Once you&lsquo;ve checked out the code, finish setting up your account below.
                        </p>
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
                            defaultValue={currentUser?.backupEmail}
                        />

                        <Button type="submit" disabled={pending} className="gap-2" variant={showFull ? "default" : "secondary"}>
                            Open mailbox
                            {pending ? (
                                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                            ) : (
                                <ChevronRight className="size-5" />
                            )}
                        </Button>
                    </form>
                </div>

                {/* <SmartDrawerFooter>
                    <SmartDrawerClose asChild>
                        <Button>Continue</Button>
                    </SmartDrawerClose>
                </SmartDrawerFooter> */}
            </SmartDrawerContent>
        </SmartDrawer>
    )
}