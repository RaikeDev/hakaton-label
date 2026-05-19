import { useState } from "react";
import { Film, Tv, Megaphone, TrendingUp, Plus, ExternalLink, Play, Music2, DollarSign, Calendar, CheckCircle, Clock, X } from "lucide-react";
import { useSyncs } from "../../hooks/useSyncs";

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}
function fmtStreams(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const typeIcons: Record<string, React.ElementType> = {
  "Фильм": Film,
  "Сериал": Tv,
  "Реклама": Megaphone,
};

const typeColors: Record<string, string> = {
  "Фильм": "text-violet-400 bg-violet-400/10",
  "Сериал": "text-cyan-400 bg-cyan-400/10",
  "Реклама": "text-amber-400 bg-amber-400/10",
};

const statusConfig = {
  active: { label: "Активна", color: "text-emerald-400 bg-emerald-400/10" },
  completed: { label: "Завершена", color: "text-[#6C6890] bg-[#1C1A3B]" },
  pending: { label: "Ожидание", color: "text-amber-400 bg-amber-400/10" },
};

export function Syncs() {
  const { data: syncCasesRaw = [], isLoading } = useSyncs();
  const syncCases = syncCasesRaw as any[];
  const [selected, setSelected] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const totalFees = syncCases.reduce((a: number, s: any) => a + s.fee, 0);
  const totalRoyalties = syncCases.reduce((a: number, s: any) => a + s.revenue, 0);
  const selectedCase = syncCases.find((s: any) => s.id === selected);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="px-6 pt-6 pb-4 border-b border-[#1C1A3B] shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Синхронизации</h1>
            <p className="text-[#6C6890] text-sm mt-0.5">Кино, сериалы, реклама · {isLoading ? "..." : syncCases.length} кейса</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm rounded-xl transition-colors font-medium"
          >
            <Plus size={15} />
            Добавить кейс
          </button>
        </div>

        {/* Sync stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0F0D22] border border-[#1C1A3B] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={15} className="text-violet-400" />
              <span className="text-[#6C6890] text-xs">Sync fees</span>
            </div>
            <div className="text-white font-bold text-xl">{fmtRub(totalFees)}</div>
            <div className="text-[#4A4469] text-xs mt-0.5">Разовые выплаты</div>
          </div>
          <div className="bg-[#0F0D22] border border-[#1C1A3B] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={15} className="text-emerald-400" />
              <span className="text-[#6C6890] text-xs">Роялти от синков</span>
            </div>
            <div className="text-white font-bold text-xl">{fmtRub(totalRoyalties)}</div>
            <div className="text-[#4A4469] text-xs mt-0.5">Со стримингов</div>
          </div>
          <div className="bg-[#0F0D22] border border-[#1C1A3B] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Film size={15} className="text-cyan-400" />
              <span className="text-[#6C6890] text-xs">Активных</span>
            </div>
            <div className="text-white font-bold text-xl">{syncCases.filter((s) => s.status === "active").length}</div>
            <div className="text-[#4A4469] text-xs mt-0.5">Из {syncCases.length} кейсов</div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Cases list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {syncCases.map((sc) => {
            const TypeIcon = typeIcons[sc.type] || Film;
            const statusStyle = statusConfig[sc.status as keyof typeof statusConfig];
            const isSelected = selected === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => setSelected(isSelected ? null : sc.id)}
                className={`bg-[#0F0D22] border rounded-2xl overflow-hidden cursor-pointer transition-all ${
                  isSelected ? "border-violet-500/50" : "border-[#1C1A3B] hover:border-[#252356]"
                }`}
              >
                <div className="flex gap-0">
                  {/* Cover */}
                  <div className="relative w-48 shrink-0">
                    <img
                      src={sc.cover_url}
                      alt={sc.title}
                      className="w-full h-full object-cover"
                      style={{ minHeight: "130px" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=S&background=131320&color=6B7280&size=192"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0F0D22]" />
                    <div className="absolute top-3 left-3">
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${typeColors[sc.type]}`}>
                        <TypeIcon size={11} />
                        {sc.type}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-bold text-lg leading-tight">{sc.title}</h3>
                        <p className="text-[#6C6890] text-sm mt-0.5">{sc.studio}{sc.director ? ` · реж. ${sc.director}` : ""}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle.color}`}>
                        {statusStyle.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Music2 size={13} className="text-violet-400" />
                      <span className="text-violet-300 text-sm font-medium">{sc.track}</span>
                      <span className="text-[#4A4469]">·</span>
                      <span className="text-[#6C6890] text-sm italic">«{sc.scene}»</span>
                    </div>

                    <div className="flex gap-6">
                      <div>
                        <div className="text-[#6C6890] text-xs mb-0.5">Sync Fee</div>
                        <div className="text-white font-bold">{fmtRub(sc.fee)}</div>
                      </div>
                      {sc.royalty_rate > 0 && (
                        <div>
                          <div className="text-[#6C6890] text-xs mb-0.5">Ставка роялти</div>
                          <div className="text-white font-bold">{sc.royalty_rate}%</div>
                        </div>
                      )}
                      {sc.streams && (
                        <div>
                          <div className="text-[#6C6890] text-xs mb-0.5">Стримов после</div>
                          <div className="text-white font-bold">{fmtStreams(sc.streams)}</div>
                        </div>
                      )}
                      {sc.revenue > 0 && (
                        <div>
                          <div className="text-[#6C6890] text-xs mb-0.5">Роялти получено</div>
                          <div className="text-emerald-400 font-bold">{fmtRub(sc.revenue)}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-[#6C6890] text-xs mb-0.5">Релиз</div>
                        <div className="text-white font-bold">
                          {new Date(sc.release_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div className="border-t border-[#1C1A3B] p-5 bg-[#0B0A1E]">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-[#6C6890] text-xs font-medium uppercase tracking-wider mb-2">Контракт</div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[#6C6890]">Тип лицензии</span>
                            <span className="text-white">Мастер + синхро</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6C6890]">Территория</span>
                            <span className="text-white">Весь мир</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6C6890]">Срок</span>
                            <span className="text-white">5 лет</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6C6890]">Эксклюзив</span>
                            <span className="text-white">Нет</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[#6C6890] text-xs font-medium uppercase tracking-wider mb-2">Выплаты</div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[#6C6890]">Sync fee</span>
                            <span className="text-emerald-400 font-semibold">{fmtRub(sc.fee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6C6890]">Роялти накоплено</span>
                            <span className="text-emerald-400 font-semibold">{fmtRub(sc.revenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6C6890]">Итого</span>
                            <span className="text-white font-bold">{fmtRub(sc.fee + sc.revenue)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[#6C6890] text-xs font-medium uppercase tracking-wider mb-2">Документы</div>
                        <div className="space-y-2">
                          {["Лицензионный договор.pdf", "Акт выполненных работ.pdf"].map((doc) => (
                            <div key={doc} className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 cursor-pointer transition-colors">
                              <ExternalLink size={13} />
                              {doc}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#09071C] border border-[#1C1A3B] rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-[#1C1A3B]">
              <h3 className="text-white font-bold">Новый sync-кейс</h3>
              <button onClick={() => setShowAdd(false)} className="text-[#4A4469] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6C6890] text-xs mb-1.5 block">Название проекта</label>
                  <input className="w-full bg-[#0F0D22] border border-[#1C1A3B] text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500/50 placeholder-[#4A4469]" placeholder="Название фильма / сериала" />
                </div>
                <div>
                  <label className="text-[#6C6890] text-xs mb-1.5 block">Тип</label>
                  <select className="w-full bg-[#0F0D22] border border-[#1C1A3B] text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500/50">
                    <option>Фильм</option>
                    <option>Сериал</option>
                    <option>Реклама</option>
                    <option>Игра</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#6C6890] text-xs mb-1.5 block">Трек</label>
                  <select className="w-full bg-[#0F0D22] border border-[#1C1A3B] text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500/50">
                    <option>Северный ветер</option>
                    <option>Неон</option>
                    <option>Дорога домой</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#6C6890] text-xs mb-1.5 block">Sync Fee (руб.)</label>
                  <input type="number" className="w-full bg-[#0F0D22] border border-[#1C1A3B] text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500/50 placeholder-[#4A4469]" placeholder="100 000" />
                </div>
                <div className="col-span-2">
                  <label className="text-[#6C6890] text-xs mb-1.5 block">Описание сцены</label>
                  <input className="w-full bg-[#0F0D22] border border-[#1C1A3B] text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500/50 placeholder-[#4A4469]" placeholder="Финальная сцена, титры..." />
                </div>
                <div>
                  <label className="text-[#6C6890] text-xs mb-1.5 block">Студия</label>
                  <input className="w-full bg-[#0F0D22] border border-[#1C1A3B] text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500/50 placeholder-[#4A4469]" placeholder="Название студии" />
                </div>
                <div>
                  <label className="text-[#6C6890] text-xs mb-1.5 block">Дата релиза</label>
                  <input type="date" className="w-full bg-[#0F0D22] border border-[#1C1A3B] text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500/50" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-[#1C1A3B] text-[#9B98BC] rounded-xl hover:bg-[#0F0D22] transition-colors text-sm">Отмена</button>
                <button className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl transition-colors text-sm font-medium">Добавить кейс</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
