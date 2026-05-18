import {
  TrendingUp,
  TrendingDown,
  Music2,
  Wallet,
  PlayCircle,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Headphones,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDashboard } from "../../hooks/useDashboard";

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
}

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

function fmtStreams(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const PLATFORM_COLORS = ["#FFCC00", "#4F8DFF", "#1DB954", "#21A038", "#E42313", "#FC3C44"];
const PLATFORM_NAMES: Record<string, string> = { yandex: "Яндекс", vk: "VK", spotify: "Spotify", sber: "Звук", mts: "МТС", apple: "Apple" };

function StatCard({ label, value, sub, trend, icon: Icon, accent = false }: {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? "bg-violet-600/10 border-violet-500/30" : "bg-[#131320] border-[#1E1E35]"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? "bg-violet-600/30" : "bg-[#1A1A2E]"}`}>
          <Icon size={18} className={accent ? "text-violet-300" : "text-[#9CA3AF]"} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold mb-1 ${accent ? "text-white" : "text-white"}`}>{value}</div>
      <div className="text-[#6B7280] text-sm">{label}</div>
      {sub && <div className="text-[#4B5563] text-xs mt-1">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1A1A2E] border border-[#2A2A45] rounded-xl px-4 py-3 shadow-xl text-xs">
        <div className="text-[#9CA3AF] mb-2">{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[#9CA3AF]">{p.name}:</span>
            <span className="text-white font-semibold">{fmtRub(p.value)}</span>
          </div>
        ))}
        <div className="border-t border-[#2A2A45] mt-2 pt-2 flex justify-between">
          <span className="text-[#6B7280]">Итого</span>
          <span className="text-white font-bold">{fmtRub(payload.reduce((a: number, p: any) => a + p.value, 0))}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#6B7280] text-sm">Загружаем данные...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-medium mb-2">Не удалось загрузить дашборд</p>
          <p className="text-[#6B7280] text-sm">Проверьте, что backend запущен на порту 8000</p>
        </div>
      </div>
    );
  }

  const artist = data.artist;
  const summary = data.summary;
  const monthlyRevenue: any[] = data.monthly_revenue ?? [];
  const topTracks: any[] = data.top_tracks ?? [];
  const recentTx: any[] = data.recent_transactions?.slice(0, 4) ?? [];
  const approvals: any[] = [];

  const pieKeys = ["yandex", "vk", "spotify", "sber", "mts", "apple"];
  const lastMonth = monthlyRevenue[monthlyRevenue.length - 1] ?? {};
  const pieData = pieKeys
    .map((code, i) => ({ name: PLATFORM_NAMES[code] ?? code, value: lastMonth[code] ?? 0, color: PLATFORM_COLORS[i] }))
    .filter((d) => d.value > 0);

  const approvalColors: Record<string, string> = {
    in_review: "text-amber-400 bg-amber-400/10",
    approved: "text-emerald-400 bg-emerald-400/10",
    changes_requested: "text-red-400 bg-red-400/10",
  };
  const approvalLabels: Record<string, string> = {
    in_review: "В работе",
    approved: "Одобрено",
    changes_requested: "Правки",
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[#6B7280] text-sm mb-1">Добро пожаловать назад,</div>
          <h1 className="text-2xl font-bold text-white">
            {artist.name}{artist.real_name && <span className="text-[#6B7280] font-normal"> / {artist.real_name}</span>}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[#9CA3AF] text-sm mt-0.5">Данные из базы в реальном времени</div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Прослушиваний всего"
          value={fmtStreams(summary.total_streams)}
          sub="За всё время"
          icon={PlayCircle}
          accent
        />
        <StatCard
          label="Доход за период"
          value={fmtRub(summary.period_revenue)}
          sub={monthlyRevenue.length > 0 ? `Период: ${lastMonth.month}` : "Все периоды"}
          icon={TrendingUp}
        />
        <StatCard
          label="Баланс"
          value={fmtRub(artist.balance)}
          sub={`К выплате: ${fmtRub(artist.pending_payout)}`}
          icon={Wallet}
        />
        <StatCard
          label="Треков в каталоге"
          value={String(summary.tracks_count)}
          icon={Music2}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Revenue area chart */}
        <div className="col-span-2 bg-[#131320] rounded-2xl p-5 border border-[#1E1E35]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold">Доход по платформам</h2>
              <p className="text-[#6B7280] text-xs mt-0.5">По периодам · руб.</p>
            </div>
            <button onClick={() => onNavigate("analytics")} className="flex items-center gap-1 text-violet-400 text-xs hover:text-violet-300 transition-colors">
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
                        <stop offset="5%" stopColor={PLATFORM_COLORS[i]} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={PLATFORM_COLORS[i]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E35" />
                  <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="yandex" name="Яндекс" stroke={PLATFORM_COLORS[0]} fill="url(#grad-yandex)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="vk" name="VK" stroke={PLATFORM_COLORS[1]} fill="url(#grad-vk)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="spotify" name="Spotify" stroke={PLATFORM_COLORS[2]} fill="url(#grad-spotify)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3">
                {["Яндекс", "VK", "Spotify"].map((name, i) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[i] }} />
                    <span className="text-[#6B7280] text-xs">{name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[#4B5563] text-sm">Нет данных по периодам</div>
          )}
        </div>

        {/* Platform pie */}
        <div className="bg-[#131320] rounded-2xl p-5 border border-[#1E1E35]">
          <h2 className="text-white font-semibold mb-1">Разбивка по платформам</h2>
          <p className="text-[#6B7280] text-xs mb-4">По доходу за последний период</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtRub(v)} contentStyle={{ background: "#1A1A2E", border: "1px solid #2A2A45", borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.slice(0, 4).map((d, i) => {
                  const totalV = pieData.reduce((a, x) => a + x.value, 0);
                  const pct = totalV > 0 ? ((d.value / totalV) * 100).toFixed(1) : "0";
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-[#9CA3AF] text-xs">{d.name}</span>
                      </div>
                      <span className="text-white text-xs font-semibold">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-[#4B5563] text-sm">Нет данных</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Top tracks */}
        <div className="col-span-2 bg-[#131320] rounded-2xl p-5 border border-[#1E1E35]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Топ треков</h2>
            <button onClick={() => onNavigate("catalog")} className="flex items-center gap-1 text-violet-400 text-xs hover:text-violet-300 transition-colors">
              Все треки <ArrowRight size={12} />
            </button>
          </div>
          {topTracks.length > 0 ? (
            <div className="space-y-3">
              {topTracks.map((track: any, idx: number) => (
                <div key={track.id} className="flex items-center gap-3 group hover:bg-[#1A1A2E] rounded-xl p-2 -mx-2 transition-colors">
                  <span className="text-[#4B5563] text-sm font-mono w-5 text-center shrink-0">{idx + 1}</span>
                  <img
                    src={track.cover_url ?? ""}
                    alt={track.title}
                    className="w-9 h-9 rounded-lg object-cover shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(track.title)}&background=7C3AED&color=fff&size=36`; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{track.title}</div>
                    <div className="text-[#6B7280] text-xs">{track.isrc ?? "—"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-white text-sm font-semibold">{fmtStreams(track.streams)}</div>
                    <div className="text-emerald-400 text-xs">{fmtRub(track.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[#4B5563] text-sm text-center py-8">Треки не найдены</div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recent activity */}
          <div className="bg-[#131320] rounded-2xl p-5 border border-[#1E1E35]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Последние операции</h2>
              <button onClick={() => onNavigate("balance")} className="text-violet-400 text-xs hover:text-violet-300 transition-colors">
                Все
              </button>
            </div>
            {recentTx.length > 0 ? (
              <div className="space-y-3">
                {recentTx.map((tx: any) => (
                  <div key={tx.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[#9CA3AF] text-xs leading-snug truncate">{tx.description}</div>
                      <div className="text-[#4B5563] text-xs mt-0.5">{new Date(tx.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</div>
                    </div>
                    <div className={`text-sm font-semibold shrink-0 ${tx.amount > 0 ? "text-emerald-400" : "text-white"}`}>
                      {tx.amount > 0 ? "+" : ""}{fmtRub(Math.abs(tx.amount))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[#4B5563] text-sm text-center py-4">Нет операций</div>
            )}
          </div>

          {/* Approvals placeholder */}
          <div className="bg-[#131320] rounded-2xl p-5 border border-[#1E1E35]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Согласования</h2>
              <button onClick={() => onNavigate("approvals")} className="text-violet-400 text-xs hover:text-violet-300 transition-colors">Все</button>
            </div>
            <p className="text-[#4B5563] text-xs text-center py-2">Перейдите в раздел «Согласования»</p>
          </div>
        </div>
      </div>
    </div>
  );
}
