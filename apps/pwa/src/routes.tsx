import type { RouteObject } from "react-router-dom";

import AppRoutes from "./app/_routes"
import DocsRoutes from "./docs/_routes"
import HomeRoutes from "./home/_routes"
import ErrorPage from "./error";

export const routes = ([
    { path: "*", element: <ErrorPage notFound /> },
    ...AppRoutes.map(e => ({ preferTemplate: "app.html", ...e })),
    ...DocsRoutes.map(e => ({ preferTemplate: "docs.html", ...e })),
    ...HomeRoutes.map(e => ({ preferTemplate: "home.html", ...e })),

] satisfies RouteObject[] & { preferTemplate?: string }[])
    .map(e => ({ errorElement: <ErrorPage />, ...e, }))


export default routes