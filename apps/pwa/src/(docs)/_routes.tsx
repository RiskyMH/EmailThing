import { Title } from "@/components/title";
import { Outlet } from "react-router-dom";
import AboutPage from "./1.1-introduction";
import CustomDomainPage from "./1.2-custom-domain";
import DocsLayout from "./layout";

export const routes = [
  {
    path: "/docs",
    element: (
      <DocsLayout>
        <Outlet />
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
