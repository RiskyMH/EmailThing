import Link from "@/components/link";
import Logo from "@/components/logo";
// import Logo from "@/icons/Logo"
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/tw";
import { ArrowRightIcon, ChevronLeft, ExternalLinkIcon } from "lucide-react";
import { DISCORD_URL } from "@emailthing/const/urls";

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
              href={DISCORD_URL}
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
        <ApiUrlButton />


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
import { type FormEvent, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ApiUrlButton } from "./login";
// import signUp from "./action";
// import catchRedirectError from "@/utils/no-throw-on-redirect.client";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }


export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const inviteCode = searchParams.get("invite");
  const apiUrl = searchParams.get("api") || "https://emailthing.app";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {

      if (!inviteCode) {
        return void toast.error("You need an invite code to signup. Join the Discord to get!", {
          action: (
            <a
              href={DISCORD_URL}
              target="blank"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-input p-2 hover:bg-input/80"
            >
              Get Invite <ExternalLinkIcon className="size-4 text-muted-foreground" />
            </a>
          ),
        });
      }

      const res = await fetch(`${apiUrl}/api/internal/register`, {
        method: "POST",
        body: JSON.stringify({
          username: (event.target as HTMLFormElement).username.value,
          password: (event.target as HTMLFormElement).password.value,
          invite: inviteCode,
        }),
      });

      if (!res.ok) {
        if (res.headers.get("content-type")?.includes("application/json")) {
          const data = await res.json();
          return void toast.error(data.error);
        }
        return void toast.error(await res.text());
      }

      const data = await res.json();
      if (data.error) {
        return void toast.error(data.error);
      }

      const { token, refreshToken, tokenExpiresAt, refreshTokenExpiresAt, mailboxes } = data;

      const { db, initializeDB } = await import("@/utils/data/db");
      await initializeDB();

      await db.localSyncData.clear();
      await db.mailboxForUser.clear();
      await db.localSyncData.put(
        {
          token,
          refreshToken,
          tokenExpiresAt,
          refreshTokenExpiresAt,
          lastSync: 0,
          isSyncing: true,
          userId: data.userId,
          apiUrl,
        },
        data.userId,
      );

      const selectedMailbox = mailboxes[0];
      document.cookie = `mailboxId=${selectedMailbox}; path=/; Expires=Fri, 31 Dec 9999 23:59:59 GMT;`;
      navigate(`/mail/${selectedMailbox}?`);

      toast.success("Welcome!");

      db.initialFetchSync();
    });
  }

  useEffect(() => {
    const checkMailboxId = async () => {
      if (typeof window !== "undefined" && document.cookie.includes("mailboxId=")) {
        const { db, initializeDB } = await import("@/utils/data/db");
        await initializeDB();
        const mailboxId = document.cookie.split("mailboxId=")[1].split(";")[0];
        const mailbox = await db.mailboxes.get(mailboxId);
        if (mailbox) {
          navigate(`/mail/${mailboxId}`);
        }
      }
    }

    checkMailboxId();
  }, [navigate]);

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Username
            </Label>
            <Input asChild disabled={isPending} className="bg-input flex gap-2">
              <div>
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
            </Input>
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
              className="border-none bg-input"
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
