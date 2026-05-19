import { AlertCircle, Calendar, CheckCircle, Clock, Music2, Plus, Upload } from "lucide-react";
import { useApprovals } from "../../hooks/useApprovals";

const stepStatusIcon = {
  done: CheckCircle,
  in_progress: Clock,
  pending: Clock,
  issue: AlertCircle,
};

const stepStatusColor = {
  done: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  in_progress: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  pending: "border-[#2A3242] bg-[#111722] text-[#747D8C]",
  issue: "border-red-400/30 bg-red-400/10 text-red-300",
};

const approvalStatusConfig = {
  in_review: { label: "На рассмотрении", color: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  approved: { label: "Опубликован", color: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  changes_requested: { label: "Нужны правки", color: "border-red-400/30 bg-red-400/10 text-red-300" },
};

export function Approvals() {
  const { data: approvalsRaw = [], isLoading } = useApprovals();
  const approvals = approvalsRaw as any[];

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-sm text-[#8B93A3]">Загрузка согласований...</div>;
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Согласования</h1>
          <p className="mt-1 text-sm text-[#8B93A3]">Статусы релизов и проверки у дистрибьютора.</p>
        </div>
        <button className="flex h-10 items-center gap-2 rounded-md bg-[#2F6FED] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3D7EFF]">
          <Plus size={15} />
          Новый релиз
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="В процессе" count={approvals.filter((a) => a.status === "in_review").length} tone="amber" />
        <SummaryCard label="Опубликовано" count={approvals.filter((a) => a.status === "approved").length} tone="green" />
        <SummaryCard label="Требует правок" count={approvals.filter((a) => a.status === "changes_requested").length} tone="red" />
      </div>

      <div className="space-y-4">
        {approvals.map((approval) => {
          const statusCfg = approvalStatusConfig[approval.status as keyof typeof approvalStatusConfig];
          const completedSteps = approval.timeline.filter((step: any) => step.status === "done").length;
          const totalSteps = approval.timeline.length;
          const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

          return (
            <div key={approval.id} className="overflow-hidden rounded-lg border border-[#202633] bg-[#10141D]">
              <div className="border-b border-[#202633] p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white">{approval.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <span className="text-sm text-[#8B93A3]">{approval.distributor}</span>
                      <div className="flex items-center gap-1 text-sm text-[#8B93A3]">
                        <Calendar size={12} />
                        Релиз: {new Date(approval.planned_release).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <span className={`rounded-md border px-3 py-1 text-xs font-medium ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {approval.tracks.map((track: string) => (
                    <div key={track} className="flex items-center gap-1.5 rounded-md border border-[#2A3242] bg-[#111722] px-2.5 py-1">
                      <Music2 size={12} className="text-[#8B93A3]" />
                      <span className="text-xs text-[#B5BCC9]">{track}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-[#8B93A3]">Прогресс</span>
                    <span className="text-xs font-semibold text-white">
                      {completedSteps}/{totalSteps} шагов
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#202633]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        approval.status === "changes_requested" ? "bg-red-500" : approval.status === "approved" ? "bg-emerald-500" : "bg-[#4B8BFF]"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-[#747D8C]">Этапы</div>
                <div className="relative">
                  <div className="absolute bottom-4 left-4 top-4 w-px bg-[#202633]" />

                  <div className="space-y-4">
                    {approval.timeline.map((step: any, idx: number) => {
                      const Icon = stepStatusIcon[step.status as keyof typeof stepStatusIcon] || Clock;
                      const colorClass = stepStatusColor[step.status as keyof typeof stepStatusColor];
                      return (
                        <div key={idx} className="flex items-start gap-4">
                          <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${colorClass}`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-center justify-between gap-3">
                              <span className={`text-sm font-medium ${step.status === "pending" ? "text-[#747D8C]" : "text-white"}`}>
                                {step.step}
                              </span>
                              {step.date && (
                                <span className="text-xs text-[#747D8C]">
                                  {new Date(step.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                                </span>
                              )}
                            </div>
                            {step.status === "issue" && (
                              <div className="mt-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2">
                                <p className="text-xs text-red-200">Обнаружена проблема с мастерингом дорожки 2. Нужна замена файла.</p>
                                <button className="mt-2 flex items-center gap-1 text-xs font-medium text-red-200 transition-colors hover:text-white">
                                  <Upload size={11} />
                                  Загрузить исправленный файл
                                </button>
                              </div>
                            )}
                            {step.status === "in_progress" && <div className="mt-1 text-xs text-amber-300/80">В обработке у дистрибьютора...</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {approval.status === "changes_requested" && (
                  <div className="mt-4 flex gap-2 border-t border-[#202633] pt-4">
                    <button className="flex h-10 items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-4 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/20">
                      <Upload size={14} />
                      Загрузить исправления
                    </button>
                    <button className="h-10 rounded-md border border-[#2A3242] bg-[#111722] px-4 text-sm font-medium text-[#C5CBD6] transition-colors hover:bg-[#151D2A]">
                      Связаться с менеджером
                    </button>
                  </div>
                )}
                {approval.status === "in_review" && (
                  <div className="mt-4 border-t border-[#202633] pt-4">
                    <div className="flex items-center gap-2 text-sm text-[#8B93A3]">
                      <Clock size={14} className="text-amber-300" />
                      Ожидаемое время проверки: 2-4 рабочих дня
                    </div>
                  </div>
                )}
                {approval.status === "approved" && (
                  <div className="mt-4 flex items-center gap-2 border-t border-[#202633] pt-4 text-sm text-emerald-300">
                    <CheckCircle size={14} />
                    Опубликован {new Date(approval.planned_release).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ label, count, tone }: { label: string; count: number; tone: "amber" | "green" | "red" }) {
  const color = tone === "green" ? "text-emerald-300" : tone === "red" ? "text-red-300" : "text-amber-300";

  return (
    <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
      <div className={`mb-1 text-3xl font-semibold ${color}`}>{count}</div>
      <div className="text-sm text-[#B5BCC9]">{label}</div>
    </div>
  );
}
