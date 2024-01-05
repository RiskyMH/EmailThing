import { cn } from "@/app/utils/tw";
import { SearchIcon, ChevronDownIcon } from "lucide-react";

export function Search({ className }: { className?: string }) {
    return (
        <div className={cn(className, "group h-10 w-full py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background dark:bg-secondary rounded flex self-center px-3 gap-2")}>
            <SearchIcon className="self-center text-muted-foreground" />
            <input
                type="search"
                placeholder="Search emails..."
                className="w-full focus-visible:outline-none bg-transparent"
            />
            <ChevronDownIcon className="self-center text-muted-foreground" />
        </div>
    )
}