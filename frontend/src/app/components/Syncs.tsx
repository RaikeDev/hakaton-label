import { useState, type ReactNode } from "react";
import {
  DollarSign,
  ExternalLink,
  Film,
  Megaphone,
  Music2,
  Plus,
  TrendingUp,
  Tv,
  X,
} from "lucide-react";
import { useSyncs } from "../../hooks/useSyncs";

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

function fmtStreams(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const typeIcons: Record<string, React.ElementType> = {
  "Фильм": Film,
  "Сериал": Tv,
  "Реклама": Megaphone,
};

const typeClasses: Record<string, string> = {
  "Фильм": "border-[#4B8BFF]/30 bg-[#4B8BFF]/10 text-[#8BB4FF]",
  "Сериал": "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  "Реклама": "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

const statusConfig = {
  active: { label: "Активна", className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  completed: { label: "Завершена", className: "border-[#2A3242] bg-[#111722] text-[#B5BCC9]" },
  pending: { label: "Ожидание", className: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
};

export function Syncs() {
  const { data: syncCasesRaw = [], isLoading } = useSyncs();
  const syncCases = syncCasesRaw as any[];
  const [selected, setSelected] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const totalFees = syncCases.reduce((sum: number, item: any) => sum + item.fee, 0);
  const totalRoyalties = syncCases.reduce((sum: number, item: any) => sum + item.revenue, 0);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#202633] px-6 pb-4 pt-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Синхронизации</h1>
            <p className="mt-1 text-sm text-[#8B93A3]">
              Кино, сериалы, реклама · {isLoading ? "..." : `${syncCases.length} кейса`}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex h-10 items-center gap-2 rounded-md bg-[#2F6FED] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3D7EFF]"
          >
            <Plus size={15} />
            Добавить кейс
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SummaryCard icon={DollarSign} label="Sync fees" value={fmtRub(totalFees)} sub="Разовые выплаты" />
          <SummaryCard icon={TrendingUp} label="Роялти от синков" value={fmtRub(totalRoyalties)} sub="Со стримингов" />
          <SummaryCard icon={Film} label="Активных" value={String(syncCases.filter((item) => item.status === "active").length)} sub={`Из ${syncCases.length} кейсов`} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {syncCases.map((item) => (
            <SyncCase key={item.id} item={item} selected={selected === item.id} onToggle={() => setSelected(selected === item.id ? null : item.id)} />
          ))}
        </div>
      </div>

      {showAdd && <AddCaseModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub }: { icon: typeof Film; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-[#202633] bg-[#10141D] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={15} className="text-[#8B93A3]" />
        <span className="text-xs text-[#8B93A3]">{label}</span>
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
      <div className="mt-0.5 text-xs text-[#747D8C]">{sub}</div>
    </div>
  );
}

function SyncCase({ item, selected, onToggle }: { item: any; selected: boolean; onToggle: () => void }) {
  const TypeIcon = typeIcons[item.type] || Film;
  const typeClass = typeClasses[item.type] || typeClasses["Фильм"];
  const statusStyle = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <article className={`overflow-hidden rounded-lg border bg-[#10141D] transition-colors ${selected ? "border-[#4B8BFF]/40" : "border-[#202633] hover:border-[#2A3242]"}`}>
      <button onClick={onToggle} className="flex w-full text-left">
        <div className="relative w-48 shrink-0 bg-[#0B0F16]">
          <img
            src={item.cover_url}
            alt={item.title}
            className="h-full min-h-[132px] w-full object-cover"
            onError={(event) => {
              (event.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=S&background=151B26&color=8B93A3&size=192";
            }}
          />
          <div className="absolute left-3 top-3">
            <span className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${typeClass}`}>
              <TypeIcon size={11} />
              {item.type}
            </span>
          </div>
        </div>

        <div className="flex-1 p-5">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold leading-tight text-white">{item.title}</h3>
              <p className="mt-1 text-sm text-[#8B93A3]">
                {item.studio}
                {item.director ? ` · реж. ${item.director}` : ""}
              </p>
            </div>
            <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${statusStyle.className}`}>
              {statusStyle.label}
            </span>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Music2 size={13} className="text-[#8B93A3]" />
            <span className="text-sm font-medium text-white">{item.track}</span>
            <span className="text-[#747D8C]">·</span>
            <span className="text-sm text-[#8B93A3]">{item.scene}</span>
          </div>

          <div className="grid grid-cols-5 gap-4">
            <CaseMetric label="Sync Fee" value={fmtRub(item.fee)} />
            <CaseMetric label="Ставка роялти" value={item.royalty_rate > 0 ? `${item.royalty_rate}%` : "-"} />
            <CaseMetric label="Стримов после" value={item.streams ? fmtStreams(item.streams) : "-"} />
            <CaseMetric label="Роялти получено" value={item.revenue > 0 ? fmtRub(item.revenue) : "-"} accent />
            <CaseMetric
              label="Релиз"
              value={new Date(item.release_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
            />
          </div>
        </div>
      </button>

      {selected && <SyncCaseDetails item={item} />}
    </article>
  );
}

function CaseMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="mb-0.5 text-xs text-[#8B93A3]">{label}</div>
      <div className={`font-semibold ${accent ? "text-emerald-300" : "text-white"}`}>{value}</div>
    </div>
  );
}

function SyncCaseDetails({ item }: { item: any }) {
  return (
    <div className="border-t border-[#202633] bg-[#0B0F16] p-5">
      <div className="grid grid-cols-3 gap-4">
        <DetailGroup title="Контракт">
          <DetailRow label="Тип лицензии" value="Мастер + синхро" />
          <DetailRow label="Территория" value="Весь мир" />
          <DetailRow label="Срок" value="5 лет" />
          <DetailRow label="Эксклюзив" value="Нет" />
        </DetailGroup>

        <DetailGroup title="Выплаты">
          <DetailRow label="Sync fee" value={fmtRub(item.fee)} accent />
          <DetailRow label="Роялти накоплено" value={fmtRub(item.revenue)} accent />
          <DetailRow label="Итого" value={fmtRub(item.fee + item.revenue)} strong />
        </DetailGroup>

        <DetailGroup title="Документы">
          {["Лицензионный договор.pdf", "Акт выполненных работ.pdf"].map((doc) => (
            <button key={doc} className="flex items-center gap-2 text-sm font-medium text-[#6FA1FF] transition-colors hover:text-[#8BB4FF]">
              <ExternalLink size={13} />
              {doc}
            </button>
          ))}
        </DetailGroup>
      </div>
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#747D8C]">{title}</div>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, accent = false, strong = false }: { label: string; value: string; accent?: boolean; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#8B93A3]">{label}</span>
      <span className={`${accent ? "text-emerald-300" : "text-white"} ${strong ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}

function AddCaseModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-lg border border-[#202633] bg-[#10141D]">
        <div className="flex items-center justify-between border-b border-[#202633] p-5">
          <h3 className="font-semibold text-white">Новый sync-кейс</h3>
          <button onClick={onClose} className="text-[#747D8C] transition-colors hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Название проекта" placeholder="Название фильма / сериала" />
            <SelectField label="Тип" options={["Фильм", "Сериал", "Реклама", "Игра"]} />
            <SelectField label="Трек" options={["Северный ветер", "Неон", "Дорога домой"]} />
            <FormField label="Sync Fee (руб.)" placeholder="100 000" type="number" />
            <FormField label="Описание сцены" placeholder="Финальная сцена, титры..." wide />
            <FormField label="Студия" placeholder="Название студии" />
            <FormField label="Дата релиза" type="date" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="h-10 flex-1 rounded-md border border-[#2A3242] bg-[#111722] text-sm font-medium text-[#C5CBD6] transition-colors hover:bg-[#151D2A]">
              Отмена
            </button>
            <button className="h-10 flex-1 rounded-md bg-[#2F6FED] text-sm font-semibold text-white transition-colors hover:bg-[#3D7EFF]">
              Добавить кейс
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, placeholder, type = "text", wide = false }: { label: string; placeholder?: string; type?: string; wide?: boolean }) {
  return (
    <label className={wide ? "col-span-2" : ""}>
      <span className="mb-1.5 block text-xs text-[#8B93A3]">{label}</span>
      <input
        type={type}
        className="h-10 w-full rounded-md border border-[#2A3242] bg-[#0B0F16] px-3 text-sm text-white outline-none transition-colors placeholder:text-[#586173] focus:border-[#4B8BFF]"
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs text-[#8B93A3]">{label}</span>
      <select className="h-10 w-full rounded-md border border-[#2A3242] bg-[#0B0F16] px-3 text-sm text-white outline-none transition-colors focus:border-[#4B8BFF]">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
