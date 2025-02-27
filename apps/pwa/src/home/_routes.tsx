import type { RouteObject } from "react-router-dom";
import Home from "./home";
import Pricing from "./pricing";
import { lazy, Suspense } from 'react';


export const routes = [
    {
        path: "/",
        element: <Home />,
    },
    {
        path: "/home",
        element: <Home />,
    },
    {
        path: "/pricing",
        element: <Pricing />,
    },
    // {
    //     path: "/docs",
    //     lazy: async () => {
    //         const { routes } = await import("../docs/_routes")
    //         return {
    //             element: routes.find(e => e.path === "/docs")?.element,
    //             loader: async () => {}
    //         }
    //     },
    //     preferTemplate: "docs.html",
    // },
    // {
    //     path: "/docs/:path",
    //     lazy: async () => {
    //         const { routes } = await import("../docs/_routes")
    //         return {
    //             element: routes.find(e => e.path )?.element,
    //             loader: async () => {}
    //         }
    //     },
    //     preferTemplate: "docs.html",
    // },
    // {
    //     path: "/docs",
    //     element: <Reload />,
    //     preferTemplate: "docs.html",
    // },
    // {
    //     path: "/mail/:mailboxId",
    //     element: <Reload />,
    //     preferTemplate: "app.html",
    // },

] satisfies RouteObject[]


export default routes


function Reload() {
    const url = `${location.href}`
    history.back()
    location.href = url
    // location.reload()
    return null
}
