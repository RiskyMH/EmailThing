import Link from "next/link"

import { cn } from "@/utils/tw"
import { buttonVariants } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"
import { notFound } from "next/navigation"
import db, { Stats, User } from "@/db"
import { and, count, gte, inArray, lte } from "drizzle-orm"

export const metadata = {
  title: "Stats",
  description: "View some stats that could be of interest to anyone.",
  alternates: {
    canonical: "https://emailthing.xyz/stats",
  },
}

const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(new Date().getDate() - 30);

const sixtyDaysAgo = new Date()
sixtyDaysAgo.setDate(new Date().getDate() - 60);

function getLast30DaysDates(offset = 0) {
  const today = new Date();
  const dates = [] as `${number}-${number}-${number}`[];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate((today.getDate() - offset) - i);
    const formattedDate = date.toISOString().slice(0, 10);
    dates.push(formattedDate as any);
  }

  return dates;
}
const last30DaysDates = getLast30DaysDates();
const last30DaysPrevDates = getLast30DaysDates(30);

export default async function PricingPage({ searchParams }: { searchParams?: { view: string } }) {
  if (searchParams?.view != "true") return notFound()

  const githubStars = (await (await fetch("https://api.github.com/repos/riskymh/emailthing/stargazers?per_page=10000&page=0", {
    next: { revalidate: 60 },
    headers: {
      Accept: "application/vnd.github.v3.star+json"
    }
  })).json()).map((e: Record<string, any>) => new Date(e.starred_at)) as Date[];

  const latestStars = githubStars.filter(date => date >= thirtyDaysAgo && date <= new Date())
  const latestStarsPrev = githubStars.filter(date => date >= sixtyDaysAgo && date <= thirtyDaysAgo)
  const starsChange = ((latestStars.length - latestStarsPrev.length) / latestStarsPrev.length) * 100;

  const stats = await db.query.Stats.findMany({
    where: inArray(Stats.time, last30DaysDates),
  })
  const statsPrev = await db.query.Stats.findMany({
    where: inArray(Stats.time, last30DaysPrevDates),
  })

  const latestStats = stats.reduce((acc, stat) => {
    acc[stat.type] = (acc[stat.type] || 0) + stat.value;
    return acc;
  }, {} as Record<typeof stats[0]["type"], number>);

  const latestStatsPrev = statsPrev.reduce((acc, stat) => {
    acc[stat.type] = (acc[stat.type] || 0) + stat.value;
    return acc;
  }, {} as Record<typeof stats[0]["type"], number>);

  const latestStatsChange = {} as Record<typeof stats[0]["type"], string>;
  for (const t in latestStats) {
    const type = t as typeof stats[0]["type"]
    if (latestStatsPrev[type]) {
      const change = ((latestStats[type] - latestStatsPrev[type]) / latestStatsPrev[type]) * 100;
      latestStatsChange[type] = change.toFixed(2);
    } else {
      latestStatsChange[type] = "N/A";
    }
  }

  const users = (await db.select({ count: count() }).from(User))[0].count
  const latestUsers = (await db
    .select({ count: count() })
    .from(User)
    .where(gte(User.createdAt, new Date(last30DaysDates.at(-1)!)))
  )[0].count
  const latestUsersPrev = (await db
    .select({ count: count() })
    .from(User)
    .where(and(
      lte(User.createdAt, new Date(last30DaysDates.at(-1)!)),
      gte(User.createdAt, new Date(last30DaysPrevDates.at(-1)!))
    ))
    )[0].count

  const usersChange = ((latestUsers - latestUsersPrev) / latestUsersPrev) * 100;

  return (
    <section className="container flex flex-col gap-6 py-8 md:max-w-[64rem] md:py-12 min-h-screen ">
      <div className="mx-auto flex w-full flex-col gap-4 md:max-w-[58rem]">
        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Stats
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          View some stats that are only interesting to the creator.
        </p>
      </div>
      <div className="grid gap-5 sm:gap-7 flex-wrap w-full sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
        <div className="bg-secondary rounded-lg p-5 sm:p-7 w-full flex flex-col gap-2">
          <span className="text-3xl font-bold flex">
            {latestStars.length}<span className="text-muted-foreground text-xl self-end">/{githubStars.length}</span>
            <span className={`${starsChange > 1 ? "text-green-500" : "text-red-500/75"} text-sm font-normal self-center ms-auto`}>({starsChange.toFixed(0)}%)</span>
          </span>
          <span className="text-muted-foreground ">
            <span className="font-bold">GitHub stars</span> in last 30 days
          </span>
        </div>
        <div className="bg-secondary rounded-lg p-5 sm:p-7 w-full flex flex-col gap-2">
          <span className="text-3xl font-bold flex">
            {latestStats["receive-email"]}
            <span className={`${parseInt(latestStatsChange["receive-email"]) >= 1 ? "text-green-500" : "text-red-500/75"} text-sm font-normal self-center ms-auto`}>
              ({latestStatsChange["receive-email"]}%)
            </span>
          </span>
          <span className="text-muted-foreground ">
            <span className="font-bold">emails received</span> in last 30 days
          </span>
        </div>
        <div className="bg-secondary rounded-lg p-5 sm:p-7 w-full flex flex-col gap-2">
          <span className="text-3xl font-bold flex">
            {latestStats["send-email"]}
            <span className={`${parseInt(latestStatsChange["send-email"]) >= 1 ? "text-green-500" : "text-red-500/75"} text-sm font-normal self-center ms-auto`}>
              ({latestStatsChange["send-email"]}%)
            </span>
          </span>
          <span className="text-muted-foreground ">
            <span className="font-bold">emails sent</span> in last 30 days
          </span>
        </div>
        <div className="bg-secondary rounded-lg p-5 sm:p-7 w-full flex flex-col gap-2">
          <span className="text-3xl font-bold flex">
            {latestUsers}<span className="text-muted-foreground text-xl self-end">/{users}</span>
            <span className={`${usersChange > 1 ? "text-green-500" : "text-red-500/75"} text-sm font-normal self-center ms-auto`}>
              ({usersChange.toFixed(0)}%)
            </span>
          </span>
          <span className="text-muted-foreground ">
            <span className="font-bold">users created</span> in last 30 days
          </span>
        </div>
      </div>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "description": "View some stats that could be of interest to anyone!",
          })
        }} />
    </section>
  )
}