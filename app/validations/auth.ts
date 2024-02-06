import * as z from "zod"

export const userAuthSchema = z.object({
    username: z.string()
        .min(4, "Username needs to be at least 4 characters")
        .max(15, "Username can't be longer than 15 characters")
        .regex(/^[a-zA-Z0-9]+$/, "Username can only contain letters and numbers"),

    password: z.string()
        .min(8, "Password needs to be at least 8 characters"),
})
