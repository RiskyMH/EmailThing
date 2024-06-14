export interface Recipient {
    name: string | null,
    address: string,
    cc?: "cc" | "bcc" | null,
}

export interface SaveActionProps {
    body?: string,
    subject?: string,
    from?: string,
    to?: Recipient[]
}


export function getData(data: FormData): SaveActionProps {
    const body = data.get("body") as string | undefined
    const subject = data.get("subject") as string | undefined
    const from = data.get("from") as string | undefined

    const tos = data.getAll("to") as string[] | undefined
    const to = tos?.map(to => {
        const name = (data.get(`to:${to}:name`) || null) as string | null
        const address = data.get(`to:${to}:address`) as string | undefined
        const cc = (data.get(`to:${to}:cc`) || null) as "cc" | "bcc" | null

        if (!address) return
        return { name, address, cc }
    }).filter(e => !!e)

    return { body, subject, from, to }
}