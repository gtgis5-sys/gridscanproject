import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AnalysisProvider } from "../lib/AnalysisContext";

export const Route = createRootRoute({
  component: () => (
    <AnalysisProvider>
      <Outlet />
    </AnalysisProvider>
  ),
});
