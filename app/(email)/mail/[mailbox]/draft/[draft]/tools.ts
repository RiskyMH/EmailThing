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
preview?: string
}


export function getData(data: FormData): SaveActionProps {
const body = data.get("body") as string | undefined
const html = data.get("html") as string | undefined
const preview = data.get("preview") as string | undefined
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

return { body, subject, from, to, html, preview }
}

export function makeHtml(html: string) {
return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><meta name="color-scheme" content="light dark"/><meta name="supported-color-schemes" content="light dark"/><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><style type="text/css" rel="stylesheet" media="all">:root{color-scheme: light dark !important;supported-color-schemes: light dark !important;font-family:Arial, sans-serif}</style><style>@media(prefers-color-scheme:dark){.main{background-color:rgb(41,41,50) !important;color:white !important;}}</style><style>blockquote{border-left: 3px solid #cccccc80;padding-left:10px;}</style><html><body style="font-family: Arial, sans-serif;"><div class="main" style="background-color:rgb(241,240,245);color:black;padding:20px;border-radius:0.5rem;height:100%;">${html}</div></body></html>`
}