import { CheckCircle, Clock, Download, CreditCard, TrendingUp, Percent, DollarSign, Calendar } from "lucide-react";
import { usePayments } from "../../hooks/usePayments";
import { useDashboard } from "../../hooks/useDashboard";

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

export function Payments() {
  const { data: paymentsRaw = [], isLoading } = usePayments();
  const { data: dashData } = useDashboard();
  const payments = paymentsRaw as any[];
  const totalPaid = payments.filter((p: any) => p.status === "paid").reduce((a: number, p: any) => a + p.payout, 0);
  const paidList = payments.filter((p: any) => p.status === "paid");
  const avgPayout = paidList.length > 0 ? totalPaid / paidList.length : 0;
  const pendingPayout = dashData?.artist?.pending_payout ?? 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Выплаты</h1>
        <p className="text-[#6B7280] text-sm mt-0.5">История и расчёт роялти</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-violet-600/10 border border-violet-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={16} className="text-violet-400" />
            <span className="text-[#9CA3AF] text-sm">К выплате</span>
          </div>
          <div className="text-white text-2xl font-bold">{fmtRub(pendingPayout)}</div>
          <div className="text-[#6B7280] text-xs mt-1">Февраль 2025</div>
        </div>
        <div className="bg-[#131320] border border-[#1E1E35] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-emerald-400" />
            <span className="text-[#9CA3AF] text-sm">Выплачено всего</span>
          </div>
          <div className="text-white text-2xl font-bold">{fmtRub(totalPaid)}</div>
          <div className="text-[#6B7280] text-xs mt-1">За всё время</div>
        </div>
        <div className="bg-[#131320] border border-[#1E1E35] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-cyan-400" />
            <span className="text-[#9CA3AF] text-sm">Средняя выплата</span>
          </div>
          <div className="text-white text-2xl font-bold">{fmtRub(avgPayout)}</div>
          <div className="text-[#6B7280] text-xs mt-1">В месяц</div>
        </div>
        <div className="bg-[#131320] border border-[#1E1E35] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Percent size={16} className="text-amber-400" />
            <span className="text-[#9CA3AF] text-sm">Доля артиста</span>
          </div>
          <div className="text-white text-2xl font-bold">75%</div>
          <div className="text-[#6B7280] text-xs mt-1">По контракту</div>
        </div>
      </div>

      {/* Contract breakdown */}
      <div className="bg-[#131320] border border-[#1E1E35] rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">Структура расчёта</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Валовой доход", value: "100%", desc: "Со всех платформ", color: "text-white" },
            { label: "Комиссия лейбла", value: "10%", desc: "Административные расходы", color: "text-[#9CA3AF]" },
            { label: "Налог (НДФЛ)", value: "10%", desc: "Удерживается у источника", color: "text-[#9CA3AF]" },
            { label: "Выплата артисту", value: "75%", desc: "Нетто на счёт", color: "text-emerald-400" },
          ].map((item) => (
            <div key={item.label} className="bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-4">
              <div className={`text-2xl font-bold mb-1 ${item.color}`}>{item.value}</div>
              <div className="text-white text-sm font-medium">{item.label}</div>
              <div className="text-[#4B5563] text-xs mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-4 flex items-start gap-3">
          <Calendar size={16} className="text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-white text-sm font-medium">Расписание выплат</p>
            <p className="text-[#6B7280] text-xs mt-0.5">Выплаты производятся 10-го числа каждого месяца за предыдущий период. Минимальная сумма для вывода: 5 000 ₽.</p>
          </div>
        </div>
      </div>

      {/* Payments table */}
      <div className="bg-[#131320] border border-[#1E1E35] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E35]">
          <h2 className="text-white font-semibold">История выплат</h2>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#1A1A2E] border border-[#2A2A45] text-[#9CA3AF] text-xs rounded-lg hover:text-white transition-colors">
            <Download size={13} />
            Скачать отчёт
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[#4B5563] text-xs border-b border-[#1E1E35]">
                <th className="text-left px-5 py-3 font-medium">Период</th>
                <th className="text-right px-4 py-3 font-medium">Валовой доход</th>
                <th className="text-right px-4 py-3 font-medium">Комиссия лейбла</th>
                <th className="text-right px-4 py-3 font-medium">Налог</th>
                <th className="text-right px-4 py-3 font-medium">Сумма выплаты</th>
                <th className="text-right px-4 py-3 font-medium">Дата</th>
                <th className="text-center px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-[#1E1E35]/50 last:border-0 hover:bg-[#1A1A2E]/50 transition-colors">
                  <td className="px-5 py-4 text-white font-medium">{p.period}</td>
                  <td className="px-4 py-4 text-right text-[#9CA3AF]">{fmtRub(p.amount)}</td>
                  <td className="px-4 py-4 text-right text-[#9CA3AF]">
                    {p.commission !== null ? fmtRub(p.commission) : <span className="text-[#4B5563]">—</span>}
                  </td>
                  <td className="px-4 py-4 text-right text-[#9CA3AF]">
                    {p.tax !== null ? fmtRub(p.tax) : <span className="text-[#4B5563]">—</span>}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-white text-base">{fmtRub(p.payout)}</td>
                  <td className="px-4 py-4 text-right text-[#6B7280] text-sm">
                    {p.paid_date
                      ? new Date(p.paid_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
                      : <span className="text-[#4B5563]">—</span>}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {p.status === "paid" ? (
                      <span className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold">
                        <CheckCircle size={12} />
                        Выплачено
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold">
                        <Clock size={12} />
                        Ожидается
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button className="text-violet-400 hover:text-violet-300 transition-colors">
                      <Download size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank details */}
      <div className="bg-[#131320] border border-[#1E1E35] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Реквизиты для выплат</h2>
          <button className="text-violet-400 text-sm hover:text-violet-300 transition-colors">Изменить</button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-[#6B7280] text-xs mb-1">Банк</div>
            <div className="text-white">Сбербанк</div>
          </div>
          <div>
            <div className="text-[#6B7280] text-xs mb-1">Счёт</div>
            <div className="text-white font-mono">•••• •••• •••• 4521</div>
          </div>
          <div>
            <div className="text-[#6B7280] text-xs mb-1">Получатель</div>
            <div className="text-white">Ковалёв Максим Андреевич</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Wallet({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
