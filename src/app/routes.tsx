import { createBrowserRouter } from "react-router";
import HomePage from "./pages/HomePage";
import ComposePage from "./pages/ComposePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/compose",
    Component: ComposePage,
  },
]);
