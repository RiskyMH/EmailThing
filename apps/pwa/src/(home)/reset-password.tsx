import Logo from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/tw";
import { API_URL } from "@emailthing/const/urls";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()[0];
  const token = searchParams.get("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

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
          <h1 className="font-semibold text-2xl tracking-tight">Reset your password</h1>
          <p className="text-muted-foreground text-sm">
            Enter your new password below
          </p>
        </div>

        <ResetPasswordForm token={token || ""} />

        <p className="flex flex-col gap-2 px-8 text-center text-muted-foreground text-sm">
          <Link href="/login" className="underline underline-offset-4 hover:text-muted-foreground">
            Remember your password? Sign In
          </Link>
        </p>
      </div>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            description: "Reset your password",
          }),
        }}
      />
    </div>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const apiUrl = searchParams.get("api") || API_URL;
  const username = searchParams.get("username");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const password = (event.target as HTMLFormElement).password.value;

    // Simple client-side validation before sending to server
    if (password.length < 8) {
      setLoading(false);
      toast.error("Password needs to be at least 8 characters");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/internal/login/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            password,
            type: "reset"
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          setLoading(false);
          toast.error(data.error || "Failed to reset password");
          return;
        }

        toast.success("Password reset successful. Please login with your new password.");
        navigate("/login");
      } catch (err) {
        console.error(err);
        toast.error("Failed to reset password. Please try again.");
        setLoading(false);
      }
    });
  }

  return (
    <div className={cn("grid gap-6")}>
      <form onSubmit={onSubmit} className="grid gap-2">
        <div className="grid gap-1">
          {username && <Label className="sr-only" htmlFor="username" />}
          {username && <Input
            className="border-none bg-secondary"
            id="username"
            name="username"
            type="text"
            value={username || ""}
            readOnly
          />}
        </div>

        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="password">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            placeholder="*******"
            type="password"
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect="off"
            className="border-none bg-secondary"
            disabled={isPending}
            required
            minLength={8}
          />
        </div>

        <Button disabled={isPending} type="submit">
          {loading && <Loader2 className="me-2 size-4 animate-spin" />}
          Reset Password
        </Button>
      </form>
    </div>
  );
} 