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

const router = createBrowserRouter(routes, {
  patchRoutesOnNavigation: async ({ matches, patch, path, signal }) => {
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
});

// biome-ignore lint/style/noNonNullAssertion: <explanation>
ReactDOM.createRoot(document.getElementById("root")!).render(
  <RootLayout>
    <RouterProvider router={router} />
  </RootLayout>,
);
