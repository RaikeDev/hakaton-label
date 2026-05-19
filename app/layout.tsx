import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SearchProvider } from '@/lib/context/SearchContext';
import { CommandPalette } from '@/components/ui/CommandPalette';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kamik',
  description: 'Портал для артистов',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <SearchProvider>
          {children}
          <CommandPalette />
        </SearchProvider>
      </body>
    </html>
  );
}