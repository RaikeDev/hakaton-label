import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Film, Filter, Search, Download, Wallet, TrendingUp, Clock } from "lucide-react";
import { useTransactions } from "../../hooks/useTransactions";
import { useDashboard } from "../../hooks/useDashboard";

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 2 }).format(n);
}

const typeLabels: Record<string, string> = {
  income: "Роялти",
  payout: "Выплата",
  sync: "Синхронизация",
  advance: "Аванс",
};

const typeColors: Record<string, string> = {
  income: "text-emerald-400 bg-emerald-400/10",
  payout: "text-white bg-[#1E1E35]",
  sync: "text-violet-400 bg-violet-400/10",
  advance: "text-cyan-400 bg-cyan-400/10",
};

const typeIcons: Record<string, React.ElementType> = {
  income: ArrowDownLeft,
  payout: ArrowUpRight,
  sync: Film,
  advance: Wallet,
};

export function Balance() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: dashData } = useDashboard();

  const txList = transactions as any[];

  const filtered = txList.filter((tx: any) => {
    const matchFilter = filter === "all" || tx.type === filter;
    const matchSearch = tx.description.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalIncome = txList.filter((t: any) => t.amount > 0 && t.status === "completed").reduce((a: number, t: any) => a + t.amount, 0);
  const totalPaid = txList.filter((t: any) => t.amount < 0 && t.status === "completed").reduce((a: number, t: any) => a + Math.abs(t.amount), 0);
  const balance = dashData?.artist?.balance ?? 0;
  const pendingPayout = dashData?.artist?.pending_payout ?? 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Баланс и транзакции</h1>
        <p className="text-[#6B7280] text-sm mt-0.5">История всех операций по счёту</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 bg-violet-600/10 border border-violet-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={18} className="text-violet-400" />
            <span className="text-[#9CA3AF] text-sm">Текущий баланс</span>
          </div>
          <div className="text-white text-3xl font-bold mb-1">{fmtRub(balance)}</div>
          <div className="text-[#6B7280] text-sm">Доступно к выводу</div>
          <div className="mt-4 pt-4 border-t border-violet-500/20">
            <div className="text-[#9CA3AF] text-xs mb-0.5">Ожидает выплаты</div>
            <div className="text-amber-400 font-semibold">{fmtRub(pendingPayout)}</div>
          </div>
        </div>

        <div className="bg-[#131320] border border-[#1E1E35] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownLeft size={18} className="text-emerald-400" />
            <span className="text-[#9CA3AF] text-sm">Всего получено</span>
          </div>
          <div className="text-white text-3xl font-bold mb-1">{fmtRub(totalIncome)}</div>
          <div className="text-[#6B7280] text-sm">Роялти + авансы + синки</div>
          <div className="mt-4 pt-4 border-t border-[#1E1E35]">
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
              <TrendingUp size={12} />
              +8.4% vs прошлый период
            </div>
          </div>
        </div>

        <div className="bg-[#131320] border border-[#1E1E35] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight size={18} className="text-[#9CA3AF]" />
            <span className="text-[#9CA3AF] text-sm">Всего выплачено</span>
          </div>
          <div className="text-white text-3xl font-bold mb-1">{fmtRub(totalPaid)}</div>
          <div className="text-[#6B7280] text-sm">Исходящие платежи</div>
          <div className="mt-4 pt-4 border-t border-[#1E1E35]">
            <div className="flex items-center gap-1 text-[#6B7280] text-xs">
              <Clock size={12} />
              Следующая выплата: 10 марта
            </div>
          </div>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Найти транзакцию..."
            className="bg-[#131320] border border-[#1E1E35] text-white placeholder-[#4B5563] text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors w-64"
          />
        </div>
        <div className="flex gap-1 bg-[#131320] border border-[#1E1E35] rounded-xl p-1">
          {["all", "income", "payout", "sync", "advance"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? "bg-violet-600 text-white" : "text-[#6B7280] hover:text-white"
              }`}
            >
              {{ all: "Все", income: "Роялти", payout: "Выплаты", sync: "Синхро", advance: "Авансы" }[f]}
            </button>
          ))}
        </div>
        <button className="ml-auto flex items-center gap-2 px-3 py-2.5 bg-[#131320] border border-[#1E1E35] text-[#9CA3AF] text-sm rounded-xl hover:border-[#2A2A45] transition-all">
          <Download size={14} />
          Выгрузить
        </button>
      </div>

      {/* Transaction list */}
      <div className="bg-[#131320] border border-[#1E1E35] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-[#1E1E35] text-[#4B5563] text-xs font-medium">
          <span>Операция</span>
          <span className="text-right">Дата</span>
          <span className="text-right w-20">Тип</span>
          <span className="text-right w-32">Сумма</span>
        </div>
        {filtered.map((tx) => {
          const Icon = typeIcons[tx.type] || ArrowDownLeft;
          const colorClass = typeColors[tx.type] || "";
          return (
            <div key={tx.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-4 border-b border-[#1E1E35]/50 last:border-0 hover:bg-[#1A1A2E]/50 transition-colors items-center">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate">{tx.description}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {tx.status === "pending" && (
                      <span className="flex items-center gap-1 text-amber-400 text-xs">
                        <Clock size={10} />
                        Ожидается
                      </span>
                    )}
                    {tx.status === "completed" && (
                      <span className="text-[#4B5563] text-xs">Выполнено</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-[#6B7280] text-sm whitespace-nowrap">
                {new Date(tx.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div className="w-20 flex justify-end">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
                  {typeLabels[tx.type]}
                </span>
              </div>
              <div className={`w-32 text-right font-bold ${tx.amount > 0 ? "text-emerald-400" : "text-white"}`}>
                {tx.amount > 0 ? "+" : ""}{fmtRub(Math.abs(tx.amount))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[#4B5563] text-sm">Нет транзакций</div>
        )}
      </div>
    </div>
  );
}
