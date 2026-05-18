import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadRoyaltyReport } from "../api/uploadsApi";
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet, X } from "lucide-react";
import { fmtNumber, fmtRub } from "../lib/format";

interface UploadResult {
  upload_id: number;
  status: string;
  rows_total: number;
  rows_success: number;
  rows_failed: number;
  errors: Array<{ row: number; message: string }>;
  created_transactions: number;
  created_track_stats: number;
  message?: string;
}

export function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  function handleFile(f: File) {
    setFile(f);
    setResult(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    try {
      const data = await uploadRoyaltyReport(file);
      setResult(data);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["tracks"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    } catch (err: any) {
      setResult({ upload_id: 0, status: "failed", rows_total: 0, rows_success: 0, rows_failed: 0, errors: [], created_transactions: 0, created_track_stats: 0, message: "Ошибка загрузки файла" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Загрузка отчёта по роялти</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Импорт CSV/Excel-файла от платформ или выгрузки из Яндекс DataLens
        </p>
      </div>

      {/* Format info */}
      <div className="rounded-2xl p-4 border border-[#1E1E35] bg-[#0D1020]">
        <p className="text-[#9CA3AF] text-sm font-semibold mb-2">Ожидаемые колонки файла:</p>
        <div className="flex flex-wrap gap-2">
          {["artist_name", "track_title", "isrc", "platform", "period", "streams", "gross_revenue", "currency"].map(col => (
            <span key={col} className="text-xs bg-[#131320] border border-[#1E1E35] text-violet-300 rounded px-2 py-0.5 font-mono">{col}</span>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
          dragging ? "border-violet-500 bg-violet-500/5" : "border-[#1E1E35] bg-[#0D0D1A] hover:border-violet-600/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet size={32} className="text-emerald-400" />
            <div className="text-left">
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-[#6B7280] text-sm">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
              className="ml-4 text-[#4B5563] hover:text-red-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={32} className="text-[#4B5563] mx-auto mb-3" />
            <p className="text-white font-medium">Перетащите файл или нажмите для выбора</p>
            <p className="text-[#6B7280] text-sm mt-1">CSV, XLSX, XLS</p>
          </>
        )}
      </div>

      {file && !result && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-colors"
        >
          {loading ? "Обрабатываем файл..." : "Загрузить и обработать"}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border p-5 ${
          result.status === "completed" ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {result.status === "completed"
              ? <CheckCircle size={24} className="text-emerald-400" />
              : <AlertCircle size={24} className="text-red-400" />
            }
            <div>
              <p className="text-white font-semibold">
                {result.status === "completed" ? "Файл обработан успешно" : "Ошибка обработки"}
              </p>
              {result.message && <p className="text-[#9CA3AF] text-sm">{result.message}</p>}
            </div>
          </div>

          {result.rows_total > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Всего строк", value: fmtNumber(result.rows_total) },
                { label: "Успешно", value: fmtNumber(result.rows_success), ok: true },
                { label: "Ошибок", value: fmtNumber(result.rows_failed), err: result.rows_failed > 0 },
                { label: "Транзакций создано", value: fmtNumber(result.created_transactions) },
              ].map(({ label, value, ok, err }) => (
                <div key={label} className="rounded-xl p-3 bg-[#131320] border border-[#1E1E35]">
                  <p className={`text-xl font-bold ${ok ? "text-emerald-400" : err ? "text-red-400" : "text-white"}`}>{value}</p>
                  <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {result.errors.length > 0 && (
            <div>
              <p className="text-[#9CA3AF] text-sm font-semibold mb-2">Ошибки ({result.errors.length}):</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-[#6B7280] shrink-0">Строка {e.row}:</span>
                    <span className="text-red-400">{e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => { setFile(null); setResult(null); }}
            className="mt-4 text-sm text-[#6B7280] hover:text-white transition-colors"
          >
            Загрузить ещё один файл
          </button>
        </div>
      )}
    </div>
  );
}
