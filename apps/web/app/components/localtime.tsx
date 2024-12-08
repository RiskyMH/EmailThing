import { headers } from "next/headers";
import LocalTimeClient, { type LocalTimeProps } from "./localtime.client";

export default async function LocalTime({ time, className, type = "date" }: LocalTimeProps) {
    const timeZone = (await headers()).get("x-vercel-ip-timezone") || Intl.DateTimeFormat().resolvedOptions().timeZone;

    return <LocalTimeClient time={time} className={className} type={type} initialTimeZone={timeZone} />;
}
