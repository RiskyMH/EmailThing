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


const imgExists = async (url: string) => {
    try {
        const img = new Image()
        img.src = url
        return new Promise((resolve, reject) => {
            img.onload = () => resolve(true)
            img.onerror = () => resolve(false)
        })
    } catch (e) {
        return false
    }
}


export const useEmailImage = (email: string) => {
    const { data } = swr(`/api/email-image?email=${email}`, async () => {
        const g = await gravatar(email)
        if (await imgExists(g)) return g

        const domain = email.split("@")[1]
        let match = svgl[domain]
        if (match) {
            if (match.startsWith(":")) {
                match = `https://svgl.app/library/${match.slice(1)}.svg`
            }
            if (await imgExists(match)) return match
        }

        // just be gravatar if all else fails
        return g
    }, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        // revalidateOnMount: false,
    })
    return data as string | undefined
}