import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Play,
  MoreHorizontal,
  FileSpreadsheet,
  Plus,
  X,
  CheckCircle,
  Music,
  Clock,
  Download,
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
  yandex: "#FFCC00", vk: "#4F8DFF", spotify: "#1DB954", sber: "#21A038", mts: "#E42313", apple: "#FC3C44",
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
  const { data: tracks = [], isLoading, isError } = useTracks(search || undefined);

  const filtered = (tracks as any[]).filter((t: any) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, []);

  const addFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((f) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
      status: "uploading",
      progress: 0,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    // Simulate upload progress
    newFiles.forEach((_, i) => {
      const idx = uploadedFiles.length + i;
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadedFiles((prev) =>
            prev.map((f, j) => j === idx ? { ...f, status: "done", progress: 100 } : f)
          );
        } else {
          setUploadedFiles((prev) =>
            prev.map((f, j) => j === idx ? { ...f, progress } : f)
          );
        }
      }, 400);
    });
  };

  const selectedTrackData = (tracks as any[]).find((t: any) => t.id === selectedTrack);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#1E1E35] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Каталог треков</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{isLoading ? "Загрузка..." : `${(tracks as any[]).length} треков · все платформы`}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#131320] border border-[#1E1E35] text-[#9CA3AF] text-sm rounded-xl hover:border-[#2A2A45] hover:text-white transition-all"
            >
              <FileSpreadsheet size={15} />
              Импорт CSV
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-colors font-medium"
            >
              <Plus size={15} />
              Загрузить треки
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Найти трек..."
              className="w-full bg-[#131320] border border-[#1E1E35] text-white placeholder-[#4B5563] text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2.5 bg-[#131320] border border-[#1E1E35] text-[#9CA3AF] text-sm rounded-xl hover:border-[#2A2A45] transition-all">
            <Filter size={14} />
            Фильтр
          </button>
          <button className="flex items-center gap-2 px-3 py-2.5 bg-[#131320] border border-[#1E1E35] text-[#9CA3AF] text-sm rounded-xl hover:border-[#2A2A45] transition-all">
            <Download size={14} />
            Экспорт
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Track list */}
        <div className="flex-1 overflow-y-auto">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-[#1E1E35] text-[#4B5563] text-xs font-medium sticky top-0 bg-[#08080E] z-10">
            <span className="w-6 shrink-0">#</span>
            <span className="flex-1">Трек</span>
            <span className="w-24 text-right">Прослушивания</span>
            <span className="w-28 text-right">Доход</span>
            <span className="w-16 text-right">Тренд</span>
            <span className="w-20 text-right">Дата</span>
            <span className="w-20 text-center">Статус</span>
            <span className="w-8"></span>
          </div>

          <div className="px-6 py-2">
            {filtered.map((track, idx) => {
              const isSelected = selectedTrack === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => setSelectedTrack(isSelected ? null : track.id)}
                  className={`flex items-center gap-3 py-3 px-3 rounded-xl cursor-pointer -mx-3 transition-all border ${
                    isSelected
                      ? "bg-violet-600/10 border-violet-500/30"
                      : "border-transparent hover:bg-[#131320]"
                  }`}
                >
                  <span className="text-[#4B5563] text-sm font-mono w-6 shrink-0 text-center">{idx + 1}</span>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative group shrink-0">
                      <img
                        src={track.cover_url}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=T&background=7C3AED&color=fff&size=40"; }}
                      />
                      <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play size={14} className="text-white" fill="white" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-white text-sm font-medium truncate">{track.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={11} className="text-[#4B5563]" />
                        <span className="text-[#6B7280] text-xs">{track.duration}</span>
                        <span className="text-[#4B5563] text-xs">· ISRC: {track.isrc}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <div className="text-white text-sm font-semibold">{fmtStreams(track.streams)}</div>
                  </div>
                  <div className="w-28 text-right">
                    <div className="text-emerald-400 text-sm font-semibold">{fmtRub(track.revenue)}</div>
                  </div>
                  <div className={`w-16 flex items-center justify-end gap-1 text-xs font-semibold ${track.trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {track.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(track.trend)}%
                  </div>
                  <div className="w-20 text-right text-[#6B7280] text-xs">
                    {new Date(track.release_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "2-digit" })}
                  </div>
                  <div className="w-20 flex justify-center">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Активен</span>
                  </div>
                  <button className="w-8 flex justify-center text-[#4B5563] hover:text-white transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Track detail panel */}
        {selectedTrackData && (
          <div className="w-72 shrink-0 border-l border-[#1E1E35] bg-[#0D0D1A] overflow-y-auto p-5">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-white font-semibold">Детали трека</h3>
              <button onClick={() => setSelectedTrack(null)} className="text-[#4B5563] hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <img
              src={selectedTrackData.cover_url}
              alt={selectedTrackData.title}
              className="w-full aspect-square rounded-xl object-cover mb-4"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=T&background=7C3AED&color=fff&size=288"; }}
            />
            <h4 className="text-white font-bold text-lg leading-tight mb-1">{selectedTrackData.title}</h4>
            <p className="text-[#6B7280] text-sm mb-4">MAKO · {selectedTrackData.duration}</p>

            <div className="space-y-3">
              <div className="bg-[#131320] rounded-xl p-3 border border-[#1E1E35]">
                <div className="text-[#6B7280] text-xs mb-2">По платформам</div>
                {Object.entries(selectedTrackData.platform_streams ?? {}).map(([pid, streams]) => {
                  const sNum = streams as number;
                  const total = Object.values(selectedTrackData.platform_streams ?? {}).reduce((a: number, b) => a + (b as number), 0);
                  const pct = total > 0 ? ((sNum / total) * 100).toFixed(0) : "0";
                  return (
                    <div key={pid} className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#9CA3AF] text-xs">{pid}</span>
                        <span className="text-white text-xs font-medium">{fmtStreams(sNum)}</span>
                      </div>
                      <div className="h-1.5 bg-[#1E1E35] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: PLATFORM_COLORS[pid] || "#6B7280" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#131320] rounded-xl p-3 border border-[#1E1E35]">
                  <div className="text-[#6B7280] text-xs mb-1">Доход</div>
                  <div className="text-emerald-400 font-bold text-sm">{fmtRub(selectedTrackData.revenue)}</div>
                </div>
                <div className="bg-[#131320] rounded-xl p-3 border border-[#1E1E35]">
                  <div className="text-[#6B7280] text-xs mb-1">ISRC</div>
                  <div className="text-white font-mono text-xs">{selectedTrackData.isrc}</div>
                </div>
              </div>

              <div className="bg-[#131320] rounded-xl p-3 border border-[#1E1E35]">
                <div className="text-[#6B7280] text-xs mb-1">Релиз</div>
                <div className="text-white text-sm">{new Date(selectedTrackData.release_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D0D1A] border border-[#1E1E35] rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-[#1E1E35]">
              <div>
                <h3 className="text-white font-bold">Загрузить треки</h3>
                <p className="text-[#6B7280] text-sm mt-0.5">Drag & drop или выберите файлы</p>
              </div>
              <button onClick={() => { setShowUpload(false); setUploadedFiles([]); }} className="text-[#4B5563] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver ? "border-violet-500 bg-violet-500/10" : "border-[#2A2A45] hover:border-violet-500/50 hover:bg-violet-500/5"
                }`}
              >
                <Upload size={32} className="text-[#4B5563] mx-auto mb-3" />
                <p className="text-white font-medium mb-1">Перетащите файлы сюда</p>
                <p className="text-[#6B7280] text-sm">MP3, WAV, FLAC или CSV/XLSX для батч-загрузки</p>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".mp3,.wav,.flac,.csv,.xlsx"
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
                />
              </div>

              {/* CSV info */}
              <div className="bg-[#131320] border border-[#1E1E35] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet size={18} className="text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium mb-1">Импорт из CSV / Excel</p>
                    <p className="text-[#6B7280] text-xs">Загрузите файл с треками: название, ISRC, дата релиза, платформы — всё автоматически распарсится.</p>
                    <button className="text-violet-400 text-xs hover:text-violet-300 mt-2 transition-colors">
                      Скачать шаблон CSV →
                    </button>
                  </div>
                </div>
              </div>

              {/* Files list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="bg-[#131320] border border-[#1E1E35] rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <Music size={16} className="text-violet-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm truncate">{f.name}</div>
                          <div className="text-[#6B7280] text-xs">{f.size}</div>
                        </div>
                        {f.status === "done" ? (
                          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                        ) : (
                          <span className="text-[#6B7280] text-xs shrink-0">{Math.round(f.progress)}%</span>
                        )}
                      </div>
                      {f.status === "uploading" && (
                        <div className="h-1 bg-[#1E1E35] rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all duration-300"
                            style={{ width: `${f.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowUpload(false); setUploadedFiles([]); }}
                  className="flex-1 py-2.5 border border-[#1E1E35] text-[#9CA3AF] rounded-xl hover:bg-[#131320] transition-colors text-sm"
                >
                  Отмена
                </button>
                <button className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors text-sm font-medium">
                  Продолжить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
