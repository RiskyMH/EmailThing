import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/app/components/ui/tooltip";
import { PropsWithChildren } from "react";

export default function TooltipText({ children, text }: PropsWithChildren<{text: string}>) {

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent>
                    <p>{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

    )
}