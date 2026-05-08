import { createBrowserRouter } from "react-router";
import HomePage from "./pages/HomePage";
import ComposePage from "./pages/ComposePage";
import ArchivePage from "./pages/ArchivePage";
import CapsuleDetailPage from "./pages/CapsuleDetailPage";
import SettingsPage from "./pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/compose",
    Component: ComposePage,
  },
  {
    path: "/compose/:id",
    Component: ComposePage,
  },
  {
    path: "/archive",
    Component: ArchivePage,
  },
  {
    path: "/capsules/:id",
    Component: CapsuleDetailPage,
  },
  {
    path: "/settings",
    Component: SettingsPage,
  },
]);
