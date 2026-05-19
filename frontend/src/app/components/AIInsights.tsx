import { AlertTriangle, ArrowUpRight, CheckCircle2, LineChart, Sparkles, WalletCards } from "lucide-react";
import { useAiInsights } from "../../hooks/useAiInsights";

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
}

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

const insightStyles: Record<string, { icon: typeof Sparkles; className: string; label: string }> = {
  opportunity: { icon: ArrowUpRight, className: "border-emerald-400/20 bg-emerald-500/8 text-emerald-300", label: "Возможность" },
  risk: { icon: AlertTriangle, className: "border-amber-400/20 bg-amber-500/8 text-amber-300", label: "Риск" },
  action: { icon: CheckCircle2, className: "border-violet-400/20 bg-violet-500/8 text-violet-300", label: "Действие" },
};

export function AIInsights() {
  const { data, isLoading, isError } = useAiInsights();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#6C6890] text-sm">Анализируем каталог...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-medium mb-2">Не удалось загрузить AI-инсайты</p>
          <p className="text-[#6C6890] text-sm">Проверьте backend и повторите попытку</p>
        </div>
      </div>
    );
  }

  const summary = data.summary ?? {};
  const insights: any[] = data.insights ?? [];
  const actions: string[] = data.actions ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[#6C6890] text-sm mb-1">AI-анализ каталога</div>
          <h1 className="text-2xl font-bold text-white">{data.artist?.name ?? "Артист"}</h1>
        </div>
        <div className="text-right text-[#6C6890] text-sm">
          Обновлено: {summary.generated_at ? new Date(summary.generated_at).toLocaleDateString("ru-RU") : "сейчас"}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={Sparkles} label="Инсайтов" value={String(insights.length)} />
        <MetricCard icon={LineChart} label="Прослушиваний" value={fmt(summary.streams ?? 0)} />
        <MetricCard icon={WalletCards} label="Доход каталога" value={fmtRub(summary.revenue ?? 0)} />
        <MetricCard icon={CheckCircle2} label="Периодов данных" value={String(summary.periods?.length ?? 0)} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          {insights.map((insight, index) => {
            const style = insightStyles[insight.type] ?? insightStyles.opportunity;
            const Icon = style.icon;
            return (
              <div key={`${insight.title}-${index}`} className="bg-[#0F0D22] rounded-2xl p-5 border border-[#1C1A3B]">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${style.className}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[#6C6890] text-xs">{style.label}</span>
                      <span className="text-[#4A4469] text-xs">Уверенность {Math.round((insight.confidence ?? 0) * 100)}%</span>
                    </div>
                    <h2 className="text-white font-semibold text-lg">{insight.title}</h2>
                    <p className="text-[#9B98BC] text-sm leading-relaxed mt-2">{insight.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-white font-bold">{insight.metric}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="bg-[#0F0D22] rounded-2xl p-5 border border-[#1C1A3B]">
            <h2 className="text-white font-semibold mb-4">Следующие действия</h2>
            {actions.length > 0 ? (
              <div className="space-y-3">
                {actions.map((action, index) => (
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

          <div className="bg-[#0F0D22] rounded-2xl p-5 border border-[#1C1A3B]">
            <h2 className="text-white font-semibold mb-4">Топ платформ</h2>
            <div className="space-y-3">
              {(summary.platforms ?? []).slice(0, 4).map((platform: any) => (
                <div key={platform.code} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[#E5E7EB] text-sm truncate">{platform.name}</div>
                    <div className="text-[#4A4469] text-xs">{fmt(platform.streams)} стримов</div>
                  </div>
                  <div className="text-white text-sm font-semibold shrink-0">{fmtRub(platform.revenue)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: string }) {
  return (
    <div className="rounded-2xl p-5 border bg-[#0F0D22] border-[#1C1A3B]">
      <div className="w-9 h-9 rounded-xl bg-[#130F2E] flex items-center justify-center mb-3">
        <Icon size={18} className="text-[#9B98BC]" />
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-[#6C6890] text-sm">{label}</div>
    </div>
  );
}
