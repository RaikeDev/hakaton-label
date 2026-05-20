import type { ElementType, ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Music2,
  PlayCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboard } from "../../hooks/useDashboard";

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

function fmtStreams(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const PLATFORM_COLORS = ["#EAB308", "#4B8BFF", "#22C55E", "#14B8A6", "#EF4444", "#F97316"];
const PLATFORM_NAMES: Record<string, string> = {
  yandex: "Яндекс",
  vk: "VK",
  spotify: "Spotify",
  sber: "Звук",
  mts: "МТС",
  apple: "Apple",
};

function StatCard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  icon: ElementType;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-5 ${accent ? "border-[#4B8BFF]/30 bg-[#4B8BFF]/10" : "border-[#202633] bg-[#10141D]"}`}>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#151B26]">
          <Icon size={18} className={accent ? "text-[#8BB4FF]" : "text-[#8B93A3]"} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${trend >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mb-1 text-2xl font-semibold text-white">{value}</div>
      <div className="text-sm text-[#B5BCC9]">{label}</div>
      {sub && <div className="mt-1 text-xs text-[#8B93A3]">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-[#2A3242] bg-[#111722] px-4 py-3 text-xs shadow-xl">
      <div className="mb-2 text-[#8B93A3]">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="mb-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#B5BCC9]">{p.name}:</span>
          <span className="font-semibold text-white">{fmtRub(p.value)}</span>
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t border-[#2A3242] pt-2">
        <span className="text-[#8B93A3]">Итого</span>
        <span className="font-semibold text-white">{fmtRub(payload.reduce((a: number, p: any) => a + p.value, 0))}</span>
      </div>
    </div>
  );
};

export function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#4B8BFF] border-t-transparent" />
          <p className="text-sm text-[#8B93A3]">Загружаем данные...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 font-medium text-red-300">Не удалось загрузить дашборд</p>
          <p className="text-sm text-[#8B93A3]">Проверьте, что backend запущен на порту 8000</p>
        </div>
      </div>
    );
  }

  const artist = data.artist;
  const summary = data.summary;
  const monthlyRevenue: any[] = data.monthly_revenue ?? [];
  const topTracks: any[] = data.top_tracks ?? [];
  const recentTx: any[] = data.recent_transactions?.slice(0, 4) ?? [];

  const pieKeys = ["yandex", "vk", "spotify", "sber", "mts", "apple"];
  const lastMonth = monthlyRevenue[monthlyRevenue.length - 1] ?? {};
  const pieData = pieKeys
    .map((code, i) => ({ name: PLATFORM_NAMES[code] ?? code, value: lastMonth[code] ?? 0, color: PLATFORM_COLORS[i] }))
    .filter((item) => item.value > 0);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-sm text-[#8B93A3]">Обзор артиста</div>
          <h1 className="text-2xl font-semibold text-white">
            {artist.name}
            {artist.real_name && <span className="font-normal text-[#8B93A3]"> / {artist.real_name}</span>}
          </h1>
        </div>
        <div className="rounded-md border border-[#202633] bg-[#10141D] px-4 py-2 text-right">
          <div className="text-xs text-[#8B93A3]">Источник данных</div>
          <div className="text-sm font-medium text-white">База в реальном времени</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Прослушиваний всего" value={fmtStreams(summary.total_streams)} sub="За все время" icon={PlayCircle} accent />
        <StatCard label="Доход за период" value={fmtRub(summary.period_revenue)} sub={monthlyRevenue.length > 0 ? `Период: ${lastMonth.month}` : "Все периоды"} icon={TrendingUp} />
        <StatCard label="Баланс" value={fmtRub(artist.balance)} sub={`К выплате: ${fmtRub(artist.pending_payout)}`} icon={Wallet} />
        <StatCard label="Треков в каталоге" value={String(summary.tracks_count)} icon={Music2} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-lg border border-[#202633] bg-[#10141D] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Доход по платформам</h2>
              <p className="mt-0.5 text-xs text-[#8B93A3]">По периодам, руб.</p>
            </div>
            <button onClick={() => onNavigate("analytics")} className="flex items-center gap-1 text-xs font-medium text-[#6FA1FF] transition-colors hover:text-[#8BB4FF]">
              Подробнее <ArrowRight size={12} />
            </button>
          </div>
          {monthlyRevenue.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    {["yandex", "vk", "spotify"].map((code, i) => (
                      <linearGradient key={code} id={`grad-${code}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PLATFORM_COLORS[i]} stopOpacity={0.22} />
                        <stop offset="95%" stopColor={PLATFORM_COLORS[i]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#202633" />
                  <XAxis dataKey="month" tick={{ fill: "#747D8C", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#747D8C", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="yandex" name="Яндекс" stroke={PLATFORM_COLORS[0]} fill="url(#grad-yandex)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="vk" name="VK" stroke={PLATFORM_COLORS[1]} fill="url(#grad-vk)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="spotify" name="Spotify" stroke={PLATFORM_COLORS[2]} fill="url(#grad-spotify)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-3 flex gap-4">
                {["Яндекс", "VK", "Spotify"].map((name, i) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: PLATFORM_COLORS[i] }} />
                    <span className="text-xs text-[#8B93A3]">{name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-[#747D8C]">Нет данных по периодам</div>
          )}
        </div>

        <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
          <h2 className="mb-1 font-semibold text-white">Платформы</h2>
          <p className="mb-4 text-xs text-[#8B93A3]">Доход за последний период</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtRub(v)} contentStyle={{ background: "#111722", border: "1px solid #2A3242", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {pieData.slice(0, 4).map((item, i) => {
                  const total = pieData.reduce((a, x) => a + x.value, 0);
                  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                        <span className="text-xs text-[#B5BCC9]">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-white">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex h-[140px] items-center justify-center text-sm text-[#747D8C]">Нет данных</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-lg border border-[#202633] bg-[#10141D] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Топ треков</h2>
            <button onClick={() => onNavigate("catalog")} className="flex items-center gap-1 text-xs font-medium text-[#6FA1FF] transition-colors hover:text-[#8BB4FF]">
              Все треки <ArrowRight size={12} />
            </button>
          </div>
          {topTracks.length > 0 ? (
            <div className="space-y-1">
              {topTracks.map((track: any, idx: number) => (
                <div key={track.id} className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-[#151B26]">
                  <span className="w-5 shrink-0 text-center font-mono text-sm text-[#747D8C]">{idx + 1}</span>
                  <img
                    src={track.cover_url ?? ""}
                    alt={track.title}
                    className="h-9 w-9 shrink-0 rounded-md object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(track.title)}&background=151B26&color=fff&size=36`;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{track.title}</div>
                    <div className="text-xs text-[#747D8C]">{track.isrc ?? "-"}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-white">{fmtStreams(track.streams)}</div>
                    <div className="text-xs text-emerald-300">{fmtRub(track.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[#747D8C]">Треки не найдены</div>
          )}
        </div>

        <div className="space-y-4">
          <SidePanel title="Последние операции" action="Все" onAction={() => onNavigate("balance")}>
            {recentTx.length > 0 ? (
              <div className="space-y-3">
                {recentTx.map((tx: any) => (
                  <div key={tx.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs leading-snug text-[#B5BCC9]">{tx.description}</div>
                      <div className="mt-0.5 text-xs text-[#747D8C]">{new Date(tx.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</div>
                    </div>
                    <div className={`shrink-0 text-sm font-semibold ${tx.amount > 0 ? "text-emerald-300" : "text-white"}`}>
                      {tx.amount > 0 ? "+" : ""}
                      {fmtRub(Math.abs(tx.amount))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-[#747D8C]">Нет операций</div>
            )}
          </SidePanel>

          <SidePanel title="Согласования" action="Все" onAction={() => onNavigate("approvals")}>
            <div className="space-y-3">
              <StatusLine icon={Clock} label="В работе" value="0" tone="amber" />
              <StatusLine icon={CheckCircle} label="Одобрено" value="0" tone="green" />
              <StatusLine icon={AlertCircle} label="Требуют внимания" value="0" tone="red" />
            </div>
          </SidePanel>
        </div>
      </div>
    </div>
  );
}

function SidePanel({ title, action, onAction, children }: { title: string; action: string; onAction: () => void; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-white">{title}</h2>
        <button onClick={onAction} className="text-xs font-medium text-[#6FA1FF] transition-colors hover:text-[#8BB4FF]">
          {action}
        </button>
      </div>
      {children}
    </div>
  );
}

function StatusLine({ icon: Icon, label, value, tone }: { icon: ElementType; label: string; value: string; tone: "amber" | "green" | "red" }) {
  const color = tone === "green" ? "text-emerald-300" : tone === "red" ? "text-red-300" : "text-amber-300";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-[#B5BCC9]">
        <Icon size={14} className={color} />
        {label}
      </div>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
