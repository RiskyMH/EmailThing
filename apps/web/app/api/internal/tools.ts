export const allowedOrigins = [
    "https://emailthing.app",
    "https://pwa.emailthing.app",
    "https://*.emailthing.app",
    "http://localhost:3000",
    "http://localhost:1234",
    "https://emailthing.pages.dev",
    "https://*.emailthing.pages.dev",
]


export const isValidOrigin = (origin: string) => {
    if (origin.endsWith(".emailthing.pages.dev") || origin.endsWith(".emailthing.app")) {
        return true
    }
    return allowedOrigins.includes(origin)
}
