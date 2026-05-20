import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Database, ExternalLink, FileSpreadsheet, Link2, Music2, Percent, Save, Upload, Users } from "lucide-react";
import { updateArtistDataLensUrl } from "../../api/artistsApi";
import { useArtists } from "../../hooks/useArtists";
import { fmtDate, fmtNumber } from "../../lib/format";
import { Avatar } from "./ui/InitialsAvatar";

interface ArtistsProps {
  onOpenUpload: () => void;
}

export function Artists({ onOpenUpload }: ArtistsProps) {
  const { data: artists = [], isLoading } = useArtists();
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [savedArtistId, setSavedArtistId] = useState<number | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    setUrls(Object.fromEntries(artists.map((artist) => [artist.id, artist.datalens_url ?? ""])));
  }, [artists]);

  const saveDataLens = useMutation({
    mutationFn: ({ artistId, url }: { artistId: number; url: string }) => updateArtistDataLensUrl(artistId, url),
    onSuccess: (_data, variables) => {
      setSavedArtistId(variables.artistId);
      qc.invalidateQueries({ queryKey: ["artists"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Ссылка DataLens сохранена", { description: "Отчет появится в аналитике этого ЛК." });
    },
    onError: () => toast.error("Не удалось сохранить ссылку DataLens"),
  });

  const avgShare = artists.length
    ? artists.reduce((sum, artist) => sum + artist.artist_share_percent, 0) / artists.length
    : 0;
  const activeContracts = artists.filter((artist) => artist.contract_since).length;
  const linkedReports = artists.filter((artist) => artist.datalens_url).length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0D12]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 p-6">
        <header className="flex flex-col gap-4 border-b border-[#202633] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8B93A3]">Администрирование</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Артисты лейбла</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#A5ADBA]">
              Здесь хранится связь между личным кабинетом и готовым DataLens-отчетом. DataLens строит отчет отдельно, а платформа показывает нужную ссылку конкретному артисту.
            </p>
          </div>

          <button
            onClick={onOpenUpload}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2F6FED] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3D7EFF]"
          >
            <Upload size={17} />
            Загрузить отчет
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard icon={Users} label="Артистов" value={isLoading ? "..." : fmtNumber(artists.length)} />
          <MetricCard icon={Percent} label="Средняя доля артиста" value={isLoading ? "..." : `${avgShare.toFixed(0)}%`} />
          <MetricCard icon={CalendarDays} label="Договоров в базе" value={isLoading ? "..." : fmtNumber(activeContracts)} />
          <MetricCard icon={Link2} label="DataLens привязано" value={isLoading ? "..." : fmtNumber(linkedReports)} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-lg border border-[#263247] bg-[#0F1622] p-5">
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-[#2A3242] bg-[#0B0F16] px-3 py-1.5 text-xs font-semibold text-[#C5CBD6]">
              <Database size={14} className="text-[#6FA1FF]" />
              Yandex DataLens
            </div>
            <h2 className="text-base font-semibold text-white">Управление BI-отчетами по личным кабинетам</h2>
            <p className="mt-2 text-sm leading-6 text-[#A5ADBA]">
              Администратор вставляет ссылку на готовый DataLens-дашборд в строку артиста. После сохранения ссылка попадает в API и становится доступна в аналитике только этого ЛК.
            </p>
          </div>
          <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">Что уже реализовано</h3>
            <div className="space-y-3">
              {[
                "Поле datalens_url хранится у артиста в PostgreSQL.",
                "Backend отдает ссылку в /api/artists и /api/dashboard.",
                "Frontend показывает персональный iframe в аналитике.",
              ].map((item) => (
                <div key={item} className="flex gap-2 text-sm text-[#A5ADBA]">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#202633] bg-[#10141D]">
          <div className="flex flex-col gap-2 border-b border-[#202633] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Привязка отчетов к ЛК</h2>
              <p className="mt-1 text-sm text-[#8B93A3]">Вставьте публичную ссылку или iframe URL из DataLens для нужного артиста.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border border-[#2A3242] bg-[#0B0F16] px-3 py-2 text-xs text-[#A5ADBA]">
              <FileSpreadsheet size={15} className="text-[#6FA1FF]" />
              artist_id определяет, какой отчет увидит пользователь
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-[#202633] text-xs uppercase tracking-[0.12em] text-[#747D8C]">
                <tr>
                  <th className="px-5 py-3 font-medium">Артист</th>
                  <th className="px-5 py-3 font-medium">Жанр</th>
                  <th className="px-5 py-3 text-right font-medium">Доля</th>
                  <th className="px-5 py-3 font-medium">Договор</th>
                  <th className="px-5 py-3 font-medium">DataLens URL</th>
                  <th className="px-5 py-3 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202633]">
                {isLoading && (
                  <tr>
                    <td className="px-5 py-8 text-center text-[#8B93A3]" colSpan={6}>Загружаем артистов...</td>
                  </tr>
                )}

                {!isLoading && artists.length === 0 && (
                  <tr>
                    <td className="px-5 py-8 text-center text-[#8B93A3]" colSpan={6}>Артисты пока не добавлены.</td>
                  </tr>
                )}

                {artists.map((artist) => {
                  const currentUrl = urls[artist.id] ?? "";
                  const isSaving = saveDataLens.isPending && saveDataLens.variables?.artistId === artist.id;

                  return (
                    <tr key={artist.id} className="hover:bg-[#151B26]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={artist.stage_name} src={artist.avatar_url} size={40} />
                          <div>
                            <div className="font-semibold text-white">{artist.stage_name}</div>
                            <div className="mt-0.5 text-xs text-[#8B93A3]">ID {artist.id} · {artist.real_name ?? "Юридическое имя не указано"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#C5CBD6]">{artist.genre ?? "-"}</td>
                      <td className="px-5 py-4 text-right font-semibold text-white">{artist.artist_share_percent}%</td>
                      <td className="px-5 py-4 text-[#C5CBD6]">{fmtDate(artist.contract_since)}</td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-[360px] items-center gap-2">
                          <input
                            value={currentUrl}
                            onChange={(event) => setUrls((prev) => ({ ...prev, [artist.id]: event.target.value }))}
                            placeholder="https://datalens.yandex.ru/..."
                            className="h-9 min-w-0 flex-1 rounded-md border border-[#2A3242] bg-[#0B0F16] px-3 text-sm text-white outline-none placeholder:text-[#586173] focus:border-[#4B8BFF]"
                          />
                          {artist.datalens_url && (
                            <a
                              href={artist.datalens_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#2A3242] text-[#A5ADBA] hover:border-[#3A465C] hover:text-white"
                              aria-label="Открыть DataLens"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setSavedArtistId(null);
                              saveDataLens.mutate({ artistId: artist.id, url: currentUrl });
                            }}
                            disabled={isSaving}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-white px-3 text-xs font-semibold text-[#0B0D12] hover:bg-[#E7EAF0] disabled:opacity-50"
                          >
                            <Save size={14} />
                            {isSaving ? "Сохраняем" : "Сохранить"}
                          </button>
                        </div>
                        {saveDataLens.isError && saveDataLens.variables?.artistId === artist.id && (
                          <p className="mt-2 text-xs text-red-300">Не удалось сохранить. Проверьте, что ссылка начинается с http:// или https://.</p>
                        )}
                        {savedArtistId === artist.id && !isSaving && (
                          <p className="mt-2 text-xs text-emerald-300">Ссылка сохранена. Отчет появится в аналитике этого ЛК.</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${artist.datalens_url ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-[#2A3242] bg-[#0B0F16] text-[#8B93A3]"}`}>
                          <Music2 size={13} /> {artist.datalens_url ? "Отчет привязан" : "Отчет не привязан"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#202633] bg-[#10141D] p-4">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-[#151B26] text-[#6FA1FF]">
        <Icon size={18} />
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-[#8B93A3]">{label}</p>
    </div>
  );
}
