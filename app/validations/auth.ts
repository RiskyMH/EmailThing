import * as z from "zod"

export const userAuthSchema = z.object({
    username: z.string().min(4).max(15),
    password: z.string().min(8),
})