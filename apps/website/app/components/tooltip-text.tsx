import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/app/components/ui/tooltip";
import { PropsWithChildren } from "react";

export default function TooltipText({ children, text, subtext }: PropsWithChildren<{ text: string, subtext?: string }>) {

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-center text-foreground">{text}</p>
                    {subtext && <p className="text-muted-foreground text-center">{subtext}</p>}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

    )
}