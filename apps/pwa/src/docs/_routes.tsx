import type { RouteObject } from "react-router-dom";
import Docs from "./1-introduction";
import CustomDomainDocs from "./2-custom-domain";

export const routes = [
    {
        path: "/docs",
        element: <Docs />,
    },
    {
        path: "/docs/custom-domain",
        element: <CustomDomainDocs />,
    },
] satisfies RouteObject[]


export default routes