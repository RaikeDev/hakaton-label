import {
  BarChart3,
  Music2,
  Wallet,
  CheckSquare,
  CreditCard,
  Film,
  Upload,
  LogOut,
  Disc3,
  Users,
  ArrowLeftRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const artistNav = [
  { id: "dashboard", icon: BarChart3, label: "Дашборд" },
  { id: "catalog", icon: Music2, label: "Каталог треков" },
  { id: "analytics", icon: Disc3, label: "Аналитика" },
  { id: "syncs", icon: Film, label: "Синхронизации" },
  { id: "balance", icon: Wallet, label: "Баланс" },
  { id: "approvals", icon: CheckSquare, label: "Согласования" },
  { id: "payments", icon: CreditCard, label: "Выплаты" },
];

const adminNav = [
  { id: "dashboard", icon: BarChart3, label: "Обзор лейбла" },
  { id: "artists", icon: Users, label: "Артисты" },
  { id: "upload", icon: Upload, label: "Загрузка отчётов" },
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
  const displayName = user?.name ?? "—";

  return (
    <aside className="flex flex-col h-full w-[240px] shrink-0 bg-[#0D0D1A] border-r border-[#1E1E35]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1E1E35]">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
          <span className="text-white font-black text-sm tracking-wider">K</span>
        </div>
        <div>
          <div className="text-white font-bold text-base leading-none">KAMIK</div>
          <div className="text-[#6B7280] text-xs mt-0.5">Label Portal</div>
        </div>
      </div>

      {/* User card */}
      <div className="mx-4 mt-4 p-3 rounded-xl bg-[#131325] border border-[#1E1E35]">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${isAdmin ? "bg-emerald-600/30 text-emerald-300" : "bg-violet-600/30 text-violet-300"}`}>
            {displayName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-white font-semibold text-sm leading-none truncate">{displayName}</div>
            <div className="text-[#6B7280] text-xs mt-1">{isAdmin ? "Администратор" : "Артист"}</div>
          </div>
          <div className="ml-auto">
            <div className={`w-2 h-2 rounded-full ring-2 ${isAdmin ? "bg-emerald-400 ring-emerald-400/20" : "bg-violet-400 ring-violet-400/20"}`} />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative ${
                isActive
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-[#9CA3AF] hover:text-white hover:bg-[#1A1A2E]"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-r-full" />
              )}
              <Icon size={17} className={isActive ? "text-violet-400" : "text-[#6B7280] group-hover:text-[#9CA3AF]"} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-[#1E1E35] pt-3 mt-2">
        <button
          onClick={switchRole}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#9CA3AF] hover:text-white hover:bg-[#1A1A2E] transition-all group"
        >
          <ArrowLeftRight size={17} className="text-[#6B7280] group-hover:text-[#9CA3AF]" />
          <span className="font-medium">{isAdmin ? "Режим артиста" : "Режим админа"}</span>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <LogOut size={17} className="text-[#6B7280] group-hover:text-red-400" />
          <span className="font-medium">Выйти</span>
        </button>
      </div>
    </aside>
  );
}
