import { gravatar } from "@/utils/tools";
import swr from "swr";
import { getSvgl } from "./macros" with { type: "macro" }

export const useGravatar = (email: string) => {
    const { data } = swr(`/api/gravatar?email=${email}&`, () => gravatar(email), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        // revalidateOnMount: false,
    })
    
    return data
}

const svgl = await getSvgl()

export const useEmailImage = (email: string) => {
    const { data } = swr(`/api/email-image?email=${email}`, async () => {
        const g = await gravatar(email)
        const exists = await fetch(g).then(res => res.ok)
        if (exists) return g

        const domain = email.split("@")[1]
        const match = svgl[domain]
        if (match) return match

        return undefined
    }, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        // revalidateOnMount: false,
    })
    return data as string | undefined
}