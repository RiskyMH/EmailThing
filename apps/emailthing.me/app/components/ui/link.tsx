import { usePathname } from "next/navigation";

export * from "next/link";
export { default } from "next/link";


export function useMatch(href: string) {
    const pathname = usePathname();
    return new RegExp(`^${href}`).test(pathname);
}