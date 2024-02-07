import * as z from "zod"

export const userAuthSchema = z.object({
    username: z.string()
        .min(4, "Username needs to be at least 4 characters")
        .max(20, "Username can't be longer than 20 characters")
        .regex(/^[a-zA-Z0-9]+$/, "Username can only contain letters and numbers"),

    password: z.string()
        .min(8, "Password needs to be at least 8 characters"),
})
export const emailSchema = z.object({
    email: z.string()
        .email("Invalid email")
        .regex(/^[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Email can only contain letters and numbers"),
})