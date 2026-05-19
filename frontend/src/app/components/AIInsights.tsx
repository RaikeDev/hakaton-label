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
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    label: "Возможность",
    dot: "bg-emerald-400",
  },
  risk: {
    icon: AlertTriangle,
    className: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    label: "Риск",
    dot: "bg-amber-400",
  },
  action: {
    icon: CheckCircle2,
    className: "border-[#4B8BFF]/30 bg-[#4B8BFF]/10 text-[#8BB4FF]",
    label: "Действие",
    dot: "bg-[#4B8BFF]",
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
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-red-500/10 text-red-300">
            <AlertTriangle size={20} />
          </div>
          <p className="mb-2 font-medium text-red-300">Не удалось загрузить инсайты</p>
          <p className="mb-4 text-sm text-[#8B93A3]">Проверьте, что backend запущен и доступен на порту 8000.</p>
          <button
            onClick={() => refetch()}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#2A3242] bg-[#111722] px-4 text-sm font-medium text-white transition-colors hover:bg-[#151D2A]"
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
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-[#8B93A3]">
            <Sparkles size={15} className="text-[#8B93A3]" />
            Анализ каталога
          </div>
          <h1 className="text-2xl font-semibold text-white">{data.artist?.name ?? "Артист"}</h1>
          <p className="mt-1 text-sm text-[#8B93A3]">
            {data.artist?.genre ?? "Каталог"} · доля артиста {fmt(data.artist?.share_percent ?? 0)}%
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-sm text-[#8B93A3] sm:block">
            Обновлено: {fmtDate(summary.generated_at)}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#2A3242] bg-[#111722] px-4 text-sm font-medium text-white transition-colors hover:bg-[#151D2A] disabled:opacity-60"
          >
            <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
            Обновить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Sparkles} label="Инсайтов" value={String(insights.length)} sub="Риски, возможности и действия" />
        <MetricCard icon={LineChart} label="Прослушиваний" value={fmt(summary.streams)} sub={`${fmt(summary.tracks_count)} треков в каталоге`} />
        <MetricCard icon={WalletCards} label="Доход каталога" value={fmtRub(summary.revenue)} sub={`Баланс: ${fmtRub(summary.cashflow?.balance ?? 0)}`} />
        <MetricCard icon={Clock} label="Периодов данных" value={String(summary.periods.length)} sub={summary.periods.at(-1) ?? "Нет периодов"} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="rounded-lg border border-[#202633] bg-[#10141D] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-white">Приоритетные выводы</h2>
                <p className="mt-0.5 text-xs text-[#8B93A3]">Сигналы отсортированы по операционной полезности.</p>
              </div>
              <div className="flex overflow-x-auto rounded-md border border-[#2A3242] bg-[#111722] p-1">
                {(Object.keys(filterLabels) as Array<"all" | AiInsightType>).map((key) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`h-8 whitespace-nowrap rounded px-3 text-xs font-medium transition-colors ${
                      filter === key ? "bg-[#2F6FED] text-white" : "text-[#8B93A3] hover:text-white"
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
            <div className="rounded-lg border border-[#202633] bg-[#10141D] p-8 text-center">
              <p className="text-sm text-[#8B93A3]">Нет инсайтов в выбранной категории</p>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
            <h2 className="mb-4 font-semibold text-white">Следующие действия</h2>
            {data.actions.length > 0 ? (
              <div className="space-y-3">
                {data.actions.map((action, index) => (
                  <div key={action} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#151B26] text-xs font-semibold text-[#8BB4FF]">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-snug text-[#B5BCC9]">{action}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#747D8C]">Нет срочных действий</p>
            )}
          </div>

          <FocusBlock
            topTrack={topTrack}
            topPlatform={topPlatform}
            topPlatformShare={totalPlatformRevenue > 0 && topPlatform ? topPlatform.revenue / totalPlatformRevenue : 0}
          />

          <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
            <h2 className="mb-4 font-semibold text-white">Топ платформ</h2>
            <div className="space-y-4">
              {platforms.slice(0, 5).map((platform) => {
                const pct = totalPlatformRevenue > 0 ? (platform.revenue / totalPlatformRevenue) * 100 : 0;
                return (
                  <div key={platform.code}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm text-[#E5E7EB]">{platform.name}</div>
                        <div className="text-xs text-[#747D8C]">{fmt(platform.streams)} стримов</div>
                      </div>
                      <div className="shrink-0 text-sm font-semibold text-white">{fmtRub(platform.revenue)}</div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#202633]">
                      <div className="h-full rounded-full bg-[#4B8BFF]" style={{ width: `${Math.max(4, pct)}%` }} />
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
    <article className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${style.className}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#8B93A3]">
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
            <span className="text-xs text-[#747D8C]">Уверенность {confidence}%</span>
          </div>
          <h3 className="text-lg font-semibold leading-tight text-white">{insight.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#B5BCC9]">{insight.description}</p>
        </div>
        <div className="shrink-0 md:min-w-[128px] md:text-right">
          <div className="font-semibold text-white">{insight.metric}</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#202633]">
            <div className="h-full rounded-full bg-[#4B8BFF]" style={{ width: `${confidence}%` }} />
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
    <div className="rounded-lg border border-[#202633] bg-[#10141D] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Target size={17} className="text-[#8B93A3]" />
        <h2 className="font-semibold text-white">Фокус недели</h2>
      </div>
      <div className="space-y-4">
        <div>
          <div className="mb-1 text-xs text-[#8B93A3]">Трек для промо</div>
          <div className="truncate font-semibold text-white">{topTrack?.title ?? "Нет данных"}</div>
          <div className="mt-1 text-xs text-[#B5BCC9]">
            {topTrack ? `${fmt(topTrack.streams)} стримов · ${fmtRub(topTrack.revenue)}` : "Загрузите отчет роялти"}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs text-[#8B93A3]">Платформа для контроля</div>
          <div className="truncate font-semibold text-white">{topPlatform?.name ?? "Нет данных"}</div>
          <div className="mt-1 text-xs text-[#B5BCC9]">
            {topPlatform ? `${fmtRub(topPlatform.revenue)} · ${Math.round(topPlatformShare * 100)}% дохода` : "Нет платформенной аналитики"}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub }: { icon: typeof Sparkles; label: string; value: string; sub: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#202633] bg-[#10141D] p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-[#151B26]">
        <Icon size={18} className="text-[#8B93A3]" />
      </div>
      <div className="mb-1 truncate text-2xl font-semibold text-white">{value}</div>
      <div className="text-sm text-[#B5BCC9]">{label}</div>
      <div className="mt-1 truncate text-xs text-[#8B93A3]">{sub}</div>
    </div>
  );
}

function AIInsightsSkeleton() {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-3 h-4 w-36 animate-pulse rounded bg-[#202633]" />
          <div className="h-8 w-52 animate-pulse rounded bg-[#202633]" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-md bg-[#202633]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-lg border border-[#202633] bg-[#10141D]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-lg border border-[#202633] bg-[#10141D]" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-lg border border-[#202633] bg-[#10141D]" />
          <div className="h-56 animate-pulse rounded-lg border border-[#202633] bg-[#10141D]" />
        </div>
      </div>
    </div>
  );
}
