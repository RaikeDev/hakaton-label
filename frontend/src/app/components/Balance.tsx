import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Clock, Download, Film, Search, TrendingUp, Wallet } from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import { useTransactions } from "../../hooks/useTransactions";
import { downloadCsv } from "../../lib/csv";

interface Transaction {
  id: number;
  date: string;
  type: "income" | "payout" | "sync" | "advance" | string;
  description: string;
  amount: number;
  status: "completed" | "pending" | string;
}

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

const typeLabels: Record<string, string> = {
  income: "Роялти",
  payout: "Выплата",
  sync: "Синхронизация",
  advance: "Аванс",
};

const typeClasses: Record<string, string> = {
  income: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  payout: "border-[#2A3242] bg-[#151B26] text-[#C5CBD6]",
  sync: "border-[#4B8BFF]/30 bg-[#4B8BFF]/10 text-[#8BB4FF]",
  advance: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
};

const typeIcons: Record<string, React.ElementType> = {
  income: ArrowDownLeft,
  payout: ArrowUpRight,
  sync: Film,
  advance: Wallet,
};

const filters = [
  { id: "all", label: "Все" },
  { id: "income", label: "Роялти" },
  { id: "payout", label: "Выплаты" },
  { id: "sync", label: "Sync" },
  { id: "advance", label: "Авансы" },
];

export function Balance() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: dashData } = useDashboard();

  const txList = transactions as Transaction[];
  const filtered = txList.filter((tx) => {
    const matchFilter = filter === "all" || tx.type === filter;
    const matchSearch = tx.description.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalIncome = txList.filter((t) => t.amount > 0 && t.status === "completed").reduce((a, t) => a + t.amount, 0);
  const totalPaid = txList.filter((t) => t.amount < 0 && t.status === "completed").reduce((a, t) => a + Math.abs(t.amount), 0);
  const royaltyIncome = txList.filter((t) => t.type === "income" && t.status === "completed").reduce((a, t) => a + t.amount, 0);
  const balance = dashData?.artist?.balance ?? 0;
  const pendingPayout = dashData?.artist?.pending_payout ?? 0;

  function exportTransactions() {
    if (filtered.length === 0) {
      toast.error("Нет операций для выгрузки");
      return;
    }
    downloadCsv(
      "kamik-transactions.csv",
      ["Дата", "Операция", "Тип", "Сумма, руб", "Статус"],
      filtered.map((tx) => [
        tx.date,
        tx.description,
        typeLabels[tx.type] ?? tx.type,
        Math.round(tx.amount),
        tx.status === "pending" ? "Ожидается" : "Выполнено",
      ]),
    );
    toast.success("Операции выгружены", { description: `Экспортировано: ${filtered.length}` });
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Баланс и транзакции</h1>
          <p className="mt-1 text-sm text-[#8B93A3]">Деньги после загрузки отчетов: начисления, sync-доходы, авансы и выплаты артисту.</p>
        </div>
        <div className="rounded-md border border-[#2A3242] bg-[#111722] px-4 py-2 text-right">
          <div className="text-xs text-[#8B93A3]">Демо-сценарий</div>
          <div className="text-sm font-medium text-white">Отчет загружен, баланс обновлен, выплата готовится</div>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={Wallet}
          label="Текущий баланс"
          value={fmtRub(balance)}
          sub={`Ожидает выплаты: ${fmtRub(pendingPayout)}`}
          accent
        />
        <SummaryCard icon={ArrowDownLeft} label="Начислено всего" value={fmtRub(totalIncome)} sub="Роялти, авансы и sync-доходы" />
        <SummaryCard icon={TrendingUp} label="Роялти из отчетов" value={fmtRub(royaltyIncome)} sub="Создается при импорте CSV/XLSX" />
        <SummaryCard icon={ArrowUpRight} label="Выплачено" value={fmtRub(totalPaid)} sub="Закрытые исходящие платежи" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { title: "1. Импорт отчета", text: "Админ загружает отчет платформы, backend проверяет строки и считает долю артиста." },
          { title: "2. Баланс", text: "Для каждой успешной строки создается доходная транзакция и обновляется статистика трека." },
          { title: "3. Выплата", text: "Сумма попадает в реестр выплат, где админ согласует и отмечает банковский перевод." },
        ].map((step) => (
          <div key={step.title} className="rounded-lg border border-[#202633] bg-[#10141D] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <ArrowRight size={15} className="text-[#6FA1FF]" />
              {step.title}
            </div>
            <p className="text-sm leading-5 text-[#8B93A3]">{step.text}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Найти транзакцию"
            className="h-10 w-full rounded-md border border-[#2A3242] bg-[#0B0F16] pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-[#586173] focus:border-[#4B8BFF] lg:w-72"
          />
        </label>

        <div className="flex overflow-x-auto rounded-md border border-[#2A3242] bg-[#111722] p-1">
          {filters.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`h-8 whitespace-nowrap rounded px-3 text-xs font-medium transition-colors ${
                filter === item.id ? "bg-[#2F6FED] text-white" : "text-[#8B93A3] hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          onClick={exportTransactions}
          className="lg:ml-auto flex h-10 items-center justify-center gap-2 rounded-md border border-[#2A3242] bg-[#111722] px-3 text-sm font-medium text-[#C5CBD6] transition-colors hover:bg-[#151D2A]"
        >
          <Download size={14} />
          Выгрузить
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#202633] bg-[#10141D]">
        <div className="grid grid-cols-[1fr_140px_120px_150px] gap-4 border-b border-[#202633] px-5 py-3 text-xs font-medium text-[#747D8C]">
          <span>Операция</span>
          <span className="text-right">Дата</span>
          <span className="text-right">Тип</span>
          <span className="text-right">Сумма</span>
        </div>

        {isLoading && <div className="py-12 text-center text-sm text-[#8B93A3]">Загружаем операции...</div>}

        {!isLoading &&
          filtered.map((tx) => {
            const Icon = typeIcons[tx.type] || ArrowDownLeft;
            const colorClass = typeClasses[tx.type] || typeClasses.payout;

            return (
              <div
                key={tx.id}
                className="grid grid-cols-[1fr_140px_120px_150px] items-center gap-4 border-b border-[#202633]/80 px-5 py-4 transition-colors last:border-0 hover:bg-[#151B26]/70"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${colorClass}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{tx.description}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#747D8C]">
                      {tx.status === "pending" ? (
                        <>
                          <Clock size={10} />
                          Ожидается
                        </>
                      ) : (
                        "Выполнено"
                      )}
                    </div>
                  </div>
                </div>
                <div className="whitespace-nowrap text-right text-sm text-[#8B93A3]">
                  {new Date(tx.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <div className="flex justify-end">
                  <span className={`rounded-md border px-2 py-1 text-xs font-medium ${colorClass}`}>{typeLabels[tx.type] ?? tx.type}</span>
                </div>
                <div className={`text-right font-semibold ${tx.amount > 0 ? "text-emerald-300" : "text-white"}`}>
                  {tx.amount > 0 ? "+" : "-"}
                  {fmtRub(Math.abs(tx.amount))}
                </div>
              </div>
            );
          })}

        {!isLoading && filtered.length === 0 && <div className="py-12 text-center text-sm text-[#747D8C]">Нет транзакций</div>}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-5 ${accent ? "border-[#4B8BFF]/30 bg-[#4B8BFF]/10" : "border-[#202633] bg-[#10141D]"}`}>
      <div className="mb-4 flex items-center gap-2">
        <Icon size={18} className={accent ? "text-[#8BB4FF]" : "text-[#8B93A3]"} />
        <span className="text-sm text-[#B5BCC9]">{label}</span>
      </div>
      <div className="mb-1 text-3xl font-semibold text-white">{value}</div>
      <div className="text-sm text-[#8B93A3]">{sub}</div>
      {accent && (
        <div className="mt-4 flex items-center gap-1 border-t border-[#4B8BFF]/20 pt-4 text-xs font-medium text-[#8BB4FF]">
          <TrendingUp size={12} />
          доступно для планирования выплат
        </div>
      )}
    </div>
  );
}
