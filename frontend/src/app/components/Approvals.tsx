import { CheckCircle, Clock, AlertCircle, ChevronRight, Upload, Music2, Calendar, Send, X, Plus } from "lucide-react";
import { useApprovals } from "../../hooks/useApprovals";

const stepStatusIcon = {
  done: CheckCircle,
  in_progress: Clock,
  pending: Clock,
  issue: AlertCircle,
};

const stepStatusColor = {
  done: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  in_progress: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  pending: "text-[#4B5563] bg-[#131320] border-[#1E1E35]",
  issue: "text-red-400 bg-red-400/10 border-red-400/30",
};

const approvalStatusConfig = {
  in_review: { label: "На рассмотрении", color: "text-amber-400 bg-amber-400/10" },
  approved: { label: "Опубликован", color: "text-emerald-400 bg-emerald-400/10" },
  changes_requested: { label: "Нужны правки", color: "text-red-400 bg-red-400/10" },
};

export function Approvals() {
  const { data: approvalsRaw = [], isLoading, isError } = useApprovals();
  const approvals = approvalsRaw as any[];

  if (isLoading) return <div className="flex-1 flex items-center justify-center text-[#6B7280]">Загрузка согласований...</div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Согласования</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Статус релизов с дистрибьютором</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-colors font-medium">
          <Plus size={15} />
          Новый релиз
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "В процессе", count: approvals.filter((a) => a.status === "in_review").length, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
          { label: "Опубликовано", count: approvals.filter((a) => a.status === "approved").length, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
          { label: "Требует правок", count: approvals.filter((a) => a.status === "changes_requested").length, color: "text-red-400 bg-red-400/10 border-red-400/20" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 border ${s.color}`}>
            <div className={`text-3xl font-bold mb-1 ${s.color.split(" ")[0]}`}>{s.count}</div>
            <div className="text-[#9CA3AF] text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Approval cards */}
      <div className="space-y-4">
        {approvals.map((ap) => {
          const statusCfg = approvalStatusConfig[ap.status as keyof typeof approvalStatusConfig];
          const completedSteps = ap.timeline.filter((s) => s.status === "done").length;
          const totalSteps = ap.timeline.length;
          const progress = (completedSteps / totalSteps) * 100;

          return (
            <div key={ap.id} className="bg-[#131320] border border-[#1E1E35] rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-[#1E1E35]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold text-lg">{ap.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[#6B7280] text-sm">{ap.distributor}</span>
                      <span className="text-[#4B5563]">·</span>
                      <div className="flex items-center gap-1 text-[#6B7280] text-sm">
                        <Calendar size={12} />
                        Релиз: {new Date(ap.planned_release).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Tracks */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {ap.tracks.map((t) => (
                    <div key={t} className="flex items-center gap-1.5 bg-[#1A1A2E] border border-[#2A2A45] rounded-lg px-2.5 py-1">
                      <Music2 size={12} className="text-violet-400" />
                      <span className="text-[#9CA3AF] text-xs">{t}</span>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[#6B7280] text-xs">Прогресс</span>
                    <span className="text-white text-xs font-semibold">{completedSteps}/{totalSteps} шагов</span>
                  </div>
                  <div className="h-1.5 bg-[#1E1E35] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ap.status === "changes_requested" ? "bg-red-500" : ap.status === "approved" ? "bg-emerald-500" : "bg-violet-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-5">
                <div className="text-[#6B7280] text-xs font-medium uppercase tracking-wider mb-4">Timeline</div>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-4 bottom-4 w-px bg-[#1E1E35]" />

                  <div className="space-y-4">
                    {ap.timeline.map((step, idx) => {
                      const Icon = stepStatusIcon[step.status as keyof typeof stepStatusIcon] || Clock;
                      const colorClass = stepStatusColor[step.status as keyof typeof stepStatusColor];
                      return (
                        <div key={idx} className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10 ${colorClass}`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-medium ${step.status === "pending" ? "text-[#4B5563]" : "text-white"}`}>
                                {step.step}
                              </span>
                              {step.date && (
                                <span className="text-[#4B5563] text-xs">
                                  {new Date(step.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                                </span>
                              )}
                            </div>
                            {step.status === "issue" && (
                              <div className="mt-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                <p className="text-red-400 text-xs">Обнаружена проблема с мастерингом дорожки 2. Необходима замена файла.</p>
                                <button className="text-red-300 text-xs mt-1.5 hover:text-white transition-colors flex items-center gap-1">
                                  <Upload size={11} />
                                  Загрузить исправленный файл
                                </button>
                              </div>
                            )}
                            {step.status === "in_progress" && (
                              <div className="mt-1 text-amber-400/70 text-xs">В обработке у дистрибьютора...</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action */}
                {ap.status === "changes_requested" && (
                  <div className="mt-4 pt-4 border-t border-[#1E1E35] flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl hover:bg-red-500/20 transition-colors">
                      <Upload size={14} />
                      Загрузить исправления
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A2E] border border-[#2A2A45] text-[#9CA3AF] text-sm rounded-xl hover:text-white transition-colors">
                      Связаться с менеджером
                    </button>
                  </div>
                )}
                {ap.status === "in_review" && (
                  <div className="mt-4 pt-4 border-t border-[#1E1E35]">
                    <div className="flex items-center gap-2 text-[#6B7280] text-sm">
                      <Clock size={14} className="text-amber-400" />
                      Ожидаемое время проверки: 2–4 рабочих дня
                    </div>
                  </div>
                )}
                {ap.status === "approved" && (
                  <div className="mt-4 pt-4 border-t border-[#1E1E35] flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle size={14} />
                    Опубликован {new Date(ap.planned_release).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
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
