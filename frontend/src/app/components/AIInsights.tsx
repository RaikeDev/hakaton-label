import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  LineChart,
  RefreshCw,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AiInsight, AiInsightType } from "../../api/aiApi";
import { useAiInsights } from "../../hooks/useAiInsights";

const filterLabels: Record<"all" | AiInsightType, string> = {
  all: "Все",
  opportunity: "Возможности",
  risk: "Риски",
  action: "Действия",
};

const insightStyles: Record<AiInsightType, { icon: typeof Sparkles; className: string; label: string; dot: string }> = {
  opportunity: {
    icon: ArrowUpRight,
    className: "border-emerald-400/20 bg-emerald-500/8 text-emerald-300",
    label: "Возможность",
    dot: "bg-emerald-400",
  },
  risk: {
    icon: AlertTriangle,
    className: "border-amber-400/20 bg-amber-500/8 text-amber-300",
    label: "Риск",
    dot: "bg-amber-400",
  },
  action: {
    icon: CheckCircle2,
    className: "border-violet-400/20 bg-violet-500/8 text-violet-300",
    label: "Действие",
    dot: "bg-violet-400",
  },
};

const platformNames: Record<string, string> = {
  yandex: "Яндекс Музыка",
  vk: "VK Музыка",
  spotify: "Spotify",
  sber: "Звук",
  mts: "МТС Музыка",
  apple: "Apple Music",
};

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
}

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(value?: string) {
  if (!value) return "сейчас";
  return new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function AIInsights() {
  const { data, isLoading, isError, isFetching, refetch } = useAiInsights();
  const [filter, setFilter] = useState<"all" | AiInsightType>("all");

  const insights = data?.insights ?? [];
  const filteredInsights = useMemo(
    () => insights.filter((insight) => filter === "all" || insight.type === filter),
    [filter, insights],
  );

  if (isLoading) return <AIInsightsSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-300 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={20} />
          </div>
          <p className="text-red-300 font-medium mb-2">Не удалось загрузить AI-инсайты</p>
          <p className="text-[#6C6890] text-sm mb-4">Проверьте, что backend запущен и доступен на порту 8000.</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#130F2E] border border-[#252356] px-4 py-2 text-sm text-white hover:border-violet-500 transition-colors"
          >
            <RefreshCw size={15} />
            Повторить
          </button>
        </div>
      </div>
    );
  }

  const summary = data.summary;
  const platforms = summary.platforms.map((platform) => ({
    ...platform,
    name: platformNames[platform.code] ?? platform.name,
  }));
  const topTrack = summary.top_tracks?.[0];
  const topPlatform = platforms?.[0];
  const totalPlatformRevenue = platforms.reduce((sum, platform) => sum + platform.revenue, 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#6C6890] text-sm mb-1">
            <Sparkles size={15} className="text-violet-300" />
            AI-анализ каталога
          </div>
          <h1 className="text-2xl font-bold text-white">{data.artist?.name ?? "Артист"}</h1>
          <p className="text-[#6C6890] text-sm mt-1">
            {data.artist?.genre ?? "Каталог"} · доля артиста {fmt(data.artist?.share_percent ?? 0)}%
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-[#6C6890] text-sm hidden sm:block">
            Обновлено: {fmtDate(summary.generated_at)}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl bg-[#130F2E] border border-[#252356] px-4 py-2 text-sm text-white hover:border-violet-500 disabled:opacity-60 transition-colors"
          >
            <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
            Обновить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard icon={Sparkles} label="Инсайтов" value={String(insights.length)} sub="С учетом рисков и возможностей" />
        <MetricCard icon={LineChart} label="Прослушиваний" value={fmt(summary.streams)} sub={`${fmt(summary.tracks_count)} треков в каталоге`} />
        <MetricCard icon={WalletCards} label="Доход каталога" value={fmtRub(summary.revenue)} sub={`Баланс: ${fmtRub(summary.cashflow?.balance ?? 0)}`} />
        <MetricCard icon={Clock} label="Периодов данных" value={String(summary.periods.length)} sub={summary.periods.at(-1) ?? "Нет периодов"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <section className="space-y-4">
          <div className="bg-[#0F0D22] rounded-2xl p-4 border border-[#1C1A3B]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-white font-semibold">Приоритетные выводы</h2>
                <p className="text-[#6C6890] text-xs mt-0.5">Сортировка идет от наиболее полезных сигналов к операционным пунктам.</p>
              </div>
              <div className="flex rounded-xl bg-[#09071C] border border-[#1C1A3B] p-1 overflow-x-auto">
                {(Object.keys(filterLabels) as Array<"all" | AiInsightType>).map((key) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      filter === key ? "bg-violet-500/18 text-white" : "text-[#9B98BC] hover:text-white"
                    }`}
                  >
                    {filterLabels[key]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredInsights.length > 0 ? (
            filteredInsights.map((insight, index) => <InsightPanel key={`${insight.title}-${index}`} insight={insight} />)
          ) : (
            <div className="bg-[#0F0D22] rounded-2xl p-8 border border-[#1C1A3B] text-center">
              <p className="text-[#9B98BC] text-sm">Нет инсайтов в выбранной категории</p>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="bg-[#0F0D22] rounded-2xl p-5 border border-[#1C1A3B]">
            <h2 className="text-white font-semibold mb-4">Следующие действия</h2>
            {data.actions.length > 0 ? (
              <div className="space-y-3">
                {data.actions.map((action, index) => (
                  <div key={action} className="flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-violet-500/12 text-violet-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-[#9B98BC] text-sm leading-snug">{action}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#4A4469] text-sm">Нет срочных действий</p>
            )}
          </div>

          <FocusBlock
            topTrack={topTrack}
            topPlatform={topPlatform}
            topPlatformShare={totalPlatformRevenue > 0 && topPlatform ? topPlatform.revenue / totalPlatformRevenue : 0}
          />

          <div className="bg-[#0F0D22] rounded-2xl p-5 border border-[#1C1A3B]">
            <h2 className="text-white font-semibold mb-4">Топ платформ</h2>
            <div className="space-y-4">
              {platforms.slice(0, 5).map((platform) => {
                const pct = totalPlatformRevenue > 0 ? (platform.revenue / totalPlatformRevenue) * 100 : 0;
                return (
                  <div key={platform.code}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="text-[#E5E7EB] text-sm truncate">{platform.name}</div>
                        <div className="text-[#4A4469] text-xs">{fmt(platform.streams)} стримов</div>
                      </div>
                      <div className="text-white text-sm font-semibold shrink-0">{fmtRub(platform.revenue)}</div>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1C1A3B] overflow-hidden">
                      <div className="h-full rounded-full bg-violet-400" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InsightPanel({ insight }: { insight: AiInsight }) {
  const style = insightStyles[insight.type];
  const Icon = style.icon;
  const confidence = Math.round((insight.confidence ?? 0) * 100);

  return (
    <article className="bg-[#0F0D22] rounded-2xl p-5 border border-[#1C1A3B]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${style.className}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[#6C6890] text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
            <span className="text-[#4A4469] text-xs">Уверенность {confidence}%</span>
          </div>
          <h3 className="text-white font-semibold text-lg leading-tight">{insight.title}</h3>
          <p className="text-[#9B98BC] text-sm leading-relaxed mt-2">{insight.description}</p>
        </div>
        <div className="md:text-right shrink-0 md:min-w-[128px]">
          <div className="text-white font-bold">{insight.metric}</div>
          <div className="h-1.5 rounded-full bg-[#1C1A3B] overflow-hidden mt-2">
            <div className="h-full rounded-full bg-violet-400" style={{ width: `${confidence}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}

function FocusBlock({
  topTrack,
  topPlatform,
  topPlatformShare,
}: {
  topTrack?: { title: string; streams: number; revenue: number };
  topPlatform?: { name: string; revenue: number };
  topPlatformShare: number;
}) {
  return (
    <div className="bg-[#0F0D22] rounded-2xl p-5 border border-[#1C1A3B]">
      <div className="flex items-center gap-2 mb-4">
        <Target size={17} className="text-violet-300" />
        <h2 className="text-white font-semibold">Фокус недели</h2>
      </div>
      <div className="space-y-4">
        <div>
          <div className="text-[#6C6890] text-xs mb-1">Трек для промо</div>
          <div className="text-white font-semibold truncate">{topTrack?.title ?? "Нет данных"}</div>
          <div className="text-[#9B98BC] text-xs mt-1">
            {topTrack ? `${fmt(topTrack.streams)} стримов · ${fmtRub(topTrack.revenue)}` : "Загрузите отчет роялти"}
          </div>
        </div>
        <div>
          <div className="text-[#6C6890] text-xs mb-1">Платформа для контроля</div>
          <div className="text-white font-semibold truncate">{topPlatform?.name ?? "Нет данных"}</div>
          <div className="text-[#9B98BC] text-xs mt-1">
            {topPlatform ? `${fmtRub(topPlatform.revenue)} · ${Math.round(topPlatformShare * 100)}% дохода` : "Нет платформенной аналитики"}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub }: { icon: typeof Sparkles; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl p-5 border bg-[#0F0D22] border-[#1C1A3B] min-w-0">
      <div className="w-9 h-9 rounded-xl bg-[#130F2E] flex items-center justify-center mb-3">
        <Icon size={18} className="text-[#9B98BC]" />
      </div>
      <div className="text-2xl font-bold text-white mb-1 truncate">{value}</div>
      <div className="text-[#6C6890] text-sm">{label}</div>
      <div className="text-[#4A4469] text-xs mt-1 truncate">{sub}</div>
    </div>
  );
}

function AIInsightsSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-36 rounded bg-[#1C1A3B] animate-pulse mb-3" />
          <div className="h-8 w-52 rounded bg-[#1C1A3B] animate-pulse" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-[#1C1A3B] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 rounded-2xl bg-[#0F0D22] border border-[#1C1A3B] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-36 rounded-2xl bg-[#0F0D22] border border-[#1C1A3B] animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-48 rounded-2xl bg-[#0F0D22] border border-[#1C1A3B] animate-pulse" />
          <div className="h-56 rounded-2xl bg-[#0F0D22] border border-[#1C1A3B] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
