export interface Recipient {
    name: string | null,
    address: string,
    cc?: "cc" | "bcc" | null,
}

export interface SaveActionProps {
    body?: string,
    subject?: string,
    from?: string,
    to?: Recipient[],
    html?: string,
    preview?: string,
    headers?: { key: string, value: string }[]
}


export function getData(data: FormData): SaveActionProps {
    const body = data.get("body") as string | null
    const html = data.get("html") as string | null
    const preview = data.get("preview") as string | null
    const subject = data.get("subject") as string | null
    const from = data.get("from") as string | null

    const tos = data.getAll("to") as string[]
    const to = tos.length && tos.map(to => {
        const name = (data.get(`to:${to}:name`) || null) as string | null
        const address = data.get(`to:${to}:address`) as string | null
        const cc = (data.get(`to:${to}:cc`) || null) as "cc" | "bcc" | null

        if (!address) return
        return { name, address, cc }
    }).filter(e => !!e) || undefined

    const headerss = data.getAll("header") as string[]
    const headers = headerss.length && headerss.map(id => {
        const key = (data.get(`header:${id}:name`) || "") as string
        const value = (data.get(`header:${id}:value`) || "") as string

        if (!key) return
        return { key, value }
    }).filter(e => !!e) || undefined

    return {
        body: body ?? undefined,
        subject: subject ?? undefined,
        from: from ?? undefined,
        to,
        html: html ?? undefined,
        preview: preview ?? undefined,
        headers
    }
}

export function makeHtml(html: string) {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><meta name="color-scheme" content="light dark"/><meta name="supported-color-schemes" content="light dark"/><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><style type="text/css" rel="stylesheet" media="all">:root{color-scheme: light dark !important;supported-color-schemes: light dark !important;font-family:Arial, sans-serif}</style><style>@media(prefers-color-scheme:dark){.main{background-color:rgb(51,51,51) !important;color:white !important;}}</style><style>blockquote{border-left: 3px solid #cccccc80;padding-left:10px;}</style><html><body style="font-family: Arial, sans-serif;"><div class="main" style="background-color:rgb(241,240,245);color:black;padding:20px;border-radius:0.5rem;height:100%;">${html}</div></body></html>`
}