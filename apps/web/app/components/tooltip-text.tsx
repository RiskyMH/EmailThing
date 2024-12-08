import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PropsWithChildren } from "react";

export default function TooltipText({
    children,
    text,
    subtext,
    suppressHydrationWarning,
    ...rest
}: PropsWithChildren<{
    text: string;
    subtext?: string;
    suppressHydrationWarning?: boolean;
}>) {
    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild {...rest} suppressHydrationWarning={suppressHydrationWarning}>
                    {children}
                </TooltipTrigger>
                <TooltipContent suppressHydrationWarning={suppressHydrationWarning}>
                    <p className="text-center text-foreground">{text}</p>
                    {subtext && <p className="text-center text-muted-foreground">{subtext}</p>}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
