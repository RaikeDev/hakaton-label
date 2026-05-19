import { Calendar, CheckCircle, Clock, CreditCard, Download, Percent, Send, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { Payment, PaymentStatus } from "../../api/paymentsApi";
import { useAuth } from "../../context/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import { usePayments } from "../../hooks/usePayments";

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const statusLabels: Record<PaymentStatus, string> = {
  pending: "На согласовании",
  approved: "Готово к переводу",
  paid: "Выплачено",
};

const statusClasses: Record<PaymentStatus, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  approved: "border-[#4B8BFF]/30 bg-[#4B8BFF]/10 text-[#8BB4FF]",
  paid: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

export function Payments() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: payments = [], isLoading, approveMutation, markPaidMutation } = usePayments();
  const { data: dashData } = useDashboard();

  const totalPaid = payments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + payment.payout, 0);
  const payable = payments.filter((payment) => payment.status !== "paid").reduce((sum, payment) => sum + payment.payout, 0);
  const approvedPayable = payments.filter((payment) => payment.status === "approved").reduce((sum, payment) => sum + payment.payout, 0);
  const paidList = payments.filter((payment) => payment.status === "paid");
  const avgPayout = paidList.length > 0 ? totalPaid / paidList.length : 0;
  const artistShare = dashData?.artist?.artist_share_percent ?? 70;

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Выплаты и переводы</h1>
          <p className="mt-1 text-sm text-[#8B93A3]">
            Расчет роялти, согласование и фиксация банковских переводов.
          </p>
        </div>
        {isAdmin && (
          <div className="rounded-md border border-[#2A3242] bg-[#111722] px-4 py-2 text-right">
            <div className="text-sm font-semibold text-white">{fmtRub(approvedPayable)}</div>
            <div className="text-xs text-[#8B93A3]">готово к переводу</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={Wallet} label="К выплате" value={fmtRub(payable)} sub="Ожидает согласования или перевода" accent="amber" />
        <MetricCard icon={CreditCard} label="Выплачено всего" value={fmtRub(totalPaid)} sub="За все периоды" />
        <MetricCard icon={TrendingUp} label="Средняя выплата" value={fmtRub(avgPayout)} sub="По закрытым платежам" />
        <MetricCard icon={Percent} label="Доля артиста" value={`${artistShare}%`} sub="По контракту" />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div className="overflow-hidden rounded-lg border border-[#202633] bg-[#10141D]">
          <div className="flex items-center justify-between border-b border-[#202633] px-5 py-4">
            <div>
              <h2 className="font-semibold text-white">Реестр выплат</h2>
              <p className="mt-0.5 text-xs text-[#8B93A3]">Расчет, согласование, перевод</p>
            </div>
            <button className="flex h-9 items-center gap-2 rounded-md border border-[#2A3242] bg-[#111722] px-3 text-xs font-medium text-[#C5CBD6] transition-colors hover:bg-[#151D2A]">
              <Download size={13} />
              Скачать отчет
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#202633] text-xs text-[#747D8C]">
                  <th className="px-5 py-3 text-left font-medium">Период</th>
                  <th className="px-4 py-3 text-right font-medium">Валовой доход</th>
                  <th className="px-4 py-3 text-right font-medium">Комиссия</th>
                  <th className="px-4 py-3 text-right font-medium">Налог</th>
                  <th className="px-4 py-3 text-right font-medium">К переводу</th>
                  <th className="px-4 py-3 text-center font-medium">Статус</th>
                  <th className="px-5 py-3 text-right font-medium">Действие</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-[#8B93A3]">
                      Загружаем выплаты...
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <PaymentRow
                      key={payment.id}
                      payment={payment}
                      isAdmin={isAdmin}
                      isMutating={approveMutation.isPending || markPaidMutation.isPending}
                      onApprove={(id) => approveMutation.mutate(id)}
                      onTransfer={(id) => markPaidMutation.mutate({ id, date: todayIso() })}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
            <h2 className="mb-4 font-semibold text-white">Правила выплат</h2>
            <div className="space-y-4">
              <Rule icon={Calendar} title="График" text="Переводы выполняются 10-го числа за предыдущий отчетный период." />
              <Rule icon={ShieldCheck} title="Контроль" text="Платеж должен быть согласован администратором до отправки." />
              <Rule icon={Wallet} title="Минимум" text="Минимальная сумма для вывода: 5 000 руб." />
            </div>
          </div>

          <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Реквизиты</h2>
              <button className="text-sm font-medium text-[#6FA1FF] transition-colors hover:text-[#8BB4FF]">Изменить</button>
            </div>
            <div className="space-y-3 text-sm">
              <Field label="Банк" value="Сбербанк" />
              <Field label="Счет" value="**** **** **** 4521" mono />
              <Field label="Получатель" value="Ковалев Максим Андреевич" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentRow({
  payment,
  isAdmin,
  isMutating,
  onApprove,
  onTransfer,
}: {
  payment: Payment;
  isAdmin: boolean;
  isMutating: boolean;
  onApprove: (id: number) => void;
  onTransfer: (id: number) => void;
}) {
  return (
    <tr className="border-b border-[#202633]/80 transition-colors last:border-0 hover:bg-[#151B26]/70">
      <td className="px-5 py-4">
        <div className="font-medium text-white">{payment.period}</div>
        <div className="mt-0.5 text-xs text-[#747D8C]">
          {payment.paid_date ? `Переведено ${new Date(payment.paid_date).toLocaleDateString("ru-RU")}` : "Дата перевода не назначена"}
        </div>
      </td>
      <td className="px-4 py-4 text-right text-[#B5BCC9]">{fmtRub(payment.amount)}</td>
      <td className="px-4 py-4 text-right text-[#B5BCC9]">{payment.commission !== null ? fmtRub(payment.commission) : "-"}</td>
      <td className="px-4 py-4 text-right text-[#B5BCC9]">{payment.tax !== null ? fmtRub(payment.tax) : "-"}</td>
      <td className="px-4 py-4 text-right font-semibold text-white">{fmtRub(payment.payout)}</td>
      <td className="px-4 py-4 text-center">
        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${statusClasses[payment.status]}`}>
          {payment.status === "paid" ? <CheckCircle size={12} /> : <Clock size={12} />}
          {statusLabels[payment.status]}
        </span>
      </td>
      <td className="px-5 py-4 text-right">
        {isAdmin && payment.status === "pending" && (
          <button
            onClick={() => onApprove(payment.id)}
            disabled={isMutating}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#2F6FED] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#3D7EFF] disabled:opacity-50"
          >
            <ShieldCheck size={13} />
            Согласовать
          </button>
        )}
        {isAdmin && payment.status === "approved" && (
          <button
            onClick={() => onTransfer(payment.id)}
            disabled={isMutating}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            <Send size={13} />
            Перевести
          </button>
        )}
        {(!isAdmin || payment.status === "paid") && <span className="text-xs text-[#747D8C]">-</span>}
      </td>
    </tr>
  );
}

function MetricCard({ icon: Icon, label, value, sub, accent }: { icon: typeof Wallet; label: string; value: string; sub: string; accent?: "amber" }) {
  const isAccent = accent === "amber";

  return (
    <div className={`rounded-lg border p-5 ${isAccent ? "border-amber-400/25 bg-amber-400/8" : "border-[#202633] bg-[#10141D]"}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} className={isAccent ? "text-amber-300" : "text-[#8B93A3]"} />
        <span className="text-sm text-[#B5BCC9]">{label}</span>
      </div>
      <div className={`text-2xl font-semibold ${isAccent ? "text-amber-200" : "text-white"}`}>{value}</div>
      <div className="mt-1 text-xs text-[#8B93A3]">{sub}</div>
    </div>
  );
}

function Rule({ icon: Icon, title, text }: { icon: typeof Wallet; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#151B26]">
        <Icon size={15} className="text-[#8B93A3]" />
      </div>
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="mt-0.5 text-xs leading-snug text-[#8B93A3]">{text}</div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="mb-1 text-xs text-[#8B93A3]">{label}</div>
      <div className={`text-white ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
