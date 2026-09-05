import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
  type RouteObject,
} from "react-router-dom";
import { useSession } from "@/auth/session";
import { AppShell } from "@/components/AppShell";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { LoginRoute } from "@/routes/LoginRoute";
import { NotFoundRoute } from "@/routes/NotFoundRoute";
import { ConversationsRoute } from "@/features/conversations/ConversationsRoute";
import { ConversationDetailRoute } from "@/features/conversations/ConversationDetailRoute";
import { ConsumptionRoute } from "@/features/consumption/ConsumptionRoute";
import { LeadsRoute } from "@/features/leads/LeadsRoute";

function ProtectedLayout() {
  const { status } = useSession();
  const location = useLocation();

  if (status === "checking") {
    return <FullScreenLoader />;
  }
  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const appRoutes: RouteObject[] = [
  { path: "/login", element: <LoginRoute /> },
  {
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/conversations" replace /> },
      { path: "conversations", element: <ConversationsRoute /> },
      { path: "conversations/:leadPhone", element: <ConversationDetailRoute /> },
      { path: "leads", element: <LeadsRoute /> },
      { path: "consumption", element: <ConsumptionRoute /> },
      { path: "*", element: <NotFoundRoute /> },
    ],
  },
];

export const router = createBrowserRouter(appRoutes, { basename: "/admin" });
