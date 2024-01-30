import { randomBytes, createHash } from "crypto"

export const randomText = (size = 16) =>
    randomBytes(size).toString("hex")

export function dateDay(date: Date, timeZone: string) {
    return date.toLocaleString("en-US", {
        timeZone,
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    })
}

export function gravatar(email: string) {
    const hash = createHash("md5")
        .update(email.toLowerCase())
        .digest("hex")
    return `https://www.gravatar.com/avatar/${hash}?d=404`
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
