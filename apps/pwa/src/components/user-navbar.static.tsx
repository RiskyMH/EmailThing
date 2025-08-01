import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function UserNavFallback() {
  return <div className="size-8 animate-pulse self-center rounded-full bg-secondary" />;
}

export function UserNavLogin() {
  return (
    <Link
      to="/login"
      className={buttonVariants({
        variant: "secondary",
        size: "sm",
        className: "px-4 not-dark:[.bg-sidebar_&]:bg-background",
      })}
    >
      Login
    </Link>
  );
}

export function DemoLinkButton() {
  return (
    <Button variant="ghost" asChild size="sm">
      <Link to="/mail/demo" className="group flex items-center gap-2 max-sm:hidden">
        Demo
        <ArrowRightIcon className="group-hover:-me-0.5 size-4 text-muted-foreground transition-all group-hover:ms-0.5" />
      </Link>
    </Button>
  );
}
