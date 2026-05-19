import { lazy, Suspense, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { LoginPage } from "../pages/LoginPage";

const Dashboard = lazy(() => import("./components/Dashboard").then((module) => ({ default: module.Dashboard })));
const Catalog = lazy(() => import("./components/Catalog").then((module) => ({ default: module.Catalog })));
const Analytics = lazy(() => import("./components/Analytics").then((module) => ({ default: module.Analytics })));
const AIInsights = lazy(() => import("./components/AIInsights").then((module) => ({ default: module.AIInsights })));
const Syncs = lazy(() => import("./components/Syncs").then((module) => ({ default: module.Syncs })));
const Balance = lazy(() => import("./components/Balance").then((module) => ({ default: module.Balance })));
const Approvals = lazy(() => import("./components/Approvals").then((module) => ({ default: module.Approvals })));
const Payments = lazy(() => import("./components/Payments").then((module) => ({ default: module.Payments })));
const AdminUploadPage = lazy(() => import("../pages/AdminUploadPage").then((module) => ({ default: module.AdminUploadPage })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

type Page =
  | "dashboard"
  | "catalog"
  | "analytics"
  | "ai-insights"
  | "syncs"
  | "balance"
  | "approvals"
  | "payments"
  | "upload"
  | "artists"
  | "admin-payments"
  | "admin-approvals"
  | "admin-syncs";

function AppShell() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>("dashboard");

  if (!user) return <LoginPage />;

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: "#06050F", color: "#E5E7EB", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <Sidebar active={page} onNavigate={(id) => setPage(id as Page)} />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <Suspense fallback={<PageLoader />}>
          {page === "dashboard" && <Dashboard onNavigate={(id) => setPage(id as Page)} />}
          {page === "catalog" && <Catalog />}
          {page === "analytics" && <Analytics />}
          {page === "ai-insights" && <AIInsights />}
          {page === "syncs" && <Syncs />}
          {page === "balance" && <Balance />}
          {page === "approvals" && <Approvals />}
          {page === "payments" && <Payments />}
          {page === "upload" && <AdminUploadPage />}
          {(page === "artists" || page === "admin-payments" || page === "admin-approvals" || page === "admin-syncs") && (
            <div className="flex-1 flex items-center justify-center flex-col gap-3">
              <p className="text-[#6C6890] text-lg">Раздел в разработке</p>
              <button onClick={() => setPage("upload")} className="text-sm text-violet-400 hover:text-violet-300">
                Загрузка отчетов
              </button>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#6C6890] text-sm">Загружаем раздел...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </QueryClientProvider>
  );
}
