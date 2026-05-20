import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Database,
  FileSpreadsheet,
  History,
  PlayCircle,
  ReceiptText,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import { fetchLastUpload, uploadDemoRoyaltyReport, uploadRoyaltyReport } from "../api/uploadsApi";
import { fmtNumber } from "../lib/format";

interface UploadResult {
  upload_id: number;
  status: string;
  rows_total: number;
  rows_success: number;
  rows_failed: number;
  errors: Array<{ row: number; message: string }>;
  created_transactions: number;
  created_track_stats: number;
  updated_track_stats: number;
  message?: string;
}

const expectedColumns = [
  "artist_name",
  "track_title",
  "isrc",
  "platform",
  "period",
  "streams",
  "gross_revenue",
  "currency",
];

const flow = [
  {
    icon: FileSpreadsheet,
    title: "Отчет платформы",
    text: "CSV или Excel с треками, платформами, стримами и начисленной выручкой.",
  },
  {
    icon: Database,
    title: "Расчет роялти",
    text: "Система сопоставляет артиста, трек и платформу, затем считает долю артиста и лейбла.",
  },
  {
    icon: WalletCards,
    title: "Финансы",
    text: "В каталоге обновляется статистика, а в балансе появляются доходные операции к выплате.",
  },
];

const failedResult: UploadResult = {
  upload_id: 0,
  status: "failed",
  rows_total: 0,
  rows_success: 0,
  rows_failed: 0,
  errors: [],
  created_transactions: 0,
  created_track_stats: 0,
  updated_track_stats: 0,
  message: "Не удалось обработать отчет. Проверьте формат файла и повторите загрузку.",
};

export function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<"file" | "demo" | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { data: lastUpload } = useQuery({ queryKey: ["last-upload"], queryFn: fetchLastUpload });

  function refreshReports() {
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["tracks"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["analytics"] });
    qc.invalidateQueries({ queryKey: ["last-upload"] });
  }

  function handleFile(nextFile: File) {
    setFile(nextFile);
    setResult(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const nextFile = e.dataTransfer.files[0];
    if (nextFile) handleFile(nextFile);
  }

  async function runUpload(mode: "file" | "demo") {
    if (mode === "file" && !file) return;
    setLoading(mode);
    try {
      const data = mode === "file" && file ? await uploadRoyaltyReport(file) : await uploadDemoRoyaltyReport();
      setResult(data);
      refreshReports();
    } catch {
      setResult(failedResult);
    } finally {
      setLoading(null);
    }
  }

  const isSuccess = result?.status === "completed";

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0D12]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 p-6">
        <header className="flex flex-col gap-4 border-b border-[#202633] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8B93A3]">Финансовый импорт</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Загрузка отчетов по роялти</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#A5ADBA]">
              Раздел превращает отчет дистрибьютора в рабочие данные продукта: стримы по трекам,
              начисления артиста, доходы лейбла и операции в балансе.
            </p>
          </div>

          <button
            onClick={() => runUpload("demo")}
            disabled={Boolean(loading)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2F6FED] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3D7EFF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlayCircle size={17} />
            {loading === "demo" ? "Обрабатываем демо-отчет..." : "Запустить демо-импорт"}
          </button>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          {flow.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-lg border border-[#202633] bg-[#10141D] p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#151B26] text-[#6FA1FF]">
                    <Icon size={18} />
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#747D8C]">Шаг {index + 1}</div>
                </div>
                <h2 className="text-sm font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-5 text-[#8B93A3]">{item.text}</p>
              </div>
            );
          })}
        </section>

        {lastUpload && (
          <section className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
            <div className="mb-4 flex items-center gap-2">
              <History size={16} className="text-[#6FA1FF]" />
              <h2 className="text-base font-semibold text-white">Последний импорт</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <LastUploadStat
                label="Файл"
                value={lastUpload.filename}
                hint={lastUpload.created_at ? new Date(lastUpload.created_at).toLocaleString("ru-RU") : undefined}
              />
              <LastUploadStat label="Строк обработано" value={fmtNumber(lastUpload.rows_success)} hint={`из ${fmtNumber(lastUpload.rows_total)}`} />
              <LastUploadStat label="Ошибок" value={fmtNumber(lastUpload.rows_failed)} tone={lastUpload.rows_failed > 0 ? "text-red-300" : "text-emerald-300"} />
              <LastUploadStat
                label="Статус"
                value={lastUpload.status === "completed" ? "Завершен" : "С ошибками"}
                tone={lastUpload.status === "completed" ? "text-emerald-300" : "text-amber-300"}
              />
            </div>
          </section>
        )}

        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-[#202633] bg-[#10141D]">
            <div className="border-b border-[#202633] px-5 py-4">
              <h2 className="text-base font-semibold text-white">Импорт файла</h2>
              <p className="mt-1 text-sm text-[#8B93A3]">
                Выберите CSV/XLSX отчет. Для презентации подойдет файл `demo-data/sample_royalty_report_upload_excel.csv`.
              </p>
            </div>

            <div className="p-5">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-lg border border-dashed p-7 transition-colors ${
                  dragging ? "border-[#6FA1FF] bg-[#163151]" : "border-[#2A3242] bg-[#0B0F16] hover:border-[#3A465C]"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const nextFile = e.target.files?.[0];
                    if (nextFile) handleFile(nextFile);
                  }}
                />

                {file ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-300">
                      <FileSpreadsheet size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{file.name}</p>
                      <p className="mt-1 text-xs text-[#8B93A3]">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setResult(null);
                      }}
                      className="rounded-md p-2 text-[#8B93A3] hover:bg-red-500/10 hover:text-red-300"
                      aria-label="Убрать файл"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-[#151B26] text-[#8B93A3]">
                      <Upload size={22} />
                    </div>
                    <p className="text-sm font-semibold text-white">Сначала выберите CSV/XLSX отчет</p>
                    <p className="mt-1 max-w-md text-sm text-[#8B93A3]">
                      После выбора файла станет активна кнопка обработки. Система отправит файл на сервер и пересчитает роялти.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => runUpload("file")}
                disabled={Boolean(loading) || !file}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-semibold text-[#0B0D12] transition-colors hover:bg-[#E7EAF0] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Upload size={17} />
                {loading === "file" ? "Загружаем и считаем отчет..." : file ? "Загрузить и обработать" : "Сначала выберите файл"}
              </button>

              <div className="mt-4 rounded-lg border border-[#202633] bg-[#0B0F16] p-4">
                <p className="text-sm font-semibold text-white">Что делает кнопка</p>
                <div className="mt-3 grid gap-2 text-sm text-[#A5ADBA] md:grid-cols-3">
                  <div className="flex gap-2"><ArrowRight size={15} className="mt-0.5 shrink-0 text-[#6FA1FF]" /><span>Отправляет выбранный файл в backend.</span></div>
                  <div className="flex gap-2"><ArrowRight size={15} className="mt-0.5 shrink-0 text-[#6FA1FF]" /><span>Проверяет колонки, артиста, ISRC и платформу.</span></div>
                  <div className="flex gap-2"><ArrowRight size={15} className="mt-0.5 shrink-0 text-[#6FA1FF]" /><span>Обновляет статистику, баланс и доходные транзакции.</span></div>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-[#202633] bg-[#10141D]">
            <div className="border-b border-[#202633] px-5 py-4">
              <h2 className="text-base font-semibold text-white">Формат отчета</h2>
              <p className="mt-1 text-sm text-[#8B93A3]">Эти колонки обязательны для расчета.</p>
            </div>
            <div className="space-y-2 p-5">
              {expectedColumns.map((col) => (
                <div key={col} className="flex items-center justify-between rounded-md border border-[#202633] bg-[#0B0F16] px-3 py-2">
                  <span className="font-mono text-xs text-[#C5CBD6]">{col}</span>
                  <CheckCircle size={14} className="text-emerald-300" />
                </div>
              ))}
            </div>
          </aside>
        </section>

        {result && (
          <section className={`rounded-lg border bg-[#10141D] ${isSuccess ? "border-emerald-500/30" : "border-red-500/30"}`}>
            <div className="flex flex-col gap-4 border-b border-[#202633] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-md ${isSuccess ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
                  {isSuccess ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">{isSuccess ? "Отчет обработан" : "Отчет не обработан"}</h2>
                  {result.message && <p className="mt-1 text-sm text-[#A5ADBA]">{result.message}</p>}
                </div>
              </div>

              {isSuccess && (
                <div className="flex items-center gap-2 rounded-md border border-[#2A3242] bg-[#0B0F16] px-3 py-2 text-xs text-[#A5ADBA]">
                  <ReceiptText size={15} className="text-[#6FA1FF]" />
                  Данные обновлены в финансах и аналитике
                </div>
              )}
            </div>

            {result.rows_total > 0 && (
              <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[
                  { label: "Строк в отчете", value: result.rows_total },
                  { label: "Успешно", value: result.rows_success, tone: "text-emerald-300" },
                  { label: "Ошибок", value: result.rows_failed, tone: result.rows_failed > 0 ? "text-red-300" : "text-white" },
                  { label: "Новая статистика", value: result.created_track_stats },
                  { label: "Обновлено строк", value: result.updated_track_stats },
                  { label: "Транзакций", value: result.created_transactions },
                ].map(({ label, value, tone }) => (
                  <div key={label} className="rounded-lg border border-[#202633] bg-[#0B0F16] p-4">
                    <p className={`text-2xl font-semibold ${tone ?? "text-white"}`}>{fmtNumber(value)}</p>
                    <p className="mt-1 text-xs text-[#8B93A3]">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {isSuccess && (
              <div className="grid gap-3 border-t border-[#202633] px-5 py-4 md:grid-cols-3">
                {[
                  "Каталог получил новые стримы и выручку по трекам.",
                  "Баланс артиста получил доходные операции по роялти.",
                  "Повторная загрузка обновит период без дублей.",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-[#A5ADBA]">
                    <ArrowRight size={15} className="shrink-0 text-[#6FA1FF]" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="border-t border-[#202633] p-5">
                <p className="mb-2 text-sm font-semibold text-white">Ошибки в строках</p>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  {result.errors.map((error, index) => (
                    <div key={`${error.row}-${index}`} className="flex gap-2 text-sm">
                      <span className="shrink-0 text-[#A5ADBA]">Строка {error.row}:</span>
                      <span className="text-red-200">{error.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-[#202633] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="text-sm font-medium text-[#8B93A3] hover:text-white"
              >
                Сбросить результат
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function LastUploadStat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-[#202633] bg-[#0B0F16] p-4">
      <p className="text-xs text-[#8B93A3]">{label}</p>
      <p className={`mt-1 truncate text-lg font-semibold ${tone ?? "text-white"}`} title={value}>
        {value}
      </p>
      {hint && <p className="mt-0.5 truncate text-xs text-[#747D8C]">{hint}</p>}
    </div>
  );
}
