import * as ReactDOM from "react-dom/client";
import type { RouteObject } from "react-router-dom";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import AppRoutes from "./(app)/_routes";
import ErrorPage from "./error";
import RootLayout from "./root-layout";

const routes = (
  [{ path: "*", element: <ErrorPage notFound /> }, ...AppRoutes] satisfies RouteObject[]
).map((e) => ({
  errorElement: <ErrorPage />,
  ...e,
}));

const isPwaBase = typeof window !== "undefined" && window.location.pathname.startsWith('/pwa');

const router = createBrowserRouter(routes, {
  patchRoutesOnNavigation: async ({ matches, patch, path, signal }) => {
    if (isPwaBase && path.startsWith("/pwa")) path = path.slice('/pwa'.length) || '/';

    if (["/", "/pricing", "/home", "/login", "/register"].includes(path)) {
      const { routes } = await import("./(home)/_routes");
      if (routes) {
        patch(null, routes);
      }
    }

    if (path.startsWith("/docs")) {
      if (path === "/docs/api") return void (window.location.href = "/docs/api");
      const { routes } = await import("./(docs)/_routes");
      if (routes) {
        patch(null, routes);
      }
    }
  },
  basename: isPwaBase ? '/pwa' : undefined,
});

// biome-ignore lint/style/noNonNullAssertion: <explanation>
ReactDOM.createRoot(document.getElementById("root")!).render(
  <RootLayout>
    <RouterProvider router={router} />
  </RootLayout>,
);
