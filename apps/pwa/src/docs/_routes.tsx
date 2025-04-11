import { type RouteObject, Outlet } from "react-router-dom";
import Docs from "./1-introduction";
import CustomDomainDocs from "./2-custom-domain";
import DocsLayout from "./layout"
import DocsLayout2 from "@/(docs)/docs/layout"
import AboutPage from "@/(docs)/docs/page"
import CustomDomainPage from "@/(docs)/docs/custom-domain/page"

export const routes = [
    {
        path: "/docs",
        element: <DocsLayout><DocsLayout2><Outlet /></DocsLayout2></DocsLayout>,
        children: [
            {
                path: "/docs",
                element: <AboutPage />,
            },
            {
                path: "/docs/custom-domain",
                element: <CustomDomainPage />,
            },
        ],
    },
] satisfies RouteObject[]


export default routes
