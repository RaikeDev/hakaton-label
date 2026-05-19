import {
  BarChart2,
  CheckSquare,
  CreditCard,
  FileSpreadsheet,
  Film,
  Lightbulb,
  Music,
  Radio,
  Search,
  Upload,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ElementType } from "react";

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  page: string;
  icon: ElementType;
  group: "Разделы" | "Действия" | "Треки";
  keywords: string;
};

const sectionResults: SearchResult[] = [
  { id: "dashboard", title: "Дашборд", subtitle: "Главный обзор артиста", page: "dashboard", icon: BarChart2, group: "Разделы", keywords: "обзор главная статистика" },
  { id: "catalog", title: "Каталог треков", subtitle: "Треки, ISRC, доход и статусы", page: "catalog", icon: Music, group: "Разделы", keywords: "каталог треки isrc релизы музыка" },
  { id: "analytics", title: "Аналитика", subtitle: "Платформы, география и эффективность", page: "analytics", icon: BarChart2, group: "Разделы", keywords: "аналитика графики платформы география" },
  { id: "ai-insights", title: "Инсайты", subtitle: "Рекомендации по каталогу", page: "ai-insights", icon: Lightbulb, group: "Разделы", keywords: "инсайты рекомендации риски возможности ai" },
  { id: "syncs", title: "Синхронизации", subtitle: "Кино, реклама, договоры и sync fees", page: "syncs", icon: Film, group: "Разделы", keywords: "синхронизации sync кино реклама сериал" },
  { id: "balance", title: "Баланс", subtitle: "Транзакции и движение денег", page: "balance", icon: Wallet, group: "Разделы", keywords: "баланс транзакции операции деньги" },
  { id: "approvals", title: "Согласования", subtitle: "Релизы и проверки дистрибьютора", page: "approvals", icon: CheckSquare, group: "Разделы", keywords: "согласования релизы проверки статус" },
  { id: "payments", title: "Выплаты", subtitle: "Реестр выплат и переводов", page: "payments", icon: CreditCard, group: "Разделы", keywords: "выплаты платежи переводы роялти" },
];

const adminResults: SearchResult[] = [
  { id: "artists", title: "Артисты", subtitle: "Карточки артистов лейбла", page: "artists", icon: Users, group: "Разделы", keywords: "артисты команда лейбл" },
  { id: "upload", title: "Загрузка отчетов", subtitle: "Импорт отчетов дистрибьюторов", page: "upload", icon: Upload, group: "Разделы", keywords: "загрузка отчеты импорт csv excel" },
  { id: "admin-payments", title: "Выплаты лейбла", subtitle: "Администрирование выплат", page: "admin-payments", icon: CreditCard, group: "Разделы", keywords: "админ выплаты лейбл" },
];

const actionResults: SearchResult[] = [
  { id: "import-report", title: "Импортировать отчет", subtitle: "Перейти к загрузке отчетов", page: "upload", icon: FileSpreadsheet, group: "Действия", keywords: "импорт загрузить отчет csv xlsx excel" },
  { id: "open-payments", title: "Проверить выплаты", subtitle: "Открыть реестр выплат", page: "payments", icon: CreditCard, group: "Действия", keywords: "проверить выплаты согласовать перевести" },
  { id: "open-syncs", title: "Добавить sync-кейс", subtitle: "Открыть раздел синхронизаций", page: "syncs", icon: Radio, group: "Действия", keywords: "добавить sync кейс синхронизация" },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  role?: "artist" | "admin";
  tracks?: Array<{ id: string | number; title: string; isrc?: string; streams?: number; revenue?: number }>;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").trim();
}

function matchScore(result: SearchResult, query: string) {
  const title = normalize(result.title);
  const haystack = normalize(`${result.title} ${result.subtitle} ${result.keywords}`);
  if (!query) return 1;
  if (title === query) return 100;
  if (title.startsWith(query)) return 80;
  if (haystack.includes(query)) return 50;
  return 0;
}

export function CommandPalette({ isOpen, onClose, onNavigate, role = "artist", tracks = [] }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalizedQuery = normalize(query);
    const baseResults = role === "admin" ? [...sectionResults, ...adminResults, ...actionResults] : [...sectionResults, ...actionResults];
    const pageResults = baseResults
      .map((result) => ({ result, score: matchScore(result, normalizedQuery) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.result);

    const trackResults = tracks
      .map((track) => {
        const searchText = normalize(`${track.title} ${track.isrc ?? ""}`);
        const score = normalizedQuery && searchText.includes(normalizedQuery) ? 60 : 0;
        return {
          result: {
            id: `track-${track.id}`,
            title: track.title,
            subtitle: track.isrc ? `ISRC: ${track.isrc}` : "Открыть в каталоге",
            page: "catalog",
            icon: Music,
            group: "Треки" as const,
            keywords: track.isrc ?? "",
          },
          score,
        };
      })
      .filter((item) => item.score > 0)
      .slice(0, 6)
      .map((item) => item.result);

    if (!normalizedQuery) return baseResults.slice(0, 8);
    return [...pageResults, ...trackResults].slice(0, 12);
  }, [query, role, tracks]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        return;
      }

      if (event.key === "Enter" && results[activeIndex]) {
        event.preventDefault();
        handleSelect(results[activeIndex]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, isOpen, onClose, results]);

  if (!isOpen) return null;

  function handleSelect(result: SearchResult) {
    onNavigate(result.page);
    onClose();
  }

  const groupedResults = results.reduce<Record<SearchResult["group"], SearchResult[]>>(
    (acc, result) => {
      acc[result.group].push(result);
      return acc;
    },
    { Разделы: [], Действия: [], Треки: [] },
  );

  let globalIndex = 0;

  return (
    <>
      <button type="button" aria-label="Закрыть поиск" className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />

      <div className="fixed left-1/2 top-[14vh] z-50 w-[calc(100vw-32px)] max-w-2xl -translate-x-1/2">
        <div className="overflow-hidden rounded-lg border border-[#202633] bg-[#10141D] shadow-2xl">
          <div className="flex items-center gap-3 border-b border-[#202633] px-4 py-3">
            <Search size={18} className="text-[#8B93A3]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти раздел, трек или действие"
              className="h-8 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#586173]"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-[#8B93A3] transition-colors hover:text-white">
                <X size={16} />
              </button>
            )}
            <kbd className="rounded border border-[#2A3242] bg-[#0B0F16] px-2 py-1 text-xs text-[#8B93A3]">Esc</kbd>
          </div>

          <div className="max-h-[420px] overflow-y-auto py-2">
            {(["Разделы", "Действия", "Треки"] as const).map((group) => {
              const items = groupedResults[group];
              if (items.length === 0) return null;

              return (
                <div key={group} className="py-1">
                  <div className="px-4 py-1 text-xs font-medium uppercase tracking-[0.14em] text-[#747D8C]">{group}</div>
                  {items.map((item) => {
                    const itemIndex = globalIndex++;
                    const Icon = item.icon;
                    const isActive = itemIndex === activeIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        onClick={() => handleSelect(item)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isActive ? "bg-[#1B2638]" : "hover:bg-[#151B26]"
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#151B26] text-[#8B93A3]">
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">{item.title}</span>
                          <span className="block truncate text-xs text-[#8B93A3]">{item.subtitle}</span>
                        </span>
                        <span className="text-xs text-[#747D8C]">Enter</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {results.length === 0 && (
              <div className="px-6 py-10 text-center">
                <div className="text-sm font-medium text-white">Ничего не найдено</div>
                <div className="mt-1 text-sm text-[#8B93A3]">Попробуйте название раздела, трека, ISRC или действие.</div>
              </div>
            )}
          </div>

          <div className="flex gap-4 border-t border-[#202633] px-4 py-2 text-xs text-[#8B93A3]">
            <span>↑↓ выбрать</span>
            <span>Enter перейти</span>
            <span>Esc закрыть</span>
          </div>
        </div>
      </div>
    </>
  );
}
