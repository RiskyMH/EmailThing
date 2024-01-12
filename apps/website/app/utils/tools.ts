import crypto from "crypto"

export const randomText = (size = 16) =>
    crypto.randomBytes(size).toString("hex")

export function dateMonth(date: Date): `${number}-${number}` {
    return `${date.getFullYear()}-${date.getMonth() + 1}`
}
