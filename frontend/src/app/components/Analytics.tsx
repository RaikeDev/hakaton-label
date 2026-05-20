import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import { Coins, Database, ExternalLink, Gauge, Globe, Radio, TrendingDown, TrendingUp } from "lucide-react";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useDashboard } from "../../hooks/useDashboard";

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

function fmtStreams(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

type PeriodFilter = "last" | "quarter" | "all";

const periodOptions: Array<{ id: PeriodFilter; label: string }> = [
  { id: "last", label: "Последний период" },
  { id: "quarter", label: "3 периода" },
  { id: "all", label: "Все периоды" },
];

const PLATFORM_COLORS: Record<string, string> = {
  yandex: "#FFCC00",
  vk: "#4F8DFF",
  spotify: "#1DB954",
  sber: "#21A038",
  mts: "#E42313",
  apple: "#FC3C44",
};

const geoData = [
  { country: "Россия", pct: 68.2, streams: 11_800_000 },
  { country: "Казахстан", pct: 12.4, streams: 2_100_000 },
  { country: "Беларусь", pct: 5.3, streams: 918_000 },
  { country: "Германия", pct: 3.0, streams: 520_000 },
  { country: "Другие", pct: 11.1, streams: 693_000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[#2A3242] bg-[#111722] px-4 py-3 text-xs shadow-xl">
      {label && <div className="mb-1 text-[#8B93A3]">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill || p.stroke }} />
          <span className="text-[#B5BCC9]">{p.name}</span>
          <span className="ml-auto font-semibold text-white">
            {typeof p.value === "number" && p.value > 5000 ? fmtRub(p.value) : typeof p.value === "number" && p.value > 1000 ? fmtStreams(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function Analytics() {
  const [period, setPeriod] = useState<PeriodFilter>("quarter");
  const { data: analyticsData, isLoading } = useAnalytics();
  const { data: dashData } = useDashboard();
  const datalensUrl = dashData?.artist?.datalens_url as string | null | undefined;
  const allMonths: any[] = dashData?.monthly_revenue ?? [];
  const monthlyRevenue = period === "last" ? allMonths.slice(-1) : period === "quarter" ? allMonths.slice(-3) : allMonths;
  const periodLabel = periodOptions.find((option) => option.id === period)?.label ?? "3 периода";

  const streamsByPlatform: any[] = useMemo(
    () =>
      (analyticsData?.platforms ?? []).map((p: any) => ({
        name: p.platform,
        code: p.code,
        streams: p.streams,
        revenue: p.revenue,
        rpm: p.streams > 0 ? (p.revenue / p.streams) * 1000 : 0,
        color: PLATFORM_COLORS[p.code] ?? "#888",
      })),
    [analyticsData],
  );

  const totalStreams = streamsByPlatform.reduce((a, p) => a + p.streams, 0);
  const totalRevenue = streamsByPlatform.reduce((a, p) => a + p.revenue, 0);
  const avgRpm = totalStreams > 0 ? (totalRevenue / totalStreams) * 1000 : 0;

  const last = allMonths.at(-1);
  const prev = allMonths.at(-2);
  const revenueGrowth = prev && prev.total > 0 ? ((last.total - prev.total) / prev.total) * 100 : 0;
  const streamsGrowth = prev && prev.streams > 0 ? ((last.streams - prev.streams) / prev.streams) * 100 : 0;

  const cumulative = useMemo(() => {
    let run = 0;
    return monthlyRevenue.map((m) => {
      run += m.total ?? 0;
      return { month: m.month, cumulative: Math.round(run) };
    });
  }, [monthlyRevenue]);

  const rpmData = useMemo(() => [...streamsByPlatform].sort((a, b) => b.rpm - a.rpm), [streamsByPlatform]);
  const radarData = useMemo(
    () => streamsByPlatform.map((p) => ({ platform: p.name, share: totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0 })),
    [streamsByPlatform, totalRevenue],
  );
  const donutData = useMemo(() => [...streamsByPlatform].sort((a, b) => b.revenue - a.revenue), [streamsByPlatform]);

  const topTracks = (analyticsData?.tracks ?? []) as any[];
  const maxTrackStreams = Math.max(...topTracks.map((t) => t.streams), 1);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Аналитика</h1>
          <p className="mt-1 text-sm text-[#8B93A3]">Данные по всем платформам · {periodLabel.toLowerCase()}</p>
        </div>
        <div className="flex rounded-md border border-[#2A3242] bg-[#111722] p-1">
          {periodOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setPeriod(option.id)}
              className={`h-8 rounded px-3 text-xs font-medium transition-colors ${
                period === option.id ? "bg-[#2F6FED] text-white" : "text-[#8B93A3] hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Kpi label="Всего прослушиваний" value={fmtStreams(totalStreams)} trend={streamsGrowth} icon={Radio} />
        <Kpi label="Общий доход" value={fmtRub(totalRevenue)} trend={revenueGrowth} icon={TrendingUp} />
        <Kpi label="Доход на 1000 (RPM)" value={fmtRub(avgRpm)} icon={Gauge} hint="Средняя ставка по каталогу" />
        <Kpi label="Активных треков" value={String(dashData?.summary?.tracks_count ?? 0)} icon={Globe} hint="В каталоге лейбла" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Доход по месяцам" subtitle="Все платформы · руб.">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyRevenue} margin={{ left: -20, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#202633" />
              <XAxis dataKey="month" tick={{ fill: "#747D8C", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#747D8C", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
              <Bar dataKey="yandex" name="Яндекс" stackId="a" fill={PLATFORM_COLORS.yandex} />
              <Bar dataKey="vk" name="VK" stackId="a" fill={PLATFORM_COLORS.vk} />
              <Bar dataKey="spotify" name="Spotify" stackId="a" fill={PLATFORM_COLORS.spotify} />
              <Bar dataKey="sber" name="Звук" stackId="a" fill={PLATFORM_COLORS.sber} />
              <Bar dataKey="mts" name="МТС" stackId="a" fill={PLATFORM_COLORS.mts} />
              <Bar dataKey="apple" name="Apple" stackId="a" fill={PLATFORM_COLORS.apple} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Накопленный доход" subtitle="Нарастающий итог за выбранный период">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={cumulative} margin={{ left: -10, right: 5 }}>
              <defs>
                <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#202633" />
              <XAxis dataKey="month" tick={{ fill: "#747D8C", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#747D8C", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cumulative" name="Накоплено" stroke="#22C55E" fill="url(#cumGrad)" strokeWidth={2} dot={{ r: 2, fill: "#22C55E" }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Тренд дохода по платформам" subtitle="Сравнение топ-площадок по месяцам">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyRevenue} margin={{ left: -20, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#202633" />
              <XAxis dataKey="month" tick={{ fill: "#747D8C", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#747D8C", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#8B93A3" }} />
              <Line type="monotone" dataKey="yandex" name="Яндекс" stroke={PLATFORM_COLORS.yandex} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="vk" name="VK" stroke={PLATFORM_COLORS.vk} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="spotify" name="Spotify" stroke={PLATFORM_COLORS.spotify} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Профиль площадок" subtitle="Доля каждой площадки в доходе, %">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} outerRadius={95}>
              <PolarGrid stroke="#202633" />
              <PolarAngleAxis dataKey="platform" tick={{ fill: "#8B93A3", fontSize: 11 }} />
              <Radar name="Доля дохода" dataKey="share" stroke="#4B8BFF" fill="#4B8BFF" fillOpacity={0.35} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Доход на 1000 прослушиваний" subtitle="Какая площадка платит больше за стрим (RPM)">
          <ResponsiveContainer width="100%" height={Math.max(180, rpmData.length * 38)}>
            <BarChart data={rpmData} layout="vertical" margin={{ left: 10, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#202633" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#747D8C", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)} ₽`} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fill: "#B5BCC9", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
              <Bar dataKey="rpm" name="RPM" radius={[0, 4, 4, 0]} barSize={18}>
                {rpmData.map((p) => (
                  <Cell key={p.code} fill={p.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Структура дохода" subtitle="Доля площадок за все время">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={donutData} dataKey="revenue" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2} stroke="none">
                  {donutData.map((p) => (
                    <Cell key={p.code} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {donutData.slice(0, 6).map((p) => (
                <div key={p.code} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="text-[#B5BCC9]">{p.name}</span>
                  <span className="ml-auto font-medium text-white">{totalRevenue > 0 ? `${((p.revenue / totalRevenue) * 100).toFixed(0)}%` : "0%"}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Coins size={17} className="text-[#8B93A3]" />
            <h2 className="font-semibold text-white">Лидеры каталога</h2>
          </div>
          {topTracks.length === 0 ? (
            <div className="py-6 text-center text-sm text-[#4A4469]">{isLoading ? "Загрузка..." : "Нет данных"}</div>
          ) : (
            <div className="space-y-3">
              {topTracks.slice(0, 6).map((track, index) => {
                const rpm = track.streams > 0 ? (track.revenue / track.streams) * 1000 : 0;
                const pct = (track.streams / maxTrackStreams) * 100;
                return (
                  <div key={track.track_id} className="rounded-lg border border-[#202633]/70 bg-[#0B0F16] p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#151B26] text-xs font-semibold text-[#8BB4FF]">{index + 1}</span>
                        <span className="truncate text-sm font-medium text-white">{track.title}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold text-white">{fmtRub(track.revenue)}</div>
                        <div className="text-xs text-[#8B93A3]">{fmtStreams(track.streams)} · RPM {fmtRub(rpm)}</div>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#202633]">
                      <div className="h-full rounded-full bg-[#4B8BFF]" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
          <h2 className="mb-1 font-semibold text-white">География</h2>
          <p className="mb-4 text-xs text-[#8B93A3]">По стране слушателя</p>
          <div className="space-y-3">
            {geoData.map((g) => (
              <div key={g.country}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-[#B5BCC9]">{g.country}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8B93A3]">{fmtStreams(g.streams)}</span>
                    <span className="w-10 text-right text-xs font-semibold text-white">{g.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#202633]">
                  <div className="h-full rounded-full bg-[#4B8BFF]" style={{ width: `${g.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DataLensSection url={datalensUrl} />
    </div>
  );
}

function Kpi({ label, value, trend, icon: Icon, hint }: { label: string; value: string; trend?: number; icon: typeof Radio; hint?: string }) {
  const showTrend = typeof trend === "number" && Math.abs(trend) >= 0.05;
  const up = (trend ?? 0) > 0;
  return (
    <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#151B26]">
          <Icon size={18} className="text-[#8B93A3]" />
        </div>
        {showTrend && (
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend ?? 0).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-[#B5BCC9]">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-[#747D8C]">{hint}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
      <h2 className="mb-1 font-semibold text-white">{title}</h2>
      <p className="mb-4 text-xs text-[#8B93A3]">{subtitle}</p>
      {children}
    </div>
  );
}

function DataLensSection({ url }: { url?: string | null }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#202633] bg-[#10141D]">
      <div className="flex flex-col gap-3 border-b border-[#202633] px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#151B26] px-2.5 py-1 text-xs font-semibold text-[#6FA1FF]">
            <Database size={13} />
            Yandex DataLens
          </div>
          <h2 className="font-semibold text-white">Расширенный BI-отчет</h2>
          <p className="mt-1 text-sm text-[#8B93A3]">Персональный дашборд DataLens, назначенный этому личному кабинету администратором.</p>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#2A3242] bg-[#0B0F16] px-3 text-sm font-medium text-[#C5CBD6] hover:border-[#3A465C] hover:text-white"
          >
            Открыть в DataLens
            <ExternalLink size={15} />
          </a>
        )}
      </div>

      {url ? (
        <div>
          <iframe title="DataLens dashboard" src={url} className="h-[520px] w-full bg-white" loading="lazy" />
          <div className="border-t border-[#202633] px-5 py-3 text-xs text-[#8B93A3]">
            Если отчет не отображается, проверьте публичный доступ в DataLens или откройте его отдельной кнопкой.
          </div>
        </div>
      ) : (
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {[
            "Соберите дашборд в Yandex DataLens.",
            "Скопируйте публичную (iframe) ссылку отчета.",
            "Администратор сохраняет ссылку артисту в разделе «Артисты».",
          ].map((step, index) => (
            <div key={step} className="rounded-md border border-[#202633] bg-[#0B0F16] p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#747D8C]">Шаг {index + 1}</div>
              <p className="text-sm leading-5 text-[#A5ADBA]">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
