import type { RouteObject } from "react-router-dom";
import Home from "./home";
import Pricing from "./pricing";
import { lazy, Suspense } from 'react';


const Docs = import('../docs/1-introduction')

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
    {
        path: "/docs",
        element: <Reload />,
        preferTemplate: "docs.html",
    },
    {
        path: "/mail/:mailboxId",
        element: <Reload />,
        preferTemplate: "app.html",
    },

] satisfies RouteObject[]


export default routes


function Reload() {
    const url = `${location.href}`
    history.back()
    location.href = url
    // location.reload()
    return null
}
