import CustomDomainPage from "@/(docs)/docs/custom-domain/page";
import DocsLayout2 from "@/(docs)/docs/layout";
import AboutPage from "@/(docs)/docs/page";
import { Outlet, type RouteObject } from "react-router-dom";
import DocsLayout from "./layout";

export const routes = [
  {
    path: "/docs",
    element: (
      <DocsLayout>
        <DocsLayout2>
          <Outlet />
        </DocsLayout2>
      </DocsLayout>
    ),
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
] satisfies RouteObject[];

export default routes;
