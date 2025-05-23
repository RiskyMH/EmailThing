import Link from "@/components/link";
import Logo from "@/components/logo";
// import Logo from "@/icons/Logo"
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/tw";
import { ArrowRightIcon, ChevronLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="container flex h-screen min-h-screen w-screen flex-col items-center justify-center bg-background">
      <div className="flex w-full items-center justify-between">
        <Link
          href="/home"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "absolute top-4 left-4 md:top-8 md:left-8",
          )}
        >
          <ChevronLeft className="me-2 size-4" />
          Home
        </Link>
        <Link
          href="/mail/demo"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "group absolute top-4 right-4 gap-2 md:top-8 md:right-8 ",
          )}
        >
          Try Demo
          <ArrowRightIcon className="group-hover:-me-0.5 size-4 text-muted-foreground transition-all group-hover:ms-0.5" />
        </Link>
      </div>

      <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
        <div className="flex flex-col gap-2 text-center">
          <Logo className="mx-auto size-10" />
          {/* <MailIcon className="mx-auto size-6" /> */}
          <h1 className="font-semibold text-2xl tracking-tight">Welcome to EmailThing</h1>
          {/* <p className="text-sm text-muted-foreground">
                        Choose an username and password to create an account
                    </p> */}
          <p className="text-muted-foreground text-sm">
            Currently you need an invite code, please{" "}
            <a
              href="mailto:emailthing@riskymh.dev"
              className="font-bold hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              email me
            </a>{" "}
            or ask on{" "}
            <a
              href="https://discord.gg/GT9Q2Yz4VS"
              className="font-bold hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Discord
            </a>{" "}
            for an invite code.
          </p>
        </div>

        {/* the actual form part */}
        <UserAuthForm />

        <p className="flex flex-col gap-2 px-8 text-center text-muted-foreground text-sm">
          <Link href="/login" className="underline underline-offset-4 hover:text-brand">
            Already have an account? Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

("use client");

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { cn } from "@/utils/tw";
import { Loader2 } from "lucide-react";
// import { useRouter } from "react-router-dom";
import { type FormEvent, useTransition } from "react";
import { toast } from "sonner";
// import signUp from "./action";
// import catchRedirectError from "@/utils/no-throw-on-redirect.client";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isPending, startTransition] = useTransition();
  // const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      return void toast.info("Not implemented", {
        description: "Login works. Or you can use the normal https://emailthing.app/register",
      });
      // const formData = new FormData(event.target as HTMLFormElement);
      // const signUpResult = await signUp(formData)//.catch(catchRedirectError);

      // if (signUpResult?.error) {
      //   if ("link" in signUpResult && signUpResult.link)
      //     return void toast.error(signUpResult.error, {
      //       action: (
      //         <a
      //           href={signUpResult.link.l}
      //           target="blank"
      //           className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-secondary p-2 hover:bg-secondary/80"
      //         >
      //           {signUpResult.link.m} <ExternalLinkIcon className="size-4 text-muted-foreground" />
      //         </a>
      //       ),
      //     });
      //   return void toast.error(signUpResult.error);
      // }

      // toast.success("Welcome!");
      // // router.refresh();
    });
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Username
            </Label>
            <div
              className={cn(
                "group flex h-10 w-full gap-2 self-center rounded bg-secondary px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                isPending && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                id="username"
                name="username"
                placeholder="Username"
                type="text"
                autoCapitalize="none"
                autoComplete="new-password"
                autoCorrect="off"
                className="w-full bg-transparent focus-visible:outline-none"
                disabled={isPending}
                required
              />
              <span>@emailthing.xyz</span>
            </div>
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              placeholder="*******"
              type="password"
              autoComplete="new-password"
              autoCorrect="off"
              className="border-none bg-secondary"
              disabled={isPending}
              required
            />
          </div>

          <Button disabled={isPending} type="submit">
            {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
            Register
          </Button>
        </div>
      </form>
    </div>
  );
}
