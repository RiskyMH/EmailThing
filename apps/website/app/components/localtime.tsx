import TooltipText from "./tooltip-text";

export default function LocalTime({ time, className, type }: { time: Date, className?: string, type: "normal" | "hour-min" }) {

    return (
        <TooltipText text={time.toLocaleString()}>
            <time dateTime={time.toISOString()} className={className}>
                {type === "normal" ? time.toLocaleTimeString()
                    : type === "hour-min" ? time.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })
                        : new Date(time).toLocaleString()
                }
            </time>
        </TooltipText>

    )
}