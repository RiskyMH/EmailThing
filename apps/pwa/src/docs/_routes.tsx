import CustomDomainPage from "@/(docs)/docs/custom-domain/page";
import DocsLayout2 from "@/(docs)/docs/layout";
import AboutPage from "@/(docs)/docs/page";
import { Outlet, type RouteObject } from "react-router-dom";
import DocsLayout from "./layout";
import { Title } from "@/components/title";

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
        element: <><AboutPage /><Title title="About • EmailThing Docs" /></>,
        meta: {
          title: "EmailThing Docs",
          ogTitle: "EmailThing Documentation",
          description: "The many features that EmailThing has",
          canonical: "https://emailthing.app/docs",
          siteName: "EmailThing",
        }
      },
      {
        path: "/docs/custom-domain",
        element: <><CustomDomainPage /><Title title="Custom Domain • EmailThing Docs" /></>,
        meta: {
          title: "Custom Domain • EmailThing Docs",
          ogTitle: "Custom Domain",
          description: "How to add your custom domain to a mailbox",
          canonical: "https://emailthing.app/docs/custom-domain",
          siteName: "EmailThing",
        }
      },
    ],
  },
] satisfies RouteObject[];

export default routes;
