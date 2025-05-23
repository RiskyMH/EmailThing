import db, { Email, Mailbox, MailboxAlias, Stats, User } from "@/db";
import { and, count, gte, inArray, lte } from "drizzle-orm";
import { notFound } from "next/navigation";

export const metadata = {
    title: "Stats",
    description: "View some stats that could be of interest to anyone.",
    alternates: {
        canonical: "https://emailthing.app/stats",
    },
};

// todo: maybe re-enable edge
// export const runtime = "edge";

// Utility function to get a date offset by a specific number of days
const getDateOffset = (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};

// Generate last 30 days formatted dates
function getLastNDaysDates(n: number, offset = 0): string[] {
    return Array.from({ length: n }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - offset - i);
        return date.toISOString().slice(0, 10);
    });
}

const thirtyDaysAgo = getDateOffset(30);
const sixtyDaysAgo = getDateOffset(60);
const last30DaysDates = getLastNDaysDates(30);
const last30DaysPrevDates = getLastNDaysDates(30, 30);

async function fetchAllStars() {
    const stars: Date[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(
            `https://api.github.com/repos/riskymh/emailthing/stargazers?per_page=100&page=${page}`,
            {
                next: { revalidate: 60 },
                headers: {
                    Accept: "application/vnd.github.v3.star+json",
                },
            },
        );

        const data = await response.json();
        if (data.length > 0) {
            stars.push(...data.map((e: Record<string, any>) => new Date(e.starred_at)));
            page++;
        } else {
            hasMore = false;
        }
    }

    return stars;
}

export default async function StatsPage(props: { searchParams?: Promise<{ view: string }> }) {
    const searchParams = await props.searchParams;
    if (searchParams?.view !== "true") return notFound();

    const [githubStars, [stats, statsPrev]] = await Promise.all([
        fetchAllStars(),
        db.batchUpdate([
            db.query.Stats.findMany({
                where: inArray(Stats.time, last30DaysDates as any[]),
            }),
            db.query.Stats.findMany({
                where: inArray(Stats.time, last30DaysPrevDates as any[]),
            }),
        ]),
    ]);

    const latestStars = githubStars.filter((date) => date >= thirtyDaysAgo && date <= new Date());
    const latestStarsPrev = githubStars.filter((date) => date >= sixtyDaysAgo && date <= thirtyDaysAgo);
    const starsChange = ((latestStars.length - latestStarsPrev.length) / latestStarsPrev.length) * 100;

    const aggregateStats = (data: typeof stats) =>
        data.reduce(
            (acc, { type, value }) => {
                acc[type] = (acc[type] || 0) + value;
                return acc;
            },
            {} as Record<(typeof stats)[0]["type"], number>,
        );

    const latestStats = aggregateStats(stats);
    const latestStatsPrev = aggregateStats(statsPrev);

    const latestStatsChange = Object.fromEntries(
        Object.entries(latestStats).map(([type, value]) => {
            const prevValue = latestStatsPrev[type as keyof typeof latestStats];
            const change = prevValue ? ((value - prevValue) / prevValue) * 100 : "N/A";
            return [type, typeof change === "number" ? change.toFixed(2) : change];
        }),
    );

    const [
        [{ count: users }],
        [{ count: latestUsers }],
        [{ count: latestUsersPrev }],
        [{ count: allEmails }],
        [{ count: allMailboxes }],
        [{ count: allAliases }],
    ] = await db.batchFetch([
        db.select({ count: count() }).from(User),
        db
            .select({ count: count() })
            .from(User)
            .where(gte(User.createdAt, new Date(last30DaysDates.at(-1)!))),
        db
            .select({ count: count() })
            .from(User)
            .where(
                and(
                    lte(User.createdAt, new Date(last30DaysDates.at(-1)!)),
                    gte(User.createdAt, new Date(last30DaysPrevDates.at(-1)!)),
                ),
            ),
        db.select({ count: count() }).from(Email),
        db.select({ count: count() }).from(Mailbox),
        db.select({ count: count() }).from(MailboxAlias),
    ]);

    const usersChange = ((latestUsers - latestUsersPrev) / latestUsersPrev) * 100;
    // todo: more stats + prob also do last 30days also

    return (
        <section className="container flex min-h-screen flex-col gap-6 py-8 md:max-w-[64rem] md:py-12 ">
            <div className="mx-auto flex w-full flex-col gap-4 md:max-w-[58rem]">
                <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Stats</h2>
                <p className="max-w-[85%] text-muted-foreground leading-normal sm:text-lg sm:leading-7">
                    View some stats that are only interesting to the creator.
                </p>
            </div>
            <div className="grid w-full flex-wrap gap-5 sm:grid-cols-2 sm:gap-7 md:grid-cols-3 lg:grid-cols-3">
                <div className="flex w-full flex-col gap-2 rounded-lg bg-secondary p-5 sm:p-7">
                    <span className="flex font-bold text-3xl">
                        {latestStars.length}
                        <span className="self-end text-muted-foreground text-xl">/{githubStars.length}</span>
                        <span
                            className={`${starsChange > 1 ? "text-green-500" : "text-red-500/75"} ms-auto self-center font-normal text-sm`}
                        >
                            ({starsChange.toFixed(0)}%)
                        </span>
                    </span>
                    <span className="text-muted-foreground ">
                        <span className="font-bold">GitHub stars</span> in last 30 days
                    </span>
                </div>
                <div className="flex w-full flex-col gap-2 rounded-lg bg-secondary p-5 sm:p-7">
                    <span className="flex font-bold text-3xl">
                        {latestStats["receive-email"]}
                        <span
                            className={`${Number.parseInt(latestStatsChange["receive-email"]) >= 1 ? "text-green-500" : "text-red-500/75"} ms-auto self-center font-normal text-sm`}
                        >
                            ({latestStatsChange["receive-email"]}%)
                        </span>
                    </span>
                    <span className="text-muted-foreground ">
                        <span className="font-bold">Emails received</span> in last 30 days
                    </span>
                </div>
                <div className="flex w-full flex-col gap-2 rounded-lg bg-secondary p-5 sm:p-7">
                    <span className="flex font-bold text-3xl">
                        {latestStats["send-email"]}
                        <span
                            className={`${Number.parseInt(latestStatsChange["send-email"]) >= 1 ? "text-green-500" : "text-red-500/75"} ms-auto self-center font-normal text-sm`}
                        >
                            ({latestStatsChange["send-email"]}%)
                        </span>
                    </span>
                    <span className="text-muted-foreground ">
                        <span className="font-bold">Emails sent</span> in last 30 days
                    </span>
                </div>
                <div className="flex w-full flex-col gap-2 rounded-lg bg-secondary p-5 sm:p-7">
                    <span className="flex font-bold text-3xl">
                        {latestUsers}
                        <span className="self-end text-muted-foreground text-xl">/{users}</span>
                        <span
                            className={`${usersChange > 1 ? "text-green-500" : "text-red-500/75"} ms-auto self-center font-normal text-sm`}
                        >
                            ({usersChange.toFixed(0)}%)
                        </span>
                    </span>
                    <span className="text-muted-foreground ">
                        <span className="font-bold">Users created</span> in last 30 days
                    </span>
                </div>
                <div className="flex w-full flex-col gap-2 rounded-lg bg-secondary p-5 sm:p-7">
                    <span className="flex font-bold text-3xl">{allEmails.toLocaleString()}</span>
                    <span className="text-muted-foreground ">Total emails stored</span>
                </div>
                <div className="flex w-full flex-col gap-2 rounded-lg bg-secondary p-5 sm:p-7">
                    <span className="flex font-bold text-3xl">{allMailboxes}</span>
                    <span className="text-muted-foreground ">Total mailboxes</span>
                </div>
                <div className="flex w-full flex-col gap-2 rounded-lg bg-secondary p-5 sm:p-7">
                    <span className="flex font-bold text-3xl">{allAliases}</span>
                    <span className="text-muted-foreground ">Total aliases</span>
                </div>
            </div>
            <script
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        description: "View some stats that could be of interest to anyone!",
                    }),
                }}
            />
        </section>
    );
}
