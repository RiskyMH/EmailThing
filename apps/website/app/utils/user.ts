import "server-only"
import { cache } from "react"
import { cookies } from "next/headers"
import { pbkdf2Sync } from "crypto"
import { jwtVerify, SignJWT } from "jose"
import { randomText } from "./tools"
import { env } from "./env"

// get from env or make random str
const JWTToken = new TextEncoder().encode(env.JWT_TOKEN || randomText(16))

export const getUserByToken = cache(
    async (token: string): Promise<string | null> => {
        const jwt = await jwtVerify(token, JWTToken, { algorithms: ["HS256"] })
        const userId = jwt.payload.sub

        if (!userId) return null

        return userId
    },
)

export const createUserToken = (user: { id: string }) => {
    return new SignJWT({ hello: "world" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setNotBefore(Date.now() / 1000 - 60_000)
        .setExpirationTime("7d")
        .setSubject(user.id.toString())
        .sign(JWTToken)
}

export const addUserTokenToCookie = async (user: { id: string }) => {
    const token = await createUserToken(user)
    cookies().set("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        path: "/",
    })
}

export const getCurrentUser = cache(async () => {
    const token = cookies().get("token")
    if (!token) return null
    try {
        return await getUserByToken(token.value)
    } catch (e) {
        console.log(e)
        return null
    }
})

const algorithm = "sha512"

const pwdHash = (password: string, salt: string) =>
    pbkdf2Sync(password, salt, 1000, 64, algorithm)
        .toString("hex")

export const createPasswordHash = async (password: string) => {
    const salt = randomText(16)
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