'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Music, BarChart2, Wallet, Radio, Bell, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/context/SearchContext';
import { MOCK_TRACKS } from '@/lib/mock-data/tracks'; // импорт готовых моков

// Статические пункты навигации
const NAV_ITEMS = [
  { label: 'Дашборд',      href: '/dashboard',     icon: BarChart2 },
  { label: 'Треки',        href: '/tracks',         icon: Music },
  { label: 'Каталог',      href: '/catalog',        icon: Music },
  { label: 'Баланс',       href: '/balance',        icon: Wallet },
  { label: 'Транзакции',   href: '/transactions',   icon: Wallet },
  { label: 'Релизы',       href: '/releases',       icon: Radio },
  { label: 'Синхронизация',href: '/sync',           icon: Radio },
  { label: 'Уведомления',  href: '/notifications',  icon: Bell },
  { label: 'Профиль',      href: '/profile',        icon: User },
];

export function CommandPalette() {
  const { isOpen, close } = useSearch();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Фокус при открытии
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase();

  const navResults = NAV_ITEMS.filter(item =>
    item.label.toLowerCase().includes(q)
  );

  const trackResults = MOCK_TRACKS.filter(track =>
    track.title.toLowerCase().includes(q)
  ).slice(0, 5);

  const handleNav = (href: string) => {
    router.push(href);
    close();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Палитра */}
      <div className="fixed top-[20vh] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl">
        <div
          className="rounded-[16px] border overflow-hidden shadow-2xl"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* Поле ввода */}
          <div className="flex items-center gap-3 px-4 py-3 border-b"
               style={{ borderColor: 'var(--color-border)' }}>
            <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск по страницам и трекам..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--color-text)' }}
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X size={16} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            )}
            <kbd className="text-xs px-2 py-1 rounded"
                 style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
              Esc
            </kbd>
          </div>

          {/* Результаты */}
          <div className="max-h-80 overflow-y-auto py-2">

            {/* Навигация */}
            {navResults.length > 0 && (
              <div>
                <div className="px-4 py-1 text-xs font-semibold uppercase tracking-wider"
                     style={{ color: 'var(--color-text-muted)' }}>
                  Страницы
                </div>
                {navResults.map(item => (
                  <button
                    key={item.href}
                    onClick={() => handleNav(item.href)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors text-left"
                    style={{ color: 'var(--color-text)' }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.background = 'var(--color-surface-hover)')
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <item.icon size={16} style={{ color: 'var(--color-accent)' }} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* Треки */}
            {trackResults.length > 0 && (
              <div>
                <div className="px-4 py-1 text-xs font-semibold uppercase tracking-wider mt-1"
                     style={{ color: 'var(--color-text-muted)' }}>
                  Треки
                </div>
                {trackResults.map(track => (
                  <button
                    key={track.id}
                    onClick={() => handleNav('/tracks')}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors text-left"
                    style={{ color: 'var(--color-text)' }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.background = 'var(--color-surface-hover)')
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <Music size={16} style={{ color: 'var(--color-text-muted)' }} />
                    {track.title}
                  </button>
                ))}
              </div>
            )}

            {/* Пусто */}
            {navResults.length === 0 && trackResults.length === 0 && query && (
              <div className="py-8 text-center text-sm"
                   style={{ color: 'var(--color-text-muted)' }}>
                Ничего не найдено по «{query}»
              </div>
            )}

            {/* Подсказки при пустом запросе */}
            {!query && (
              <div className="py-6 text-center text-sm"
                   style={{ color: 'var(--color-text-muted)' }}>
                Начните вводить для поиска по страницам и трекам
              </div>
            )}
          </div>

          {/* Подвал */}
          <div className="px-4 py-2 border-t flex gap-4 text-xs"
               style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            <span>↑↓ навигация</span>
            <span>↵ перейти</span>
            <span>Esc закрыть</span>
          </div>
        </div>
      </div>
    </>
  );
}