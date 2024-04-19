
export function dateDay(date: Date, timeZone: string | undefined) {
    return date.toLocaleString([], {
        timeZone,
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    })
}

export type DateStyle = "normal" | "hour-min" | "hour-min/date" | "full" | "date"
export function formatDate(date: Date, type: DateStyle, timeZone: string | undefined) {
    const todayWithTz = dateDay(new Date(), timeZone)

    if (type === "normal") {
        return date.toLocaleTimeString()
    } else if (type === "hour-min") {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone }).toUpperCase()
    } else if (type === "date") {
        const local = timeZone ? (timeZone.includes("Australia") ? "en-GB" : "en-US") : [];
        return date.toLocaleDateString(local, { month: '2-digit', day: '2-digit', year: '2-digit', timeZone })
    } else if (type === "hour-min/date") {
        if (dateDay(date, timeZone) === todayWithTz) {
            return formatDate(date, "hour-min", timeZone)
        } else {
            return formatDate(date, "date", timeZone)
        }
    } else if (type === "full") {
        return date.toLocaleString([], { timeZone, dateStyle: "medium", timeStyle: "short" }) + ` (${formatTimeAgo(date)})`
    } else {
        return date.toLocaleDateString([], { timeZone })
    }
}

export async function gravatar(email: string) {
    const myText = new TextEncoder().encode(email.toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', myText);
    const hashArray = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    return `https://www.gravatar.com/avatar/${hashArray}?d=404`
}


const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
})

const DIVISIONS = [
    { amount: 60, name: "seconds" },
    { amount: 60, name: "minutes" },
    { amount: 24, name: "hours" },
    { amount: 7, name: "days" },
    { amount: 4.34524, name: "weeks" },
    { amount: 12, name: "months" },
    { amount: Number.POSITIVE_INFINITY, name: "years" },
]

export function formatTimeAgo(date: Date) {
    let duration = (date.valueOf() - Date.now()) / 1000

    for (const division of DIVISIONS) {
        if (Math.abs(duration) < division.amount) {
            return formatter.format(Math.round(duration), division.name as any)
        }
        duration /= division.amount
    }
}
