import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Calendar, CheckCircle, Clock, Music2, Plus, X } from "lucide-react";
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

const approvalStatusConfig: Record<string, { label: string; color: string; dot: string }> = {
  in_review: { label: "На рассмотрении", color: "border-amber-400/30 bg-amber-400/10 text-amber-300", dot: "bg-amber-400" },
  approved: { label: "Опубликован", color: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300", dot: "bg-emerald-400" },
  changes_requested: { label: "Нужны правки", color: "border-red-400/30 bg-red-400/10 text-red-300", dot: "bg-red-400" },
};

type StatusFilter = "all" | "in_review" | "approved" | "changes_requested";

const filterTabs: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "in_review", label: "В процессе" },
  { id: "approved", label: "Опубликованы" },
  { id: "changes_requested", label: "Нужны правки" },
];

function fmtDate(value?: string | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ru-RU", opts);
}

export function Approvals() {
  const { data: approvalsRaw = [], isLoading, createMutation } = useApprovals();
  const approvals = approvalsRaw as any[];
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(
    () => (filter === "all" ? approvals : approvals.filter((a) => a.status === filter)),
    [approvals, filter],
  );

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!filtered.some((a) => a.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = approvals.find((a) => a.id === selectedId) ?? null;

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-sm text-[#8B93A3]">Загрузка согласований...</div>;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#202633] px-6 pb-4 pt-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Согласования</h1>
            <p className="mt-1 text-sm text-[#8B93A3]">Статусы релизов и проверки у дистрибьютора.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex h-10 items-center gap-2 rounded-md bg-[#2F6FED] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3D7EFF]"
          >
            <Plus size={15} />
            Новый релиз
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-md border border-[#2A3242] bg-[#111722] p-1">
            {filterTabs.map((tab) => {
              const count = tab.id === "all" ? approvals.length : approvals.filter((a) => a.status === tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex h-8 items-center gap-1.5 rounded px-3 text-xs font-medium transition-colors ${
                    filter === tab.id ? "bg-[#2F6FED] text-white" : "text-[#8B93A3] hover:text-white"
                  }`}
                >
                  {tab.label}
                  <span className={`rounded px-1 text-[10px] ${filter === tab.id ? "bg-white/20" : "bg-[#0B0F16] text-[#747D8C]"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[340px] shrink-0 overflow-y-auto border-r border-[#202633] p-3">
          {filtered.length === 0 && (
            <div className="px-3 py-10 text-center text-sm text-[#747D8C]">Нет релизов в этой категории</div>
          )}
          {filtered.map((approval) => {
            const cfg = approvalStatusConfig[approval.status] ?? approvalStatusConfig.in_review;
            const completed = approval.timeline.filter((s: any) => s.status === "done").length;
            const total = approval.timeline.length;
            const isActive = approval.id === selectedId;
            return (
              <button
                key={approval.id}
                onClick={() => setSelectedId(approval.id)}
                className={`mb-2 w-full rounded-lg border p-4 text-left transition-colors ${
                  isActive ? "border-[#4B8BFF]/50 bg-[#4B8BFF]/10" : "border-[#202633] bg-[#10141D] hover:bg-[#151B26]"
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-white">{approval.title}</span>
                  <span className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-2 text-xs text-[#8B93A3]">
                  <Calendar size={11} />
                  {fmtDate(approval.planned_release, { day: "numeric", month: "short", year: "numeric" })}
                  <span className="text-[#3A4253]">·</span>
                  {approval.distributor ?? "—"}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#202633]">
                    <div
                      className={`h-full rounded-full ${approval.status === "changes_requested" ? "bg-red-500" : approval.status === "approved" ? "bg-emerald-500" : "bg-[#4B8BFF]"}`}
                      style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#747D8C]">
                    {completed}/{total}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {selected ? <ApprovalDetail approval={selected} /> : <div className="text-sm text-[#747D8C]">Выберите релиз слева</div>}
        </div>
      </div>

      {showCreate && (
        <CreateReleaseModal
          isSubmittingDefault={createMutation.isPending}
          onClose={() => setShowCreate(false)}
          onCreate={(payload) =>
            createMutation.mutate(payload, {
              onSuccess: (created: any) => {
                toast.success("Релиз создан", { description: `${payload.title} отправлен на согласование.` });
                setShowCreate(false);
                setFilter("all");
                if (created?.id) setSelectedId(created.id);
              },
              onError: () => toast.error("Не удалось создать релиз"),
            })
          }
        />
      )}
    </div>
  );
}

function ApprovalDetail({ approval }: { approval: any }) {
  const cfg = approvalStatusConfig[approval.status] ?? approvalStatusConfig.in_review;
  const completed = approval.timeline.filter((s: any) => s.status === "done").length;
  const total = approval.timeline.length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">{approval.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#8B93A3]">
            <span>{approval.distributor ?? "Дистрибьютор не указан"}</span>
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              Релиз: {fmtDate(approval.planned_release)}
            </span>
            {approval.submitted_date && <span>Заявка: {fmtDate(approval.submitted_date, { day: "numeric", month: "short" })}</span>}
          </div>
        </div>
        <span className={`shrink-0 rounded-md border px-3 py-1 text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>

      {approval.tracks.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {approval.tracks.map((track: string) => (
            <div key={track} className="flex items-center gap-1.5 rounded-md border border-[#2A3242] bg-[#111722] px-2.5 py-1">
              <Music2 size={12} className="text-[#8B93A3]" />
              <span className="text-xs text-[#B5BCC9]">{track}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-5 rounded-lg border border-[#202633] bg-[#10141D] p-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-[#8B93A3]">Прогресс</span>
          <span className="text-xs font-semibold text-white">{completed}/{total} шагов</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#202633]">
          <div
            className={`h-full rounded-full ${approval.status === "changes_requested" ? "bg-red-500" : approval.status === "approved" ? "bg-emerald-500" : "bg-[#4B8BFF]"}`}
            style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
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
                      <span className={`text-sm font-medium ${step.status === "pending" ? "text-[#747D8C]" : "text-white"}`}>{step.step}</span>
                      {step.date && <span className="text-xs text-[#747D8C]">{fmtDate(step.date, { day: "numeric", month: "short" })}</span>}
                    </div>
                    {step.status === "issue" && (
                      <div className="mt-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2">
                        <p className="text-xs text-red-200">Дистрибьютор вернул релиз: нужна замена мастер-файла дорожки 2.</p>
                      </div>
                    )}
                    {step.status === "in_progress" && <div className="mt-1 text-xs text-amber-300/80">В обработке у дистрибьютора...</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {approval.status === "in_review" && (
          <div className="mt-4 flex items-center gap-2 border-t border-[#202633] pt-4 text-sm text-[#8B93A3]">
            <Clock size={14} className="text-amber-300" />
            Ожидаемое время проверки: 2-4 рабочих дня
          </div>
        )}
        {approval.status === "approved" && (
          <div className="mt-4 flex items-center gap-2 border-t border-[#202633] pt-4 text-sm text-emerald-300">
            <CheckCircle size={14} />
            Опубликован {fmtDate(approval.planned_release)}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateReleaseModal({
  isSubmittingDefault,
  onClose,
  onCreate,
}: {
  isSubmittingDefault: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; distributor?: string; tracks: string[]; planned_release?: string | null }) => void;
}) {
  const [title, setTitle] = useState("");
  const [distributor, setDistributor] = useState("DistroKid");
  const [tracks, setTracks] = useState("");
  const [planned, setPlanned] = useState("");

  function submit() {
    if (!title.trim()) {
      toast.error("Укажите название релиза");
      return;
    }
    onCreate({
      title: title.trim(),
      distributor: distributor.trim() || undefined,
      tracks: tracks
        .split(/[\n,]/)
        .map((t) => t.trim())
        .filter(Boolean),
      planned_release: planned || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-[#202633] bg-[#10141D]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#202633] p-5">
          <div>
            <h3 className="font-semibold text-white">Новый релиз</h3>
            <p className="mt-0.5 text-sm text-[#8B93A3]">Релиз попадет на согласование с типовыми этапами.</p>
          </div>
          <button onClick={onClose} className="text-[#747D8C] transition-colors hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <Labeled label="Название релиза">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="EP «Весна 2025»"
              autoFocus
              className="h-10 w-full rounded-md border border-[#2A3242] bg-[#0B0F16] px-3 text-sm text-white outline-none placeholder:text-[#586173] focus:border-[#4B8BFF]"
            />
          </Labeled>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Дистрибьютор">
              <input
                value={distributor}
                onChange={(event) => setDistributor(event.target.value)}
                placeholder="DistroKid"
                className="h-10 w-full rounded-md border border-[#2A3242] bg-[#0B0F16] px-3 text-sm text-white outline-none placeholder:text-[#586173] focus:border-[#4B8BFF]"
              />
            </Labeled>
            <Labeled label="Дата релиза">
              <input
                type="date"
                value={planned}
                onChange={(event) => setPlanned(event.target.value)}
                className="h-10 w-full rounded-md border border-[#2A3242] bg-[#0B0F16] px-3 text-sm text-white outline-none focus:border-[#4B8BFF]"
              />
            </Labeled>
          </div>
          <Labeled label="Треки (по одному в строке или через запятую)">
            <textarea
              value={tracks}
              onChange={(event) => setTracks(event.target.value)}
              rows={3}
              placeholder="Утро в Москве, Таяние, Апрель"
              className="w-full resize-none rounded-md border border-[#2A3242] bg-[#0B0F16] px-3 py-2 text-sm text-white outline-none placeholder:text-[#586173] focus:border-[#4B8BFF]"
            />
          </Labeled>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="h-10 flex-1 rounded-md border border-[#2A3242] bg-[#111722] text-sm font-medium text-[#C5CBD6] hover:bg-[#151D2A]">
              Отмена
            </button>
            <button
              onClick={submit}
              disabled={isSubmittingDefault}
              className="h-10 flex-1 rounded-md bg-[#2F6FED] text-sm font-semibold text-white hover:bg-[#3D7EFF] disabled:opacity-50"
            >
              {isSubmittingDefault ? "Создаем..." : "Создать релиз"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs text-[#8B93A3]">{label}</div>
      {children}
    </div>
  );
}
