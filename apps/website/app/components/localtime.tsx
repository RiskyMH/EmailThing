import TooltipText from "./tooltip-text";
import { headers } from 'next/headers'

export default function LocalTime({ time, className, type }: { time: Date, className?: string, type: "normal" | "hour-min" }) {
    const tz = headers().get("x-vercel-ip-timezone")
    if (tz) {
        time = new Date(time.toLocaleString("en-US", { timeZone: tz }))
    }

    return (
        <TooltipText text={`${time.toLocaleString()} (${tz})`}>
            <time dateTime={time.toISOString()} className={className}>
                {type === "normal" ? time.toLocaleTimeString()
                    : type === "hour-min" ? time.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })
                        : new Date(time).toLocaleString()
                }
            </time>
        </TooltipText>

    )
}