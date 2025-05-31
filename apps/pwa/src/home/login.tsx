import Logo from "@/components/logo";
// import Logo from "@/icons/Logo"
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/tw";
import { ChevronLeft, KeyRoundIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { get, parseRequestOptionsFromJSON, supported } from "@github/webauthn-json/browser-ponyfill";
import { useEffect, useState, type FormEvent, useTransition } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  SmartDrawer,
  SmartDrawerClose,
  SmartDrawerContent,
  SmartDrawerDescription,
  SmartDrawerFooter,
  SmartDrawerHeader,
  SmartDrawerTitle,
  SmartDrawerTrigger,
} from "@/components/ui/smart-drawer";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const searchParams = useSearchParams()[0];
  const username = searchParams.get("username");
  return (
    <div className="container flex h-screen min-h-screen w-screen flex-col items-center justify-center bg-background">
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

      <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
        <div className="flex flex-col gap-2 text-center">
          <Logo className="mx-auto size-10" />
          {/* <MailIcon className="mx-auto size-6" /> */}
          <h1 className="font-semibold text-2xl tracking-tight">
            {username ? "Welcome back" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {username
              ? "Enter your password to sign back into your email"
              : "Enter your username to sign in to your email"}
          </p>
        </div>

        {/* the actual login part */}
        <UserAuthForm />
        <ApiUrlButton />
      </div>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            description: "Login to your account",
          }),
        }}
      />
    </div>
  );
}

("use client");

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }

// Shared login handler for both password and passkey
async function handleLoginResponse({ data, navigate, username, apiUrl }: {
  data: {
    token: string;
    refreshToken: string;
    tokenExpiresAt: string;
    refreshTokenExpiresAt: string;
    mailboxes: string[];
    userId: string;
    error?: string;
  } | { error: string };
  navigate: ReturnType<typeof useNavigate>;
  username?: string | null;
  apiUrl: string;
}) {
  if (!data || 'error' in data && data.error) {
    return void toast.error(data?.error || "Login failed");
  }
  const { token, refreshToken, tokenExpiresAt, refreshTokenExpiresAt, mailboxes, userId, userOnboarding } = data as {
    token: string;
    refreshToken: string;
    tokenExpiresAt: string;
    refreshTokenExpiresAt: string;
    mailboxes: string[];
    userId: string;
    userOnboarding: boolean;
  };
  const { db, initializeDB } = await import("@/utils/data/db");
  await initializeDB();
  await db.localSyncData.clear();
  await db.mailboxForUser.clear();
  await db.localSyncData.put(
    {
      token,
      refreshToken,
      tokenExpiresAt: new Date(tokenExpiresAt),
      refreshTokenExpiresAt: new Date(refreshTokenExpiresAt),
      lastSync: 0,
      isSyncing: true,
      userId,
      apiUrl,
    },
    userId,
  );
  // Get mailboxId from cookie if it exists and is valid, otherwise use first mailbox
  const mailboxId = document.cookie.includes("mailboxId=")
    ? document.cookie.split("mailboxId=")[1].split(";")[0]
    : undefined;
  const selectedMailbox = mailboxId && mailboxes.includes(mailboxId) ? mailboxId : mailboxes[0];
  document.cookie = `mailboxId=${selectedMailbox}; path=/; Expires=Fri, 31 Dec 9999 23:59:59 GMT;`;
  navigate(`/mail/${selectedMailbox}${userOnboarding ? "?onboarding" : ""}`);
  toast.success("Welcome back!");
  db.initialFetchSync();
}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isPending, startTransition] = useTransition();
  const [hadAnError, setHadAnError] = useState<false | string>(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const username = searchParams.get("username");
  const apiUrl = searchParams.get("api") || "https://emailthing.app";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    startTransition(async () => {
      const res = await fetch(`${apiUrl}/api/internal/login?type=password`, {
        method: "POST",
        body: JSON.stringify({
          username: (event.target as HTMLFormElement).username.value,
          password: (event.target as HTMLFormElement).password.value,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setHadAnError((event.target as HTMLFormElement).username.value ?? "unknown");
        setLoading(false);
        return void toast.error(data.error || (await res.text()));
      }
      await handleLoginResponse({ data, navigate, username, apiUrl });
      setLoading(false);
    });
  }

  useEffect(() => {
    const checkMailboxId = async () => {
      if (typeof window !== "undefined" && !username && document.cookie.includes("mailboxId=")) {
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
  }, [username, navigate]);

  return (
    <>
      <div className={cn("grid gap-6", className)} {...props}>
        <form onSubmit={onSubmit}>
          <div className="grid gap-2">
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="email">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                placeholder="Username"
                type="text"
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect="off"
                className="border-none bg-secondary"
                disabled={isPending}
                defaultValue={username ?? ""}
              />
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
                autoComplete="password"
                autoCorrect="off"
                className="border-none bg-secondary"
                disabled={isPending}
              />
            </div>

            <Button disabled={isPending} type="submit">
              {loading && <Loader2 className="me-2 size-4 animate-spin" />}
              Sign In
            </Button>
          </div>
        </form>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t-2" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <PasskeysLogin transition={[isPending, startTransition]} />
      <p className="flex flex-col gap-2 px-8 text-center text-muted-foreground text-sm">
        <Link href="/register" className="underline underline-offset-4 hover:text-muted-foreground">
          Don&apos;t have an account? Sign Up
        </Link>
        {hadAnError && <ResetPasswordDiag username={hadAnError} />}
      </p>
    </>
  );
}

function ResetPasswordDiag({ username }: { username: string }) {
  const [isPending, startTransition] = useTransition();

  const resetPasswordAction = async () => {
    startTransition(async () => {
      toast.warning("todo");
      // const res = await resetPassword(username).catch(catchRedirectError);
      // if (res?.error) {
      //     toast.error(res.error);
      // } else {
      //     toast.success("Check your email for the reset link.");
      //     document.getElementById("smart-drawer:close")?.click();
      // }
    });
  };

  return (
    <SmartDrawer>
      <SmartDrawerTrigger asChild>
        <button
          className="cursor-pointer underline underline-offset-4 hover:text-muted-foreground"
          type="button"
        >
          Forgot your password?
        </button>
      </SmartDrawerTrigger>
      <SmartDrawerContent className="sm:max-w-[425px]">
        <SmartDrawerHeader>
          <SmartDrawerTitle>Reset your password</SmartDrawerTitle>
          <SmartDrawerDescription>
            We will send you an email the user <strong>{username}</strong>&lsquo;s back up email to
            reset your password. Are you sure you want to continue?
          </SmartDrawerDescription>
        </SmartDrawerHeader>
        <SmartDrawerFooter className="flex pt-2">
          <SmartDrawerClose className={buttonVariants({ variant: "secondary" })}>
            Close
          </SmartDrawerClose>
          <Button onClick={resetPasswordAction} disabled={isPending} className="gap-2">
            {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
            Continue
          </Button>
        </SmartDrawerFooter>
      </SmartDrawerContent>
    </SmartDrawer>
  );
}

function PasskeysLogin({ transition }: { transition: [boolean, React.TransitionStartFunction] }) {
  const [isPending, startTransition] = transition;
  const [support, setSupport] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const username = searchParams.get("username");
  const apiUrl = searchParams.get("api") || "https://emailthing.app";
  useEffect(() => {
    setSupport(supported());
  }, []);

  const handleLogin = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    setLoading(true);
    startTransition(async () => {
      try {
        const challenge = "login";
        const rpid = window.location.hostname === "pwa.emailthing.app" ? "emailthing.app" : window.location.hostname;
        const credential = await get(
          parseRequestOptionsFromJSON({
            publicKey: {
              challenge: btoa(challenge),
              timeout: 60000,
              userVerification: "required",
              rpId: rpid,
            },
          })
        );
        if (!credential) {
          setLoading(false);
          return void toast.error("No passkey");
        }
        const res = await fetch(`${apiUrl}/api/internal/login?type=passkey`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: credential.toJSON() }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setLoading(false);
          return void toast.error(data.error || "Failed to sign in with passkey");
        }
        await handleLoginResponse({ data, navigate, username, apiUrl });
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to sign in with passkey");
        setLoading(false);
      }
    });
  };

  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant: "secondary", className: "gap-2" }))}
      onClick={handleLogin}
      disabled={isPending || !support}
    >
      {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRoundIcon className="mr-2 size-4" />}
      Passkey
    </button>
  );
}

// icon button in bottom right of screen where you can change the api url (button press opens modal where its defaulted to the https://emailthing.app)
export function ApiUrlButton() {
  const searchParams = useSearchParams()[0];
  const apiUrl = searchParams.get("api") || "https://emailthing.app";
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const apiUrl = formData.get("api") as string;
    searchParams.set("api", apiUrl);
    navigate({ search: searchParams.toString() }, { replace: true });
    document.getElementById("smart-drawer:close")?.click();
  };

  return (

    <SmartDrawer>
      <SmartDrawerTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="absolute bottom-4 right-4">
          <SettingsIcon className="size-4" />
        </Button>
      </SmartDrawerTrigger>
      <SmartDrawerContent className="sm:max-w-[425px]">

        <SmartDrawerHeader>
          <SmartDrawerTitle>API URL</SmartDrawerTitle>
          <SmartDrawerDescription>
            Change the API URL to use a different server.
          </SmartDrawerDescription>
        </SmartDrawerHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid items-start gap-4 px-4 sm:px-0">

            <Input
              defaultValue={apiUrl}
              name="api"
              id="api-url-input"
              className="border-none bg-secondary"
              autoFocus
              required
            />
          </div>

          <SmartDrawerFooter className="flex pt-4">
            <SmartDrawerClose asChild>
              <Button type="submit">Save</Button>
            </SmartDrawerClose>
          </SmartDrawerFooter>
        </form>

      </SmartDrawerContent>
    </SmartDrawer>
  );
}