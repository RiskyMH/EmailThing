export async function getSvgl(): Promise<Record<string, string>> {
    if (typeof window === "undefined" && process.platform === "win32") return ({})

    const fn = async () => {
        try {
            const res = await (await fetch("https://api.svgl.app/")).json()
            const svgl = res.filter((svgl: any) => svgl.url.match(/^https?:\/\/[^\/]+\/$/) && svgl.route)
            const mapping = svgl.reduce((acc: any, svgl: any) => {
                const url = svgl.url.replace("https://", "").replace("/", "").replace("www.", "")
                acc[url] = typeof svgl.route === "string" ? svgl.route : svgl.route.dark ?? svgl.route.light
                return acc
            }, {})
            return mapping
        } catch (e) {
            console.error(e)
            return {}
        }
    }

    if (import.meta.hot) {
        return (import.meta.hot.data.svgl ??= await fn())
    }
    return await fn()
}
