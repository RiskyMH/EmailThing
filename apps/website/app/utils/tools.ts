import { randomBytes, createHash } from "crypto"

export const randomText = (size = 16) =>
    randomBytes(size).toString("hex")

export function dateDay(date: Date, timeZone: string) {
    return date.toLocaleString("en-US", {
        timeZone,
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    })
}

export function gravatar(email: string) {
    const hash = createHash("md5")
        .update(email.toLowerCase())
        .digest("hex")
    return `https://www.gravatar.com/avatar/${hash}?d=404`
}

export function relativeDate(date: Date) {
    const diff = Math.round((Date.now() - date.valueOf()) / 1000);

    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = month * 12;

    if (diff < 30) {
        return "just now";
    } else if (diff < minute) {
        return diff + " seconds ago";
    } else if (diff < 2 * minute) {
        return "a minute ago";
    } else if (diff < hour) {
        return Math.floor(diff / minute) + " minutes ago";
    } else if (Math.floor(diff / hour) == 1) {
        return "1 hour ago";
    } else if (diff < day) {
        return Math.floor(diff / hour) + " hours ago";
    } else if (diff < day * 2) {
        return "yesterday";
    } else if (diff < week) {
        return week + " days ago";
    } else if (diff < month) {
        return Math.floor(diff / week) + " weeks ago";
    } else if (diff < year) {
        return Math.floor(diff / month) + " months ago";
    } else {
        return Math.floor(diff / year) + " years ago";
    }
}