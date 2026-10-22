'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Command, Eye, EyeOff, X, PlusCircle, ArrowRight } from 'lucide-react';
import { useUI } from '@/lib/theme-context';

export function GlobalKeyboardShortcuts() {
  const router = useRouter();
  const { privacyMode, togglePrivacyMode } = useUI();
  const [isOpen, setIsOpen] = useState(false);
  const [gPressed, setGPressed] = useState(false);

  // Register service worker in browser
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent catch for dev/unsupported envs
      });
    }
  }, []);

  useEffect(() => {
    let gTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or select
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      // Escape closes modal
      if (e.key === 'Escape') {
        setIsOpen(false);
        setGPressed(false);
        return;
      }

      // '?' opens/closes help modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // 'm' toggles privacy mode
      if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !gPressed) {
        e.preventDefault();
        togglePrivacyMode();
        return;
      }

      // 'n' triggers new action modal/page
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !gPressed) {
        e.preventDefault();
        router.push('/aportes#novo');
        return;
      }

      // 'g' combo handling
      if ((e.key === 'g' || e.key === 'G') && !e.ctrlKey && !e.metaKey) {
        setGPressed(true);
        clearTimeout(gTimeout);
        gTimeout = setTimeout(() => {
          setGPressed(false);
        }, 1200);
        return;
      }

      if (gPressed) {
        const key = e.key.toLowerCase();
        setGPressed(false);
        clearTimeout(gTimeout);

        switch (key) {
          case 'h':
            router.push('/');
            break;
          case 'c':
            router.push('/carteira');
            break;
          case 'a':
            router.push('/aportes');
            break;
          case 'm':
            router.push('/mercado');
            break;
          case 's':
            router.push('/simular');
            break;
          case 'r':
            router.push('/renda-fixa');
            break;
          case 'i':
            router.push('/imposto');
            break;
          case 'k':
            router.push('/como-calculamos');
            break;
          case 'd':
            router.push('/design');
            break;
          case 'p':
            router.push('/perfil');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gTimeout);
    };
  }, [gPressed, router, togglePrivacyMode]);

  return (
    <>
      {/* Floating Shortcut Helper Hint (Bottom Right on Desktop) */}
      <div className="fixed bottom-3 right-4 z-40 hidden lg:flex items-center gap-2">
        {gPressed && (
          <div className="px-3 py-1 rounded-full bg-[#7C5CFF] text-white text-xs font-mono font-bold animate-pulse shadow-lg flex items-center gap-1.5">
            <span>g + [tecla]...</span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 border border-white/[0.1] text-[11px] text-[#A3A9BC] hover:text-[#F3F5FA] backdrop-blur-md transition-all shadow-md"
          title="Atalhos de teclado (Pressione ?)"
        >
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-[10px] font-mono text-[#22D3EE] font-bold">?</kbd>
          <span>Atalhos</span>
        </button>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl bg-[#0E1017] border border-white/[0.12] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_rgba(124,92,255,0.2)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 flex items-center justify-center text-[#7C5CFF]">
                  <Command className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F3F5FA]">Atalhos de Teclado do Cockpit</h3>
                  <p className="text-xs text-[#A3A9BC]">Navegue e execute ações com máxima agilidade</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/[0.04] text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#70778C] mb-2 font-bold">
                  Ações Imediatas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-2 text-[#F3F5FA]">
                      {privacyMode ? <EyeOff className="w-4 h-4 text-[#F5B83D]" /> : <Eye className="w-4 h-4 text-[#19D98B]" />}
                      <span>Modo Privacidade</span>
                    </div>
                    <kbd className="px-2 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] font-mono text-[11px] text-[#22D3EE] font-bold">
                      M
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-2 text-[#F3F5FA]">
                      <PlusCircle className="w-4 h-4 text-[#7C5CFF]" />
                      <span>Nova Ação</span>
                    </div>
                    <kbd className="px-2 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] font-mono text-[11px] text-[#22D3EE] font-bold">
                      N
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[#F3F5FA]">Abrir / Fechar Ajuda</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] font-mono text-[11px] text-[#22D3EE] font-bold">
                      ?
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[#F3F5FA]">Fechar Janela</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] font-mono text-[11px] text-[#70778C] font-bold">
                      ESC
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Navigation Combos */}
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#70778C] mb-2 font-bold">
                  Navegação Rápida (Pressione G e depois a Letra)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Início', key: 'H', path: '/' },
                    { label: 'Carteira B3', key: 'C', path: '/carteira' },
                    { label: 'Plano de Ação', key: 'A', path: '/aportes' },
                    { label: 'Mercado B3', key: 'M', path: '/mercado' },
                    { label: 'Simulador / Monte Carlo', key: 'S', path: '/simular' },
                    { label: 'Renda Fixa & MtM', key: 'R', path: '/renda-fixa' },
                    { label: 'Imposto & DIRPF', key: 'I', path: '/imposto' },
                    { label: 'Como Calculamos', key: 'K', path: '/como-calculamos' },
                    { label: 'Perfil de Risco', key: 'P', path: '/perfil' },
                    { label: 'Design Tokens', key: 'D', path: '/design' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => {
                        setIsOpen(false);
                        router.push(item.path);
                      }}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-[#F3F5FA]">
                        <ArrowRight className="w-3 h-3 text-[#70778C]" />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[#70778C]">G</kbd>
                        <span className="text-[#70778C]">+</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-[#22D3EE] font-bold">
                          {item.key}
                        </kbd>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#70778C]">
              <span>Pressione <kbd className="font-mono text-[#F3F5FA]">ESC</kbd> para fechar</span>
              <span className="font-mono text-[#7C5CFF]">CARTEIRA PREDICTOR B3</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
