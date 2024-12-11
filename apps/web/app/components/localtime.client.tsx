"use client";
import { useEffect, useState } from "react";
import { type DateStyle, formatDate } from "../utils/tools";
import TooltipText from "./tooltip-text";

export interface LocalTimeProps {
    time: Date;
    className?: string;
    type?: DateStyle;
}

export default function LocalTimeClient({
    time,
    className,
    type = "date",
    initialTimeZone,
}: LocalTimeProps & { initialTimeZone?: string }) {
    const [timeZone, setTimeZone] = useState<string | undefined>(initialTimeZone);

    useEffect(() => setTimeZone(undefined), []);

    return (
        <TooltipText
            text={time.toLocaleString([], {
                timeZone,
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })}
            subtext={timeZone ? `(${timeZone})` : undefined}
            suppressHydrationWarning
        >
            <time dateTime={time.toISOString()} className={className} suppressHydrationWarning>
                {formatDate(time, type, timeZone)}
            </time>
        </TooltipText>
    );
}