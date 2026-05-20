import { lazy, Suspense, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { useTracks } from "../hooks/useTracks";
import { LoginPage } from "../pages/LoginPage";
import { Sidebar } from "./components/Sidebar";
import { CommandPalette } from "./components/ui/CommandPalette";

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { data: tracks = [] } = useTracks(undefined, undefined, Boolean(user));

  useEffect(() => {
    if (!user) return;

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen((isOpen) => !isOpen);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user]);

  if (!user) return <LoginPage />;

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: "#0B0D12", color: "#E5E7EB", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <Sidebar active={page} onNavigate={(id) => setPage(id as Page)} />
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(id) => setPage(id as Page)}
        role={user.role}
        tracks={tracks as Array<{ id: string | number; title: string; isrc?: string; streams?: number; revenue?: number }>}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
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
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <p className="text-lg text-[#8B93A3]">Раздел в разработке</p>
              <button onClick={() => setPage("upload")} className="text-sm text-[#6FA1FF] hover:text-[#8BB4FF]">
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
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#4B8BFF] border-t-transparent" />
        <p className="text-sm text-[#8B93A3]">Загружаем раздел...</p>
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
