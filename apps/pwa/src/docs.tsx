import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, type RouteObject } from "react-router-dom";
import DocsRoutes from "./(docs)/_routes";
import ErrorPage from "./error";
import "./index.css";
import RootLayout from "./root-layout";

const routes = (
  [{ path: "*", element: <ErrorPage notFound /> }, ...DocsRoutes] satisfies RouteObject[]
).map((e) => ({
  errorElement: <ErrorPage />,
  ...e,
}));

const router = createBrowserRouter(routes, {
  patchRoutesOnNavigation: async ({ matches, patch, path, signal }) => {
    if (path === "/docs/api") return void (window.location.href = "/docs/api");
    if (["/", "/pricing", "/home", "/login", "/register"].includes(path)) {
      const { routes } = await import("./(home)/_routes");
      if (routes) {
        patch(null, routes);
      }
    } else if (
      path.startsWith("/mail") ||
      path.startsWith("/settings") ||
      path.startsWith("/admin")
    ) {
      const { routes } = await import("./(app)/_routes");
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
