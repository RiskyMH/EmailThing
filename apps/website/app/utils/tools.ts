import crypto from "crypto"

export const randomText = (size = 16) =>
    crypto.randomBytes(size).toString("hex")

export function dateDay(date: Date, timeZone: string) {
    return date.toLocaleString("en-US", {
        timeZone,
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    })
}
