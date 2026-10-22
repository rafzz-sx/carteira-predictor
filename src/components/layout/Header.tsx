// src/components/layout/Header.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  UserCheck,
  Briefcase,
  ChevronDown,
  Plus,
  Share2,
  Check,
} from 'lucide-react';
import { useUI, type Theme } from '@/lib/theme-context';

interface HeaderProps {
  b3Status?: 'open' | 'pre' | 'closed' | 'holiday';
  lastUpdate?: string;
  delayMinutes?: number;
}

export function Header({
  b3Status = 'open',
  lastUpdate = '17:05',
  delayMinutes = 30,
}: HeaderProps) {
  const {
    theme,
    setTheme,
    privacyMode,
    togglePrivacyMode,
    userId,
    setUserId,
    workspaces,
    addWorkspace,
  } = useUI();

  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWorkspaceOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cycleTheme = () => {
    const order: Theme[] = ['dark', 'oled', 'light'];
    const nextIndex = (order.indexOf(theme) + 1) % order.length;
    setTheme(order[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-3.5 h-3.5 text-[#F5B83D]" />;
      case 'oled':
        return <Sparkles className="w-3.5 h-3.5 text-[#7C5CFF]" />;
      default:
        return <Moon className="w-3.5 h-3.5 text-[#22D3EE]" />;
    }
  };

  const statusLabel = {
    open: 'B3 Aberto',
    pre: 'B3 Pré-abertura',
    closed: 'B3 Fechado',
    holiday: 'Feriado B3',
  }[b3Status];

  const currentWorkspace = workspaces.find((w) => w.id === userId) || {
    id: userId,
    name: userId === 'demo-user-1' ? 'Carteira Principal' : `Carteira: ${userId}`,
  };

  const handleAddNewWorkspace = () => {
    const name = prompt('Digite o nome da nova carteira / perfil (ex: Maria, Esposa, Aposentadoria):');
    if (!name || !name.trim()) return;
    const cleanId = 'user-' + name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15);
    addWorkspace(cleanId, name.trim());
    setIsWorkspaceOpen(false);
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('user', userId);
      navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07080C]/85 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
      {/* Brand & Market Status */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-[#7C5CFF]/15 border border-[#7C5CFF]/40 flex items-center justify-center font-mono font-bold text-[#7C5CFF] text-xs">
            CP
          </div>
          <span className="font-semibold text-xs sm:text-sm tracking-tight text-[#F3F5FA] hidden sm:inline">
            Carteira Predictor
          </span>
        </Link>

        {/* B3 Market Status Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#19D98B]/10 text-[#19D98B] border border-[#19D98B]/20">
          <span className={`w-1.5 h-1.5 rounded-full ${b3Status === 'open' ? 'bg-[#19D98B] animate-pulse' : 'bg-[#A3A9BC]'}`} />
          <span>{statusLabel}</span>
        </div>

        {/* Delay notice */}
        <div className="text-[11px] text-[#A3A9BC] hidden md:inline" suppressHydrationWarning>
          Cotações com atraso de ~{delayMinutes} min ({lastUpdate})
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2">
        {/* Workspace / User Selector (No passwords needed) */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsWorkspaceOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-[#F3F5FA] text-xs transition-all cursor-pointer"
            title="Trocar de carteira / perfil"
          >
            <Briefcase className="w-3.5 h-3.5 text-[#7C5CFF]" />
            <span className="font-medium max-w-[120px] truncate">{currentWorkspace.name}</span>
            <ChevronDown className="w-3 h-3 text-[#A3A9BC]" />
          </button>

          {/* Dropdown Menu */}
          {isWorkspaceOpen && (
            <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-[#0D0E15] border border-white/[0.12] shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs">
              <div className="px-2 py-1 text-[10px] uppercase font-semibold text-[#70778C] tracking-wider">
                Minhas Carteiras
              </div>

              {workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setUserId(w.id);
                    setIsWorkspaceOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    w.id === userId
                      ? 'bg-[#7C5CFF]/20 text-[#F3F5FA] font-bold border border-[#7C5CFF]/30'
                      : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="truncate">{w.name}</span>
                  {w.id === userId && <Check className="w-3.5 h-3.5 text-[#7C5CFF]" />}
                </button>
              ))}

              <div className="my-1 border-t border-white/[0.06]" />

              <button
                onClick={handleAddNewWorkspace}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#7C5CFF] hover:bg-[#7C5CFF]/10 font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nova Carteira / Perfil</span>
              </button>

              <button
                onClick={handleCopyShareLink}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#19D98B]" /> : <Share2 className="w-3.5 h-3.5 text-[#22D3EE]" />}
                <span>{copiedLink ? 'Link copiado!' : 'Copiar link para enviar'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Privacy Toggle */}
        <button
          onClick={togglePrivacyMode}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-[#A3A9BC] hover:text-[#F3F5FA] transition-all text-xs"
          title={privacyMode ? 'Mostrar valores monetários' : 'Ocultar valores monetários'}
          aria-label={privacyMode ? 'Mostrar valores' : 'Ocultar valores'}
        >
          {privacyMode ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-[#F5B83D]" />
              <span className="hidden sm:inline">Mostrar valores</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ocultar valores</span>
            </>
          )}
        </button>

        {/* Theme Switcher */}
        <button
          onClick={cycleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-[#A3A9BC] hover:text-[#F3F5FA] transition-all text-xs capitalize"
          title={`Tema atual: ${theme}. Clique para alternar.`}
          aria-label="Alternar tema"
        >
          {getThemeIcon()}
          <span className="hidden sm:inline font-mono text-[11px]">{theme}</span>
        </button>

        {/* User Profile Link */}
        <Link
          href="/perfil"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-[#A3A9BC] hover:text-[#F3F5FA] transition-all text-xs"
          title="Ver e ajustar Perfil do Investidor"
        >
          <UserCheck className="w-3.5 h-3.5 text-[#7C5CFF]" />
          <span className="hidden sm:inline font-mono text-[11px]">Perfil</span>
        </Link>
      </div>
    </header>
  );
}
