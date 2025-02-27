import { Link as Link2 } from "react-router-dom";


export default function Link({ href, ...rest }: { href: string } & Omit<React.ComponentProps<typeof Link2>, "to">) {
    return <Link2 {...rest} to={href} onClick={e => {
        // scroll to top
        window.scrollTo(0, 0)
        if (rest.onClick) rest.onClick(e)
    }} />
}
