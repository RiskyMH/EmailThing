import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";

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
                className: "px-4",
            })}
        >
            Login
        </Link>
    );
}

export function DemoLinkButton() {
    return (
        <Button variant="ghost" asChild size="sm">
            <Link to="/mail/demo" className="flex items-center gap-2 group max-sm:hidden">
                Demo
                <ArrowRightIcon className="size-4 text-muted-foreground group-hover:-me-0.5 group-hover:ms-0.5 transition-all" />
            </Link>
        </Button>
    )
}
