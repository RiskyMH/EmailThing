import { Button } from "@/components/ui/button";
import { useOnline } from "@/utils/hooks";
import { RotateCcwIcon, CloudOff } from "lucide-react";
import { useTransition, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/utils/tw";
import { useParams } from "react-router-dom";
import { syncUser } from "@/utils/data/sync-user";

export default function RefreshButton({ className }: { className?: string }) {
    const online = useOnline();
    const [isPending, startTransition] = useTransition();
    const params = useParams<{ mailboxId: string }>();

    const reload = () => {
        if (params.mailboxId === 'demo') {
            // TODO: do something more useful here
            toast.success("Would refresh!")
        } else {
            if (!navigator.onLine) {
                toast.info("You are offline")
                return
            }
            if (isPending) return
            startTransition(async () => {
                await syncUser(false, new Date(localStorage.getItem('lastSync') || 0))
            })
        }
    }


    useEffect(() => {
        const fn = () => online ? reload() : void toast.warning("Offline");

        const focus = () => !document.hidden && online && startTransition(fn);
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                startTransition(fn);
            }
        };

        document.addEventListener("visibilitychange", focus);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("visibilitychange", focus);
            document.removeEventListener("keydown", onKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    return (
        <Button
            variant="ghost"
            size="auto"
            className={cn("-m-2 rounded-full p-2 text-muted-foreground hover:text-foreground shrink-0", className)}
            onClick={() => {
                !isPending &&
                    startTransition(() =>
                        online ? reload() : void toast.warning("Offline")
                    )
            }}
            disabled={!online}
        >
            {online === false
                ? <CloudOff className="size-5 text-muted-foreground" />
                : <RotateCcwIcon className={cn(isPending && "animate-spin animate-direction-reverse", "size-5 text-muted-foreground")} />
            }
        </Button>

    )
}

