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
