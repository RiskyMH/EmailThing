export async function getGithubStars() {
    if (typeof window === "undefined" && process.platform === "win32") return "∞"
    return (await (await fetch("https://api.github.com/repos/RiskyMH/EmailThing")).json()).stargazers_count
}
