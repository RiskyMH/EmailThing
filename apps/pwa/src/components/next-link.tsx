import { Link as Link2 } from "react-router-dom";


export default function Link({href, ...rest}){
  return <Link2 to={href} {...rest} aria-label="LOL" />
}
