import useSWR from "swr";

const dns = async (name: string, type: string) => {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
        headers: {
            accept: "application/dns-json",
        },
    });
    const json = await res.json();

    if (json.Status !== 0) return null;

    return json.Answer;
};

export const getMX = async (domain: string): Promise<string[] | null> => {
    const mx = await dns(domain, "mx");
    const mxRecords = mx?.filter((a: any) => a.type === 15) || [];
    if (mxRecords.length) return mxRecords;

    const aaaa = await dns(domain, "aaaa");
    const aaaaRecords = aaaa?.filter((a: any) => a.type === 28) || [];
    if (aaaaRecords.length) return mxRecords;

    const a = await dns(domain, "a");
    const aRecords = aaaa?.filter((a: any) => a.type === 1) || [];
    if (aRecords.length) return mxRecords;

    return null;
};

export default function useMX(domain: string) {
    return useSWR(`/mx/${domain}`, () => getMX(domain), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
    });
}
