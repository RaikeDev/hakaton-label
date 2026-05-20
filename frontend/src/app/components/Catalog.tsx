import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  Music,
  Play,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { useTracks } from "../../hooks/useTracks";
import { uploadRoyaltyReport } from "../../api/uploadsApi";
import { downloadCsv } from "../../lib/csv";
import { coverAt } from "../../lib/cover";

function fmtStreams(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

const PLATFORM_COLORS: Record<string, string> = {
  yandex: "#EAB308",
  vk: "#4B8BFF",
  spotify: "#22C55E",
  sber: "#14B8A6",
  mts: "#EF4444",
  apple: "#F97316",
};

const PLATFORM_LABELS: Record<string, string> = {
  yandex: "Яндекс Музыка",
  vk: "VK Музыка",
  spotify: "Spotify",
  sber: "Звук",
  mts: "МТС Музыка",
  apple: "Apple Music",
};

type SortKey = "streams" | "revenue" | "release_date" | "title";

const sortOptions: Array<{ id: SortKey; label: string }> = [
  { id: "streams", label: "По прослушиваниям" },
  { id: "revenue", label: "По доходу" },
  { id: "release_date", label: "По дате релиза" },
  { id: "title", label: "По названию" },
];

type UploadedFile = {
  id: number;
  name: string;
  size: string;
  status: "uploading" | "done" | "error";
  detail: string;
};

export function Catalog() {
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("streams");
  const [minStreams, setMinStreams] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadIdRef = useRef(0);
  const qc = useQueryClient();
  const { data: tracks = [], isLoading } = useTracks(search || undefined);

  const tracksTyped = tracks as any[];

  const filtered = useMemo(() => {
    const list = tracksTyped.filter(
      (track) => track.title.toLowerCase().includes(search.toLowerCase()) && track.streams >= minStreams,
    );
    const sorted = [...list].sort((a, b) => {
      switch (sortKey) {
        case "revenue":
          return b.revenue - a.revenue;
        case "release_date":
          return new Date(b.release_date ?? 0).getTime() - new Date(a.release_date ?? 0).getTime();
        case "title":
          return a.title.localeCompare(b.title, "ru");
        default:
          return b.streams - a.streams;
      }
    });
    return sorted;
  }, [tracksTyped, search, minStreams, sortKey]);

  const catalogRevenue = useMemo(() => tracksTyped.reduce((sum, t) => sum + t.revenue, 0), [tracksTyped]);
  const selectedTrackData = tracksTyped.find((track) => track.id === selectedTrack);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    void importFiles(Array.from(event.dataTransfer.files));
  }, []);

  async function importFiles(files: File[]) {
    const importable = files.filter((file) => /\.(csv|xlsx|xls)$/i.test(file.name));
    if (importable.length === 0) {
      toast.error("Нужен файл CSV или Excel", { description: "Для пакетной загрузки треков выберите таблицу импорта." });
      return;
    }

    for (const file of importable) {
      const id = uploadIdRef.current;
      uploadIdRef.current += 1;
      setUploadedFiles((prev) => [
        ...prev,
        { id, name: file.name, size: `${(file.size / 1024).toFixed(0)} KB`, status: "uploading", detail: "Отправка на сервер..." },
      ]);

      try {
        const result = await uploadRoyaltyReport(file);
        const ok = result.status === "completed";
        setUploadedFiles((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: ok ? "done" : "error",
                  detail: ok
                    ? `Обработано строк: ${result.rows_success}, ошибок: ${result.rows_failed}`
                    : result.message ?? "Не удалось обработать файл",
                }
              : item,
          ),
        );
        if (ok) {
          toast.success("Треки загружены", {
            description: `${file.name}: новых записей ${result.created_track_stats}, обновлено ${result.updated_track_stats}.`,
          });
          qc.invalidateQueries({ queryKey: ["tracks"] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          qc.invalidateQueries({ queryKey: ["analytics"] });
          qc.invalidateQueries({ queryKey: ["transactions"] });
        } else {
          toast.error("Файл не обработан", { description: result.message ?? file.name });
        }
      } catch {
        setUploadedFiles((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "error", detail: "Ошибка сети или формата файла" } : item)),
        );
        toast.error("Ошибка загрузки", { description: file.name });
      }
    }
  }

  function exportTracks() {
    if (filtered.length === 0) {
      toast.error("Нет треков для экспорта");
      return;
    }
    downloadCsv(
      "kamik-tracks.csv",
      ["Название", "ISRC", "Длительность", "Дата релиза", "Прослушивания", "Доход, руб", "Доход на 1000, руб", "Статус"],
      filtered.map((t) => [t.title, t.isrc ?? "", t.duration ?? "", t.release_date ?? "", t.streams, Math.round(t.revenue), t.rpm ?? "", t.status]),
    );
    toast.success("Каталог выгружен", { description: `Экспортировано треков: ${filtered.length}` });
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#202633] px-6 pb-4 pt-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Каталог треков</h1>
            <p className="mt-1 text-sm text-[#8B93A3]">
              {isLoading ? "Загрузка..." : `${tracksTyped.length} треков · ${fmtRub(catalogRevenue)} дохода`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportTracks}
              className="flex h-10 items-center gap-2 rounded-md border border-[#2A3242] bg-[#111722] px-4 text-sm font-medium text-[#C5CBD6] transition-colors hover:bg-[#151D2A]"
            >
              <Download size={15} />
              Экспорт
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex h-10 items-center gap-2 rounded-md bg-[#2F6FED] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3D7EFF]"
            >
              <Plus size={15} />
              Загрузить треки
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative block w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Найти трек"
              className="h-10 w-full rounded-md border border-[#2A3242] bg-[#0B0F16] pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-[#586173] focus:border-[#4B8BFF]"
            />
          </label>

          <div className="relative">
            <button
              onClick={() => setShowFilter((open) => !open)}
              className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                showFilter || minStreams > 0 || sortKey !== "streams"
                  ? "border-[#4B8BFF]/50 bg-[#4B8BFF]/10 text-white"
                  : "border-[#2A3242] bg-[#111722] text-[#C5CBD6] hover:bg-[#151D2A]"
              }`}
            >
              <Filter size={14} />
              Фильтр
            </button>

            {showFilter && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowFilter(false)} />
                <div className="absolute left-0 top-12 z-40 w-72 rounded-lg border border-[#2A3242] bg-[#10141D] p-4 shadow-2xl">
                  <div className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#747D8C]">Сортировка</div>
                  <div className="mb-4 grid gap-1.5">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSortKey(option.id)}
                        className={`flex h-9 items-center justify-between rounded-md px-3 text-sm transition-colors ${
                          sortKey === option.id ? "bg-[#2F6FED] text-white" : "text-[#C5CBD6] hover:bg-[#151B26]"
                        }`}
                      >
                        {option.label}
                        {sortKey === option.id && <CheckCircle size={14} />}
                      </button>
                    ))}
                  </div>

                  <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.12em] text-[#747D8C]">
                    <span>Минимум прослушиваний</span>
                    <span className="text-[#8BB4FF]">{fmtStreams(minStreams)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2_000_000}
                    step={50_000}
                    value={minStreams}
                    onChange={(event) => setMinStreams(Number(event.target.value))}
                    className="w-full accent-[#4B8BFF]"
                  />

                  <button
                    onClick={() => {
                      setSortKey("streams");
                      setMinStreams(0);
                    }}
                    className="mt-4 h-9 w-full rounded-md border border-[#2A3242] bg-[#111722] text-sm font-medium text-[#C5CBD6] hover:bg-[#151D2A]"
                  >
                    Сбросить фильтр
                  </button>
                </div>
              </>
            )}
          </div>

          <span className="text-xs text-[#747D8C]">Показано: {filtered.length}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 grid grid-cols-[40px_minmax(260px,1fr)_120px_120px_90px_100px_90px] gap-3 border-b border-[#202633] bg-[#0B0D12] px-6 py-3 text-xs font-medium text-[#747D8C]">
            <span>#</span>
            <span>Трек</span>
            <span className="text-right">Прослушивания</span>
            <span className="text-right">Доход</span>
            <span className="text-right">RPM</span>
            <span className="text-right">Дата</span>
            <span className="text-center">Статус</span>
          </div>

          <div className="px-6 py-2">
            {!isLoading && filtered.length === 0 && (
              <div className="py-16 text-center text-sm text-[#747D8C]">Треки не найдены</div>
            )}
            {filtered.map((track, idx) => {
              const isSelected = selectedTrack === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(isSelected ? null : track.id)}
                  className={`grid w-full grid-cols-[40px_minmax(260px,1fr)_120px_120px_90px_100px_90px] items-center gap-3 rounded-md border px-0 py-3 text-left transition-colors ${
                    isSelected ? "border-[#4B8BFF]/40 bg-[#4B8BFF]/10" : "border-transparent hover:bg-[#151B26]"
                  }`}
                >
                  <span className="text-center font-mono text-sm text-[#747D8C]">{idx + 1}</span>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="group relative shrink-0">
                      <img
                        src={coverAt(track.cover_url, 96)}
                        alt={track.title}
                        loading="lazy"
                        className="h-11 w-11 rounded-md object-cover"
                        onError={(event) => {
                          (event.target as HTMLImageElement).style.visibility = "hidden";
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                        <Play size={14} className="text-white" fill="white" />
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">{track.title}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-[#8B93A3]">
                        <Clock size={11} className="text-[#747D8C]" />
                        {track.duration ?? "—"}
                        <span className="text-[#747D8C]">ISRC: {track.isrc ?? "—"}</span>
                      </span>
                    </span>
                  </span>
                  <span className="text-right text-sm font-semibold text-white">{fmtStreams(track.streams)}</span>
                  <span className="text-right text-sm font-semibold text-emerald-300">{fmtRub(track.revenue)}</span>
                  <span className="text-right text-xs text-[#B5BCC9]">{fmtRub(track.rpm ?? 0)}</span>
                  <span className="text-right text-xs text-[#8B93A3]">
                    {track.release_date
                      ? new Date(track.release_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "2-digit" })
                      : "—"}
                  </span>
                  <span className="flex justify-center">
                    <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-300">
                      Активен
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedTrackData && (
          <TrackDetails track={selectedTrackData} catalogRevenue={catalogRevenue} onClose={() => setSelectedTrack(null)} />
        )}
      </div>

      {showUpload && (
        <UploadModal
          dragOver={dragOver}
          uploadedFiles={uploadedFiles}
          fileRef={fileRef}
          onClose={() => {
            setShowUpload(false);
            setUploadedFiles([]);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onFiles={(files) => void importFiles(files)}
        />
      )}
    </div>
  );
}

function TrackDetails({ track, catalogRevenue, onClose }: { track: any; catalogRevenue: number; onClose: () => void }) {
  const platformStreams: Record<string, number> = track.platform_streams ?? {};
  const platformRevenue: Record<string, number> = track.platform_revenue ?? {};
  const totalStreams = (Object.values(platformStreams) as number[]).reduce((a, b) => a + b, 0);
  const catalogShare = catalogRevenue > 0 ? (track.revenue / catalogRevenue) * 100 : 0;
  const rows = Object.entries(platformStreams).sort((a, b) => (b[1] as number) - (a[1] as number));

  return (
    <aside className="w-[360px] shrink-0 overflow-y-auto border-l border-[#202633] bg-[#10141D]">
      <div className="relative">
        <img
          src={coverAt(track.cover_url, 720)}
          alt={track.title}
          className="aspect-square w-full object-cover"
          onError={(event) => {
            (event.target as HTMLImageElement).style.visibility = "hidden";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#10141D] via-[#10141D]/30 to-transparent" />
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <X size={16} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-400/15 px-2 py-1 text-xs font-medium text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Активен
          </span>
          <h3 className="text-2xl font-semibold leading-tight text-white">{track.title}</h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-[#C5CBD6]">
            MAKO
            <span className="text-[#747D8C]">·</span>
            <Clock size={12} /> {track.duration ?? "—"}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-2">
          <InfoBox label="Прослушивания" value={fmtStreams(track.streams)} />
          <InfoBox label="Доход" value={fmtRub(track.revenue)} accent />
          <InfoBox label="Доход на 1000" value={fmtRub(track.rpm ?? 0)} />
          <InfoBox label="Доля каталога" value={`${catalogShare.toFixed(1)}%`} />
        </div>

        <div className="rounded-lg border border-[#202633] bg-[#0B0F16] p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-[#8B93A3]">
            <span>По платформам</span>
            <span>стримы · доход</span>
          </div>
          <div className="space-y-3">
            {rows.length === 0 && <div className="text-xs text-[#747D8C]">Нет данных по платформам</div>}
            {rows.map(([code, streams]) => {
              const value = streams as number;
              const pct = totalStreams > 0 ? (value / totalStreams) * 100 : 0;
              return (
                <div key={code}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-[#B5BCC9]">
                      <span className="h-2 w-2 rounded-full" style={{ background: PLATFORM_COLORS[code] || "#747D8C" }} />
                      {PLATFORM_LABELS[code] ?? code}
                    </span>
                    <span className="text-xs text-[#8B93A3]">
                      <span className="font-medium text-white">{fmtStreams(value)}</span> · {fmtRub(platformRevenue[code] ?? 0)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#202633]">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PLATFORM_COLORS[code] || "#747D8C" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <InfoBox label="ISRC" value={track.isrc ?? "—"} mono />
          <InfoBox
            label="Релиз"
            value={
              track.release_date
                ? new Date(track.release_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
                : "—"
            }
          />
        </div>
      </div>
    </aside>
  );
}

function InfoBox({ label, value, accent = false, mono = false }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-[#202633] bg-[#0B0F16] p-3">
      <div className="mb-1 text-xs text-[#8B93A3]">{label}</div>
      <div className={`text-sm font-semibold ${accent ? "text-emerald-300" : "text-white"} ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}

function UploadModal({
  dragOver,
  uploadedFiles,
  fileRef,
  onClose,
  onDragOver,
  onDragLeave,
  onDrop,
  onFiles,
}: {
  dragOver: boolean;
  uploadedFiles: UploadedFile[];
  fileRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent) => void;
  onFiles: (files: File[]) => void;
}) {
  function downloadTemplate() {
    downloadCsv(
      "kamik-royalty-template.csv",
      ["artist_name", "track_title", "isrc", "platform", "period", "streams", "gross_revenue", "currency"],
      [["MAKO", "Северный ветер", "RURAM2412001", "Яндекс Музыка", "2025-03", 320000, 5824, "RUB"]],
    );
    toast.success("Шаблон CSV скачан");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-lg border border-[#202633] bg-[#10141D]">
        <div className="flex items-center justify-between border-b border-[#202633] p-5">
          <div>
            <h3 className="font-semibold text-white">Пакетная загрузка треков</h3>
            <p className="mt-0.5 text-sm text-[#8B93A3]">Загрузите CSV/XLSX — система создаст треки и пересчитает статистику.</p>
          </div>
          <button onClick={onClose} className="text-[#747D8C] transition-colors hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-lg border border-dashed p-8 text-center transition-colors ${
              dragOver ? "border-[#4B8BFF] bg-[#4B8BFF]/10" : "border-[#2A3242] hover:bg-[#151B26]"
            }`}
          >
            <Upload size={32} className="mx-auto mb-3 text-[#8B93A3]" />
            <p className="mb-1 font-medium text-white">Перетащите файлы сюда</p>
            <p className="text-sm text-[#8B93A3]">CSV или XLSX с колонками отчета (artist_name, track_title, isrc, platform, ...)</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(event) => event.target.files && onFiles(Array.from(event.target.files))}
            />
          </div>

          <div className="rounded-lg border border-[#202633] bg-[#0B0F16] p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet size={18} className="mt-0.5 shrink-0 text-[#8B93A3]" />
              <div>
                <p className="mb-1 text-sm font-medium text-white">Формат импорта</p>
                <p className="text-xs text-[#8B93A3]">Поддерживаются поля: artist_name, track_title, isrc, platform, period, streams, gross_revenue.</p>
                <button onClick={downloadTemplate} className="mt-2 text-xs font-medium text-[#6FA1FF] transition-colors hover:text-[#8BB4FF]">
                  Скачать шаблон CSV
                </button>
              </div>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="rounded-lg border border-[#202633] bg-[#0B0F16] p-3">
                  <div className="flex items-center gap-3">
                    <Music size={16} className="shrink-0 text-[#8B93A3]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-white">{file.name}</div>
                      <div className={`text-xs ${file.status === "error" ? "text-red-300" : "text-[#8B93A3]"}`}>{file.detail}</div>
                    </div>
                    {file.status === "done" ? (
                      <CheckCircle size={16} className="shrink-0 text-emerald-300" />
                    ) : file.status === "error" ? (
                      <X size={16} className="shrink-0 text-red-300" />
                    ) : (
                      <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#4B8BFF] border-t-transparent" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="h-10 flex-1 rounded-md border border-[#2A3242] bg-[#111722] text-sm font-medium text-[#C5CBD6] transition-colors hover:bg-[#151D2A]">
              Закрыть
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="h-10 flex-1 rounded-md bg-[#2F6FED] text-sm font-semibold text-white transition-colors hover:bg-[#3D7EFF]"
            >
              Выбрать файл
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
