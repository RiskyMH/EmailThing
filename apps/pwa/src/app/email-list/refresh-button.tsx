import { Button } from "@/components/ui/button";
import { useOnline } from "@/utils/hooks";
import { RotateCcwIcon, CloudOff } from "lucide-react";
import { useTransition, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/tw";


export default function RefreshButton() {
    const online = useOnline();
    const [isPending, startTransition] = useTransition();
    const router = useRouter();


    const reload = () => {
        // TODO: do something more useful here
        toast.success("Would refresh!")
        return router.refresh() as Promise<any>
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
            className="-m-2 rounded-full p-2 text-muted-foreground hover:text-foreground shrink-0"
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

