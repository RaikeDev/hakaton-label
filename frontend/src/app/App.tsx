import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Catalog } from "./components/Catalog";
import { Analytics } from "./components/Analytics";
import { Syncs } from "./components/Syncs";
import { Balance } from "./components/Balance";
import { Approvals } from "./components/Approvals";
import { Payments } from "./components/Payments";
import { AIInsights } from "./components/AIInsights";
import { LoginPage } from "../pages/LoginPage";
import { AdminUploadPage } from "../pages/AdminUploadPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

type Page = "dashboard" | "catalog" | "analytics" | "ai-insights" | "syncs" | "balance" | "approvals" | "payments" | "upload" | "artists" | "admin-payments" | "admin-approvals" | "admin-syncs";

function AppShell() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>("dashboard");

  if (!user) return <LoginPage />;

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#06050F", color: "#E5E7EB", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <Sidebar active={page} onNavigate={(id) => setPage(id as Page)} />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
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
            <button onClick={() => setPage("upload")} className="text-sm text-violet-400 hover:text-violet-300">→ Загрузка отчётов</button>
          </div>
        )}
      </main>
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
