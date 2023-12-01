import crypto from "crypto"

export const randomText = (size = 16) =>
    crypto.randomBytes(size).toString("hex")