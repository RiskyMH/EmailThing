import type { RouteObject } from "react-router-dom";
import Docs from "./1-introduction";
import CustomDomainDocs from "./2-custom-domain";
import DocsLayout from "@/(docs)/layout"
import DocsLayout2 from "@/(docs)/docs/layout"
import AboutPage from "@/(docs)/docs/page"
import CustomDomainPage from "@/(docs)/docs/custom-domain/page"

export const routes = [
    {
        path: "/docs",
        element: <DocsLayout><DocsLayout2>  <AboutPage />  </DocsLayout2></DocsLayout>,
    },
    {
        path: "/docs/custom-domain",
        element: <DocsLayout><DocsLayout2>  <CustomDomainPage />  </DocsLayout2></DocsLayout>,
    },

    // {
    //   path: "/docs",
    //   element: <AboutPage />,
    // },
] satisfies RouteObject[]


export default routes
