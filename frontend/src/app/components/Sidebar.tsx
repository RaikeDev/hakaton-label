import {
  ArrowLeftRight,
  BarChart3,
  CheckSquare,
  CreditCard,
  Disc3,
  Film,
  LogOut,
  Music2,
  Search,
  Sparkles,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import { Avatar } from "./ui/InitialsAvatar";

const artistNav = [
  { id: "dashboard", icon: BarChart3, label: "Дашборд" },
  { id: "catalog", icon: Music2, label: "Каталог треков" },
  { id: "analytics", icon: Disc3, label: "Аналитика" },
  { id: "ai-insights", icon: Sparkles, label: "Инсайты" },
  { id: "syncs", icon: Film, label: "Синхронизации" },
  { id: "balance", icon: Wallet, label: "Баланс" },
  { id: "approvals", icon: CheckSquare, label: "Согласования" },
  { id: "payments", icon: CreditCard, label: "Выплаты" },
];

const adminNav = [
  { id: "dashboard", icon: BarChart3, label: "Обзор лейбла" },
  { id: "artists", icon: Users, label: "Артисты" },
  { id: "upload", icon: Upload, label: "Загрузка отчетов" },
  { id: "ai-insights", icon: Sparkles, label: "Инсайты" },
  { id: "admin-payments", icon: CreditCard, label: "Выплаты" },
  { id: "admin-approvals", icon: CheckSquare, label: "Согласования" },
  { id: "admin-syncs", icon: Film, label: "Синхронизации" },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  const { user, logout, switchRole } = useAuth();
  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNav : artistNav;
  const displayName = user?.name ?? "-";
  const { data: dashData } = useDashboard();
  const avatarUrl = isAdmin ? null : (dashData?.artist?.avatar_url as string | null | undefined);

  function openSearch() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
  }

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-[#202633] bg-[#0E1118]">
      <div className="flex items-center gap-3 border-b border-[#202633] px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#2A3242] bg-[#151B26] text-sm font-bold text-white">
          K
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-none tracking-wide text-white">KAMIK</div>
          <div className="mt-1 text-xs text-[#8B93A3]">Label Portal</div>
        </div>
      </div>

      <div className="mx-3 mt-3 rounded-md border border-[#202633] bg-[#111722] p-3">
        <div className="flex items-center gap-3">
          <Avatar name={displayName} src={avatarUrl} size={36} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-none text-white">{displayName}</div>
            <div className="mt-1 text-xs text-[#8B93A3]">{isAdmin ? "Администратор" : "Артист"}</div>
          </div>
          <span
            className={`ml-auto h-2 w-2 rounded-full ${isAdmin ? "bg-emerald-400" : "bg-[#4B8BFF]"}`}
            aria-label="Активный пользователь"
          />
        </div>
      </div>

      <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-3">
        <button
          onClick={openSearch}
          className="group flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-[#A5ADBA] transition-colors hover:bg-[#151B26] hover:text-white"
        >
          <Search size={17} className="text-[#667085] group-hover:text-[#A5ADBA]" />
          <span className="font-medium">Поиск</span>
          <kbd className="ml-auto rounded border border-[#2A3242] bg-[#0B0F16] px-1.5 py-0.5 text-[11px] text-[#747D8C]">
            Ctrl K
          </kbd>
        </button>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm transition-colors ${
                isActive ? "bg-[#1B2638] text-white" : "text-[#A5ADBA] hover:bg-[#151B26] hover:text-white"
              }`}
            >
              <Icon size={17} className={isActive ? "text-[#6FA1FF]" : "text-[#667085] group-hover:text-[#A5ADBA]"} />
              <span className="truncate font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-2 space-y-1 border-t border-[#202633] px-3 py-3">
        <button
          onClick={switchRole}
          className="group flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-[#A5ADBA] transition-colors hover:bg-[#151B26] hover:text-white"
        >
          <ArrowLeftRight size={17} className="text-[#667085] group-hover:text-[#A5ADBA]" />
          <span className="truncate font-medium">{isAdmin ? "Режим артиста" : "Режим админа"}</span>
        </button>
        <button
          onClick={logout}
          className="group flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-[#A5ADBA] transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={17} className="text-[#667085] group-hover:text-red-300" />
          <span className="font-medium">Выйти</span>
        </button>
      </div>
    </aside>
  );
}
