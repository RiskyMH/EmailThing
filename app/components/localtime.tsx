import { dateDay, formatTimeAgo } from "../utils/tools";
import TooltipText from "./tooltip-text";
import { headers } from 'next/headers'

export default function LocalTime({ time, className, type }: { time: Date, className?: string, type: "normal" | "hour-min" | "hour-min/date" | "full" }) {
    const timeZone = headers().get("x-vercel-ip-timezone") || Intl.DateTimeFormat().resolvedOptions().timeZone

    return (
        <TooltipText
            text={time.toLocaleString([], { timeZone, day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            subtext={`(${timeZone})`}
        >
            <time dateTime={time.toISOString()} className={className}>
                {formatDate(time, type, timeZone)}
            </time>
        </TooltipText>
    )
}

function formatDate(date: Date, type: "normal" | "hour-min" | "hour-min/date" | "full", timeZone: string) {
    const todayWithTz = dateDay(new Date(), timeZone)

    if (type === "normal") {
        return date.toLocaleTimeString()
    } else if (type === "hour-min") {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone })
    } else if (type === "hour-min/date" && dateDay(date, timeZone) === todayWithTz) {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone })
    } else if (type === "hour-min/date") {
        return date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit', timeZone })
    } else if (type === "full") {
        return date.toLocaleString([], { timeZone, dateStyle: "medium", timeStyle: "short" }) + ` (${formatTimeAgo(date)})`
    } else {
        return date.toLocaleDateString([], { timeZone })
    }
}
