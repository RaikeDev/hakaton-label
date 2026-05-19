import { useCallback, useRef, useState, type RefObject } from "react";
import {
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  MoreHorizontal,
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

type UploadedFile = {
  name: string;
  size: string;
  status: "uploading" | "done" | "error";
  progress: number;
};

export function Catalog() {
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: tracks = [], isLoading } = useTracks(search || undefined);

  const filtered = (tracks as any[]).filter((track: any) => track.title.toLowerCase().includes(search.toLowerCase()));
  const selectedTrackData = (tracks as any[]).find((track: any) => track.id === selectedTrack);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    addFiles(Array.from(event.dataTransfer.files));
  }, []);

  function addFiles(files: File[]) {
    const newFiles: UploadedFile[] = files.map((file) => ({
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      status: "uploading",
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((_, i) => {
      const idx = uploadedFiles.length + i;
      let progress = 0;
      const interval = window.setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          window.clearInterval(interval);
          setUploadedFiles((prev) => prev.map((file, j) => (j === idx ? { ...file, status: "done", progress: 100 } : file)));
          return;
        }
        setUploadedFiles((prev) => prev.map((file, j) => (j === idx ? { ...file, progress } : file)));
      }, 400);
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#202633] px-6 pb-4 pt-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Каталог треков</h1>
            <p className="mt-1 text-sm text-[#8B93A3]">
              {isLoading ? "Загрузка..." : `${(tracks as any[]).length} треков · все платформы`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpload(true)}
              className="flex h-10 items-center gap-2 rounded-md border border-[#2A3242] bg-[#111722] px-4 text-sm font-medium text-[#C5CBD6] transition-colors hover:bg-[#151D2A]"
            >
              <FileSpreadsheet size={15} />
              Импорт CSV
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
          <button className="flex h-10 items-center gap-2 rounded-md border border-[#2A3242] bg-[#111722] px-3 text-sm font-medium text-[#C5CBD6] transition-colors hover:bg-[#151D2A]">
            <Filter size={14} />
            Фильтр
          </button>
          <button className="flex h-10 items-center gap-2 rounded-md border border-[#2A3242] bg-[#111722] px-3 text-sm font-medium text-[#C5CBD6] transition-colors hover:bg-[#151D2A]">
            <Download size={14} />
            Экспорт
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 grid grid-cols-[40px_minmax(260px,1fr)_120px_120px_90px_100px_90px_40px] gap-3 border-b border-[#202633] bg-[#0B0D12] px-6 py-3 text-xs font-medium text-[#747D8C]">
            <span>#</span>
            <span>Трек</span>
            <span className="text-right">Прослушивания</span>
            <span className="text-right">Доход</span>
            <span className="text-right">Тренд</span>
            <span className="text-right">Дата</span>
            <span className="text-center">Статус</span>
            <span />
          </div>

          <div className="px-6 py-2">
            {filtered.map((track, idx) => {
              const isSelected = selectedTrack === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(isSelected ? null : track.id)}
                  className={`grid w-full grid-cols-[40px_minmax(260px,1fr)_120px_120px_90px_100px_90px_40px] items-center gap-3 rounded-md border px-0 py-3 text-left transition-colors ${
                    isSelected ? "border-[#4B8BFF]/40 bg-[#4B8BFF]/10" : "border-transparent hover:bg-[#151B26]"
                  }`}
                >
                  <span className="text-center font-mono text-sm text-[#747D8C]">{idx + 1}</span>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="group relative shrink-0">
                      <img
                        src={track.cover_url}
                        alt={track.title}
                        className="h-10 w-10 rounded-md object-cover"
                        onError={(event) => {
                          (event.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=T&background=151B26&color=fff&size=40";
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
                        {track.duration}
                        <span className="text-[#747D8C]">ISRC: {track.isrc}</span>
                      </span>
                    </span>
                  </span>
                  <span className="text-right text-sm font-semibold text-white">{fmtStreams(track.streams)}</span>
                  <span className="text-right text-sm font-semibold text-emerald-300">{fmtRub(track.revenue)}</span>
                  <span className={`flex items-center justify-end gap-1 text-xs font-semibold ${track.trend >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {track.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(track.trend)}%
                  </span>
                  <span className="text-right text-xs text-[#8B93A3]">
                    {new Date(track.release_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "2-digit" })}
                  </span>
                  <span className="flex justify-center">
                    <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-300">
                      Активен
                    </span>
                  </span>
                  <span className="flex justify-center text-[#747D8C]">
                    <MoreHorizontal size={16} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedTrackData && (
          <TrackDetails track={selectedTrackData} onClose={() => setSelectedTrack(null)} />
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
          onFiles={(files) => addFiles(files)}
        />
      )}
    </div>
  );
}

function TrackDetails({ track, onClose }: { track: any; onClose: () => void }) {
  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-[#202633] bg-[#10141D] p-5">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="font-semibold text-white">Детали трека</h3>
        <button onClick={onClose} className="text-[#747D8C] transition-colors hover:text-white">
          <X size={16} />
        </button>
      </div>
      <img
        src={track.cover_url}
        alt={track.title}
        className="mb-4 aspect-square w-full rounded-lg object-cover"
        onError={(event) => {
          (event.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=T&background=151B26&color=fff&size=288";
        }}
      />
      <h4 className="mb-1 text-lg font-semibold leading-tight text-white">{track.title}</h4>
      <p className="mb-4 text-sm text-[#8B93A3]">MAKO · {track.duration}</p>

      <div className="space-y-3">
        <div className="rounded-lg border border-[#202633] bg-[#0B0F16] p-3">
          <div className="mb-2 text-xs text-[#8B93A3]">По платформам</div>
          {Object.entries(track.platform_streams ?? {}).map(([pid, streams]) => {
            const value = streams as number;
            const total = (Object.values(track.platform_streams ?? {}) as number[]).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
            return (
              <div key={pid} className="mb-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-[#B5BCC9]">{pid}</span>
                  <span className="text-xs font-medium text-white">{fmtStreams(value)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#202633]">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PLATFORM_COLORS[pid] || "#747D8C" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <InfoBox label="Доход" value={fmtRub(track.revenue)} accent />
          <InfoBox label="ISRC" value={track.isrc} mono />
        </div>

        <InfoBox
          label="Релиз"
          value={new Date(track.release_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
        />
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-lg border border-[#202633] bg-[#10141D]">
        <div className="flex items-center justify-between border-b border-[#202633] p-5">
          <div>
            <h3 className="font-semibold text-white">Загрузить треки</h3>
            <p className="mt-0.5 text-sm text-[#8B93A3]">Выберите аудио или таблицу импорта.</p>
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
            <p className="text-sm text-[#8B93A3]">MP3, WAV, FLAC или CSV/XLSX для пакетной загрузки</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".mp3,.wav,.flac,.csv,.xlsx"
              className="hidden"
              onChange={(event) => event.target.files && onFiles(Array.from(event.target.files))}
            />
          </div>

          <div className="rounded-lg border border-[#202633] bg-[#0B0F16] p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet size={18} className="mt-0.5 shrink-0 text-[#8B93A3]" />
              <div>
                <p className="mb-1 text-sm font-medium text-white">Импорт из CSV / Excel</p>
                <p className="text-xs text-[#8B93A3]">Поддерживаются поля: название, ISRC, дата релиза, платформы.</p>
                <button className="mt-2 text-xs font-medium text-[#6FA1FF] transition-colors hover:text-[#8BB4FF]">
                  Скачать шаблон CSV
                </button>
              </div>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="rounded-lg border border-[#202633] bg-[#0B0F16] p-3">
                  <div className="flex items-center gap-3">
                    <Music size={16} className="shrink-0 text-[#8B93A3]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-white">{file.name}</div>
                      <div className="text-xs text-[#8B93A3]">{file.size}</div>
                    </div>
                    {file.status === "done" ? <CheckCircle size={16} className="shrink-0 text-emerald-300" /> : <span className="shrink-0 text-xs text-[#8B93A3]">{Math.round(file.progress)}%</span>}
                  </div>
                  {file.status === "uploading" && (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#202633]">
                      <div className="h-full rounded-full bg-[#4B8BFF] transition-all duration-300" style={{ width: `${file.progress}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="h-10 flex-1 rounded-md border border-[#2A3242] bg-[#111722] text-sm font-medium text-[#C5CBD6] transition-colors hover:bg-[#151D2A]">
              Отмена
            </button>
            <button className="h-10 flex-1 rounded-md bg-[#2F6FED] text-sm font-semibold text-white transition-colors hover:bg-[#3D7EFF]">
              Продолжить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
