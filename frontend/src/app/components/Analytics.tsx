import { useState } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Globe, Users, Radio } from "lucide-react";
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

const PLATFORM_COLORS: Record<string, string> = {
  yandex: "#FFCC00", vk: "#4F8DFF", spotify: "#1DB954", sber: "#21A038", mts: "#E42313", apple: "#FC3C44",
};

const geoData = [
  { country: "Россия", pct: 68.2, streams: 11_800_000 },
  { country: "Казахстан", pct: 12.4, streams: 2_100_000 },
  { country: "Беларусь", pct: 5.3, streams: 918_000 },
  { country: "Германия", pct: 3.0, streams: 520_000 },
  { country: "Другие", pct: 11.1, streams: 693_000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#130F2E] border border-[#252356] rounded-xl px-4 py-3 shadow-xl text-xs">
        <div className="text-[#9B98BC] mb-1">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-white font-semibold">{typeof p.value === "number" && p.value > 1000 ? fmtStreams(p.value) : p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function Analytics() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const { data: analyticsData, isLoading } = useAnalytics();
  const { data: dashData } = useDashboard();

  const allMonths: any[] = dashData?.monthly_revenue ?? [];
  const monthlyRevenue = period === 90 ? allMonths : period === 30 ? allMonths.slice(-3) : allMonths.slice(-1);

  const streamsByPlatform: any[] = (analyticsData?.platforms ?? []).map((p: any) => ({
    name: p.platform,
    streams: p.streams,
    revenue: p.revenue,
    color: PLATFORM_COLORS[p.code] ?? "#888",
  }));

  const totalStreams = streamsByPlatform.reduce((a: number, p: any) => a + p.streams, 0);
  const totalRevenue = streamsByPlatform.reduce((a: number, p: any) => a + p.revenue, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {/* Header + Period filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Аналитика</h1>
          <p className="text-[#6C6890] text-sm mt-0.5">
            Данные по всем платформам · последние {period === 90 ? "3 месяца" : `${period} дней`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {([7, 30, 90] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? "bg-violet-600 text-white"
                  : "bg-[#0F0D22] border border-[#1C1A3B] text-[#6C6890] hover:text-white"
              }`}
            >
              {p === 7 ? "7 дней" : p === 30 ? "30 дней" : "3 месяца"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Всего прослушиваний", value: fmtStreams(totalStreams), trend: +8.4, icon: Radio },
          { label: "Общий доход", value: fmtRub(totalRevenue), trend: +4.2, icon: TrendingUp },
          { label: "Уникальных слушателей", value: "1.2M", trend: +11.3, icon: Users },
          { label: "Активных треков", value: "8", trend: 0, icon: Globe },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-[#0F0D22] border border-[#1C1A3B] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#130F2E] flex items-center justify-center">
                  <Icon size={18} className="text-[#9B98BC]" />
                </div>
                {kpi.trend !== 0 && (
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${kpi.trend > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {kpi.trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {Math.abs(kpi.trend)}%
                  </div>
                )}
              </div>
              <div className="text-white text-2xl font-bold">{kpi.value}</div>
              <div className="text-[#6C6890] text-sm mt-1">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0F0D22] border border-[#1C1A3B] rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1">Доход по месяцам</h2>
          <p className="text-[#6C6890] text-xs mb-4">Все платформы · руб.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyRevenue} margin={{ left: -20, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C1A3B" />
              <XAxis dataKey="month" tick={{ fill: "#6C6890", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6C6890", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="yandex" name="Яндекс" stackId="a" fill={PLATFORM_COLORS.yandex} />
              <Bar dataKey="vk" name="VK" stackId="a" fill={PLATFORM_COLORS.vk} />
              <Bar dataKey="spotify" name="Spotify" stackId="a" fill={PLATFORM_COLORS.spotify} />
              <Bar dataKey="sber" name="СберЗвук" stackId="a" fill={PLATFORM_COLORS.sber} />
              <Bar dataKey="mts" name="МТС" stackId="a" fill={PLATFORM_COLORS.mts} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#0F0D22] border border-[#1C1A3B] rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1">Прослушивания по месяцам</h2>
          <p className="text-[#6C6890] text-xs mb-4">Все платформы</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyRevenue} margin={{ left: -15, right: 5 }}>
              <defs>
                <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C1A3B" />
              <XAxis dataKey="month" tick={{ fill: "#6C6890", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6C6890", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtStreams(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="streams" stroke="#8B5CF6" fill="url(#streamGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-[#0F0D22] border border-[#1C1A3B] rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1">Прослушивания по платформам</h2>
          <p className="text-[#6C6890] text-xs mb-4">Суммарно за всё время</p>
          <div className="space-y-4">
            {streamsByPlatform.sort((a, b) => b.streams - a.streams).map((p) => {
              const maxStreams = streamsByPlatform[0]?.streams ?? 1;
              const pct = (p.streams / maxStreams) * 100;
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-white text-sm font-medium">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white text-sm font-semibold">{fmtStreams(p.streams)}</span>
                      <span className="text-[#6C6890] text-xs ml-2">· {fmtRub(p.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#1C1A3B] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#0F0D22] border border-[#1C1A3B] rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1">География</h2>
          <p className="text-[#6C6890] text-xs mb-4">По стране слушателя</p>
          <div className="space-y-3">
            {geoData.map((g) => (
              <div key={g.country}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#9B98BC] text-sm">{g.country}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#6C6890] text-xs">{fmtStreams(g.streams)}</span>
                    <span className="text-white text-xs font-semibold w-10 text-right">{g.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#1C1A3B] rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${g.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Track performance table */}
      <div className="bg-[#0F0D22] border border-[#1C1A3B] rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">Эффективность треков</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#4A4469] text-xs border-b border-[#1C1A3B]">
                <th className="text-left pb-3 font-medium">Трек</th>
                <th className="text-right pb-3 font-medium">Прослушивания</th>
                <th className="text-right pb-3 font-medium">Доход</th>
              </tr>
            </thead>
            <tbody>
              {(analyticsData?.tracks ?? []).slice(0, 5).map((track: any) => (
                <tr key={track.track_id} className="border-b border-[#1C1A3B]/50 hover:bg-[#130F2E]/50 transition-colors">
                  <td className="py-3 text-white font-medium">{track.title}</td>
                  <td className="py-3 text-right text-[#9B98BC]">{fmtStreams(track.streams)}</td>
                  <td className="py-3 text-right text-white font-semibold">{fmtRub(track.revenue)}</td>
                </tr>
              ))}
              {(analyticsData?.tracks ?? []).length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-[#4A4469]">{isLoading ? "Загрузка..." : "Нет данных"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}