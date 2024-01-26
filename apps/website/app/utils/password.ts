import "server-only"
import { pbkdf2Sync } from "node:crypto"
import { randomText } from "./tools"

const algorithm = "sha512"

const pwdHash = (password: string, salt: string) =>
    pbkdf2Sync(password, salt, 1000, 64, algorithm)
        .toString("hex")

export const createPasswordHash = async (password: string) => {
    const salt = await randomText(16)
    const hash = pwdHash(password, salt)

    return `${algorithm}:${salt}:${hash}`
}

export const verifyPassword = (
    proposedPassword: string,
    passwordHash: string,
) => {
    const [alg, salt, hash] = passwordHash.split(":")
    if (!alg || !salt || !hash) return false
    if (alg !== algorithm) return false

    const proposedHash = pwdHash(proposedPassword, salt)

    return proposedHash === hash
}