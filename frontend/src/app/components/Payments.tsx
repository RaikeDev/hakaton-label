import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Pencil,
  Percent,
  Save,
  Send,
  ShieldCheck,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { Payment, PaymentStatus } from "../../api/paymentsApi";
import { updateArtistPayoutDetails } from "../../api/artistsApi";
import { useAuth } from "../../context/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import { usePayments } from "../../hooks/usePayments";
import { getArtistId } from "../../lib/auth";
import { downloadCsv } from "../../lib/csv";

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

const pipeline = [
  { id: "pending", title: "Согласование", text: "Проверка периода, комиссии, налога и суммы к выплате." },
  { id: "approved", title: "Перевод", text: "Администратор подтверждает банковский перевод артисту." },
  { id: "paid", title: "Закрыто", text: "В балансе появляется исходящая транзакция выплаты." },
];

export function Payments() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const artistId = getArtistId(user);
  const qc = useQueryClient();
  const { data: payments = [], isLoading, approveMutation, markPaidMutation } = usePayments();
  const { data: dashData } = useDashboard();
  const [selected, setSelected] = useState<Payment | null>(null);

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.payout, 0);
  const payable = payments.filter((p) => p.status !== "paid").reduce((sum, p) => sum + p.payout, 0);
  const approvedPayable = payments.filter((p) => p.status === "approved").reduce((sum, p) => sum + p.payout, 0);
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const approvedCount = payments.filter((p) => p.status === "approved").length;
  const paidList = payments.filter((p) => p.status === "paid");
  const avgPayout = paidList.length > 0 ? totalPaid / paidList.length : 0;
  const artistShare = dashData?.artist?.artist_share_percent ?? 70;

  function handleApprove(id: number) {
    approveMutation.mutate(id, {
      onSuccess: () => toast.success("Выплата согласована", { description: "Платеж готов к банковскому переводу." }),
      onError: () => toast.error("Не удалось согласовать выплату"),
    });
  }

  function handleTransfer(id: number) {
    markPaidMutation.mutate(
      { id, date: todayIso() },
      {
        onSuccess: () => toast.success("Перевод выполнен", { description: "В балансе создана исходящая транзакция." }),
        onError: () => toast.error("Не удалось отметить перевод"),
      },
    );
  }

  function downloadReport() {
    if (payments.length === 0) {
      toast.error("Нет выплат для отчета");
      return;
    }
    downloadCsv(
      "kamik-payments.csv",
      ["Период", "Валовой доход", "Комиссия", "Налог", "К переводу", "Статус", "Дата перевода"],
      payments.map((p) => [
        p.period,
        Math.round(p.amount),
        p.commission !== null ? Math.round(p.commission) : "",
        p.tax !== null ? Math.round(p.tax) : "",
        Math.round(p.payout),
        statusLabels[p.status],
        p.paid_date ?? "",
      ]),
    );
    toast.success("Отчет по выплатам скачан", { description: `Строк: ${payments.length}` });
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Выплаты и переводы</h1>
          <p className="mt-1 text-sm text-[#8B93A3]">
            Реестр показывает путь денег после импорта отчетов: расчет роялти, согласование, банковский перевод и фиксация в балансе.
          </p>
        </div>
        {isAdmin && (
          <div className="rounded-md border border-[#2A3242] bg-[#111722] px-4 py-2 text-right">
            <div className="text-sm font-semibold text-white">{fmtRub(approvedPayable)}</div>
            <div className="text-xs text-[#8B93A3]">готово к переводу</div>
          </div>
        )}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {pipeline.map((step, index) => {
          const count = step.id === "pending" ? pendingCount : step.id === "approved" ? approvedCount : paidList.length;
          return (
            <div key={step.id} className="rounded-lg border border-[#202633] bg-[#10141D] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#151B26] text-sm font-semibold text-[#6FA1FF]">{index + 1}</div>
                <span className="rounded-md border border-[#2A3242] bg-[#0B0F16] px-2 py-1 text-xs text-[#A5ADBA]">{count} платежей</span>
              </div>
              <h2 className="text-sm font-semibold text-white">{step.title}</h2>
              <p className="mt-2 text-sm leading-5 text-[#8B93A3]">{step.text}</p>
            </div>
          );
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard icon={Wallet} label="К выплате" value={fmtRub(payable)} sub="Ожидает согласования или перевода" accent="amber" />
        <MetricCard icon={CreditCard} label="Выплачено всего" value={fmtRub(totalPaid)} sub="За все периоды" />
        <MetricCard icon={TrendingUp} label="Средняя выплата" value={fmtRub(avgPayout)} sub="По закрытым платежам" />
        <MetricCard icon={Percent} label="Доля артиста" value={`${artistShare}%`} sub="По контракту" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-lg border border-[#202633] bg-[#10141D]">
          <div className="flex items-center justify-between border-b border-[#202633] px-5 py-4">
            <div>
              <h2 className="font-semibold text-white">Реестр выплат</h2>
              <p className="mt-0.5 text-xs text-[#8B93A3]">Нажмите на строку, чтобы увидеть детали расчета</p>
            </div>
            <button
              onClick={downloadReport}
              className="flex h-9 items-center gap-2 rounded-md border border-[#2A3242] bg-[#111722] px-3 text-xs font-medium text-[#C5CBD6] transition-colors hover:bg-[#151D2A]"
            >
              <Download size={13} />
              Скачать отчет
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
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
                      onOpen={() => setSelected(payment)}
                      onApprove={handleApprove}
                      onTransfer={handleTransfer}
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

          <RequisitesCard
            artistId={artistId}
            isAdmin={isAdmin}
            bankName={dashData?.artist?.bank_name ?? null}
            accountNumber={dashData?.artist?.account_number ?? null}
            recipientName={dashData?.artist?.recipient_name ?? null}
            onSaved={() => qc.invalidateQueries({ queryKey: ["dashboard"] })}
          />
        </div>
      </div>

      {selected && <PaymentDetail payment={selected} artistShare={artistShare} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PaymentRow({
  payment,
  isAdmin,
  isMutating,
  onOpen,
  onApprove,
  onTransfer,
}: {
  payment: Payment;
  isAdmin: boolean;
  isMutating: boolean;
  onOpen: () => void;
  onApprove: (id: number) => void;
  onTransfer: (id: number) => void;
}) {
  return (
    <tr className="cursor-pointer border-b border-[#202633]/80 transition-colors last:border-0 hover:bg-[#151B26]/70" onClick={onOpen}>
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
      <td className="px-5 py-4 text-right" onClick={(event) => event.stopPropagation()}>
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
        {(!isAdmin || payment.status === "paid") && (
          <button onClick={onOpen} className="text-xs text-[#6FA1FF] transition-colors hover:text-[#8BB4FF]">
            Подробнее
          </button>
        )}
      </td>
    </tr>
  );
}

function PaymentDetail({ payment, artistShare, onClose }: { payment: Payment; artistShare: number; onClose: () => void }) {
  const labelRevenue = payment.amount - payment.payout - (payment.tax ?? 0) - (payment.commission ?? 0);
  const steps: Array<{ label: string; done: boolean; active: boolean }> = [
    { label: "Расчет роялти", done: true, active: false },
    { label: "Согласование", done: payment.status !== "pending", active: payment.status === "pending" },
    { label: "Банковский перевод", done: payment.status === "paid", active: payment.status === "approved" },
    { label: "Закрыто в балансе", done: payment.status === "paid", active: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <aside className="h-full w-full max-w-md overflow-y-auto border-l border-[#202633] bg-[#10141D]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-[#202633] p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#747D8C]">Выплата за период</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{payment.period}</h2>
            <span className={`mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${statusClasses[payment.status]}`}>
              {payment.status === "paid" ? <CheckCircle size={12} /> : <Clock size={12} />}
              {statusLabels[payment.status]}
            </span>
          </div>
          <button onClick={onClose} className="text-[#747D8C] transition-colors hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-lg border border-[#4B8BFF]/25 bg-[#4B8BFF]/10 p-4">
            <div className="text-xs text-[#8BB4FF]">Сумма к переводу артисту</div>
            <div className="mt-1 text-3xl font-semibold text-white">{fmtRub(payment.payout)}</div>
          </div>

          <div className="rounded-lg border border-[#202633] bg-[#0B0F16] p-4">
            <div className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-[#747D8C]">Расчет</div>
            <BreakdownRow label="Валовой доход" value={fmtRub(payment.amount)} />
            <BreakdownRow label={`Доля лейбла (${(100 - artistShare).toFixed(0)}%)`} value={`- ${fmtRub(labelRevenue > 0 ? labelRevenue : 0)}`} muted />
            <BreakdownRow label="Комиссия" value={payment.commission !== null ? `- ${fmtRub(payment.commission)}` : "-"} muted />
            <BreakdownRow label="Налог" value={payment.tax !== null ? `- ${fmtRub(payment.tax)}` : "-"} muted />
            <div className="my-2 border-t border-[#202633]" />
            <BreakdownRow label="К переводу" value={fmtRub(payment.payout)} bold />
          </div>

          <div className="rounded-lg border border-[#202633] bg-[#0B0F16] p-4">
            <div className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-[#747D8C]">Движение платежа</div>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                      step.done
                        ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                        : step.active
                          ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                          : "border-[#2A3242] text-[#747D8C]"
                    }`}
                  >
                    {step.done ? <CheckCircle size={12} /> : <Clock size={12} />}
                  </span>
                  <span className={`text-sm ${step.done || step.active ? "text-white" : "text-[#747D8C]"}`}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {payment.paid_date && (
            <div className="flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle size={15} />
              Переведено {new Date(payment.paid_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function BreakdownRow({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className={muted ? "text-[#8B93A3]" : "text-[#B5BCC9]"}>{label}</span>
      <span className={`${bold ? "text-base font-semibold text-white" : muted ? "text-[#A5ADBA]" : "text-white"}`}>{value}</span>
    </div>
  );
}

function RequisitesCard({
  artistId,
  isAdmin,
  bankName,
  accountNumber,
  recipientName,
  onSaved,
}: {
  artistId: number;
  isAdmin: boolean;
  bankName: string | null;
  accountNumber: string | null;
  recipientName: string | null;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bank_name: "", account_number: "", recipient_name: "" });

  useEffect(() => {
    setForm({ bank_name: bankName ?? "", account_number: accountNumber ?? "", recipient_name: recipientName ?? "" });
  }, [bankName, accountNumber, recipientName]);

  const save = useMutation({
    mutationFn: () => updateArtistPayoutDetails(artistId, form),
    onSuccess: () => {
      setEditing(false);
      onSaved();
      toast.success("Реквизиты сохранены");
    },
    onError: () => toast.error("Не удалось сохранить реквизиты"),
  });

  return (
    <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-[#8B93A3]" />
          <h2 className="font-semibold text-white">Реквизиты</h2>
        </div>
        {isAdmin && !editing && (
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-sm font-medium text-[#6FA1FF] transition-colors hover:text-[#8BB4FF]">
            <Pencil size={13} />
            Изменить
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <FormField label="Банк" value={form.bank_name} onChange={(v) => setForm((f) => ({ ...f, bank_name: v }))} placeholder="Сбербанк" />
          <FormField label="Счет" value={form.account_number} onChange={(v) => setForm((f) => ({ ...f, account_number: v }))} placeholder="40817 810 ..." mono />
          <FormField label="Получатель" value={form.recipient_name} onChange={(v) => setForm((f) => ({ ...f, recipient_name: v }))} placeholder="ФИО" />
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setEditing(false);
                setForm({ bank_name: bankName ?? "", account_number: accountNumber ?? "", recipient_name: recipientName ?? "" });
              }}
              className="h-9 flex-1 rounded-md border border-[#2A3242] bg-[#111722] text-sm font-medium text-[#C5CBD6] hover:bg-[#151D2A]"
            >
              Отмена
            </button>
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-[#2F6FED] text-sm font-semibold text-white hover:bg-[#3D7EFF] disabled:opacity-50"
            >
              <Save size={14} />
              {save.isPending ? "Сохраняем" : "Сохранить"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <Field label="Банк" value={bankName || "Не указан"} />
          <Field label="Счет" value={accountNumber || "Не указан"} mono />
          <Field label="Получатель" value={recipientName || "Не указан"} />
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-[#8B93A3]">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-9 w-full rounded-md border border-[#2A3242] bg-[#0B0F16] px-3 text-sm text-white outline-none placeholder:text-[#586173] focus:border-[#4B8BFF] ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, accent }: { icon: typeof Wallet; label: string; value: string; sub: string; accent?: "amber" }) {
  const isAccent = accent === "amber";

  return (
    <div className={`rounded-lg border p-5 ${isAccent ? "border-amber-400/25 bg-amber-400/10" : "border-[#202633] bg-[#10141D]"}`}>
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
