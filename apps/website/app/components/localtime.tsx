import { dateMonth } from "../utils/tools";
import TooltipText from "./tooltip-text";
import { headers } from 'next/headers'

export default function LocalTime({ time, className, type }: { time: Date, className?: string, type: "normal" | "hour-min" | "hour-min/date" }) {
    const tz = headers().get("x-vercel-ip-timezone") || Intl.DateTimeFormat().resolvedOptions().timeZone
    time = new Date(time.toLocaleString("en-US", { timeZone: tz }))

    return (
        <TooltipText text={time.toLocaleString()} subtext={`(${tz})`}>
            <time dateTime={time.toISOString()} className={className}>
                {formatDate(time, type)}
            </time>
        </TooltipText>
    )
}

function formatDate(date: Date, type: "normal" | "hour-min" | "hour-min/date") {
    const tz = headers().get("x-vercel-ip-timezone")

    const todayWithTz = dateMonth(new Date(new Date().toLocaleString("en-US", { timeZone: tz || undefined })))

    if (type === "normal") {
        return date.toLocaleTimeString()
    } else if (type === "hour-min") {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })
    } else if (type === "hour-min/date" && dateMonth(date) === todayWithTz) {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })
    } else if (type === "hour-min/date") {
        return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' })
    } else {
        return date.toLocaleDateString()
    }
}
