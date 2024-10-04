import LocalTimeClient, { type LocalTimeProps } from "./localtime.client";
import { headers } from 'next/headers'

export default function LocalTime({ time, className, type = "date" }: LocalTimeProps) {
    const timeZone = headers().get("x-vercel-ip-timezone") || Intl.DateTimeFormat().resolvedOptions().timeZone

    return (
        <LocalTimeClient time={time} className={className} type={type} initialTimeZone={timeZone} />
    )
}
