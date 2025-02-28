import { useHref, useNavigate, useSearchParams as useSearchParamsReact } from "react-router-dom";

export const usePathname = () => {
    const pathname = useHref({})
    return pathname
}

export const useRouter = () => {
    const navigate = useNavigate()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    return {
        navigate,
        pathname,
        searchParams,
        push: (path: string) => navigate(path),
        replace: (path: string) => navigate(path, { replace: true }),
    }
}

export const useSearchParams = () => {
    // const searchParams = useSearchParamsReact()
    // return searchParams

    // returns an object with .get
    const searchParams = useSearchParamsReact()
    return searchParams[0]
}

