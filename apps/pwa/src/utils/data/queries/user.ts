import { db } from "../db"


export async function getUser(userId: string) {
    const user = await db.user.get(userId)
    return user
}

export async function getMe() {
    // just get first user as in theory only one user exists
    const users = await db.user.filter(user => user.id !== "demo").first()
    return users
}


