import type { Metadata, Viewport } from 'next';
import './globals.css';
import { UIProvider } from '@/lib/theme-context';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { GlobalKeyboardShortcuts } from '@/components/layout/GlobalKeyboardShortcuts';

export const metadata: Metadata = {
  title: 'Carteira Predictor — Assistente Pessoal de Investimentos B3',
  description:
    'Cockpit pessoal de investimentos e simulações probabilísticas exclusivo para o mercado brasileiro. Dados honestos, premissas transparentes.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#07080C',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="theme-dark dark" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased selection:bg-[#7C5CFF]/30">
        <UIProvider>
          <Header />
          <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 w-full max-w-full overflow-x-hidden">
              {children}
            </main>
          </div>
          <BottomNav />
          <GlobalKeyboardShortcuts />
        </UIProvider>
      </body>
    </html>
  );
}
