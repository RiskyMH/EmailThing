export async function getGithubStars() {
    if (typeof window === "undefined" && process.platform === "win32") return "∞"
    
    const fn = async () => (await (await fetch("https://api.github.com/repos/RiskyMH/EmailThing")).json()).stargazers_count
    
    if (import.meta.hot) {
        return (import.meta.hot.data.githubStars ??= await fn())
    }
    return await fn()
}


// BELOW IS JUST GETTING AND SHOWING SPONSORS
// not that related to pricing tbh

function parseSponsors(html: string) {
    const users = [];

    const regex = /<a[^>]*href="\/([^"]+)"[^>]*>\s*<img[^>]*src="([^"]+)"[^>]*alt="[^"]*"\s*\/>/g;
    let match: RegExpExecArray | null;

    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    while ((match = regex.exec(html)) !== null) {
        const username = match[1];
        const avatar = match[2];
        users.push({ username, avatar, name: undefined });
    }

    return users;
}


async function getActiveSponsors(): Promise<{ username: string; avatar: string; name?: string }[]> {
    if (!process.env.GITHUB_PAT) {
        return fetch("https://github.com/sponsors/riskymh/sponsors_partial?filter=active")
            .then((e) => e.text())
            .then(parseSponsors);
    }

    const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
            authorization: `token ${process.env.GITHUB_PAT}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            query: `{ user(login: \"riskymh\") { ... on Sponsorable { sponsors(first: 100) { totalCount nodes { ... on User { login name avatarUrl } ... on Organization { login name avatarUrl } } } } } } }`,
        }),
    });

    const body = await res.json();

    return body.data.user.sponsors.nodes.map(
        (e: Record<string, string>) =>
            ({
                username: e.login,
                name: e.name,
                avatar: e.avatarUrl,
            }) as const,
    );
}


export const getSponsors = async () => {

    const fn = async () => {
        const [active, inactive] = await Promise.all([
            getActiveSponsors(),

        fetch("https://github.com/sponsors/riskymh/sponsors_partial?filter=inactive")
            .then((e) => e.text())
            .then(parseSponsors),
    ]);

    return [
        ...active.map((sponsor) => ({
            ...sponsor,
            type: "current" as const,
        })),

        ...inactive.map((sponsor) => ({
                ...sponsor,
                type: "past" as const,
            })),
        ];
    }

    if (typeof window === "undefined" && process.platform === "win32") return [] as Awaited<ReturnType<typeof fn>>

    if (import.meta.hot) {
        return (import.meta.hot.data.sponsors ??= await fn()) as Awaited<ReturnType<typeof fn>>
    }
    return await fn() as Awaited<ReturnType<typeof fn>>
}