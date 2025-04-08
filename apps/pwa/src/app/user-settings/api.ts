
import { MappedPossibleData, MappedPossibleDataResponse } from "@/../app/api/internal/user-settings/route"
import { parseSync } from "@/utils/data/sync-user"
import { db } from "@/utils/data/db"



export default async function changeUserSettings<T extends keyof MappedPossibleData>(type: T, data: MappedPossibleData[T]): Promise<MappedPossibleDataResponse['message'] | { error: string }> {
    if (!navigator.onLine) return { error: "No internet connection" }
    try {
        const sync = (await db.localSyncData.toArray())[0]
        const response = await fetch(`${sync?.apiUrl || ""}/api/internal/user-settings?type=${type as string}`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Authorization": `${sync?.token}`
            }
        })
        if (!response.ok) {
            return response.json()
        }

        const res = await response.json() as MappedPossibleDataResponse
        if ("error" in res) return res


        if ("sync" in res) {
            const { sync: data } = res
            await parseSync(data)
        }

        return res?.message
    } catch (e) {
        console.error(e)
        return { error: "Failed to fetch" }
    }
}

