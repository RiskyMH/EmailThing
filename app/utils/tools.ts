
export function dateDay(date: Date, timeZone: string) {
    return date.toLocaleString([], {
        timeZone,
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    })
}

export async function gravatar(email: string) {
    const myText = new TextEncoder().encode(email.toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', myText);
    const hashArray = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    return `https://www.gravatar.com/avatar/${hashArray}?d=404`
}


const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
})

const DIVISIONS = [
    { amount: 60, name: "seconds" },
    { amount: 60, name: "minutes" },
    { amount: 24, name: "hours" },
    { amount: 7, name: "days" },
    { amount: 4.34524, name: "weeks" },
    { amount: 12, name: "months" },
    { amount: Number.POSITIVE_INFINITY, name: "years" },
]

export function formatTimeAgo(date: Date) {
    let duration = (date.valueOf() - Date.now()) / 1000

    for (const division of DIVISIONS) {
        if (Math.abs(duration) < division.amount) {
            return formatter.format(Math.round(duration), division.name as any)
        }
        duration /= division.amount
    }
}
