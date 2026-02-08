import * as z from "zod/mini";

export const userAuthSchema = z.object({
  username: z.string().check(
    z.minLength(4, { error: "Username must be at least 4 characters long" }),
    z.maxLength(20, { error: "Username must be at most 20 characters long" }),
    z.regex(/^[a-zA-Z0-9]+$/, { error: "Username can only contain letters and numbers" })
  ),
  password: z.string().check(z.minLength(8, { error: "Password must at least 8 characters long" })),
});

export const emailSchema = z.object({
  email: z.email({ error: "Invalid email address" }).check(
    z.regex(/^[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, { error: "Invalid email format" }),
    z.maxLength(64, { error: "Email must be at most 64 characters long" }),
    z.minLength(5, { error: "Email must be at least 5 characters long" })
  ),
});
