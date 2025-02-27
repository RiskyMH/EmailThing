import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  type RouteObject,
} from "react-router-dom";
// import "./index.css";
import HomeRoutes from "./home/_routes"
import RootLayout from "./root-layout";
import ErrorPage from "./error";

const routes = ([
  { path: "*", element: <ErrorPage notFound /> },
  ...HomeRoutes,
] satisfies RouteObject[])
  .map(e => ({ errorElement: <ErrorPage />, ...e, }))

const router = createBrowserRouter(routes, {
  patchRoutesOnNavigation: async ({ matches, patch, path, signal }) => {
    if (path.startsWith("/docs")) {
      const { routes } = await import("./docs/_routes")
      if (routes) {
        patch(null, routes)
      }
    }

    else if (path.startsWith("/mail") || ["/settings", "/admin"].includes(path)) {
      const { routes } = await import("./app/_routes")
      if (routes) {
        patch(null, routes)
      }
    }
  }
});

const elem = document.getElementById("root")!;
const app = (
  <RootLayout>
    <RouterProvider router={router} />
  </RootLayout>
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}
