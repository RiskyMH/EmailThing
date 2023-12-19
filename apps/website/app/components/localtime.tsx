
export default function LocalTime({ time, className, type }: { time: Date, className?: string, type: "normal" | "hour-min" }) {

    return (
        <time dateTime={time.toISOString()} className={className} title={time.toLocaleString()}>
            {type === "normal" ? time.toLocaleTimeString()
                : type === "hour-min" ? time.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })
                    : new Date(time).toLocaleString()
            }
        </time>
    )
}