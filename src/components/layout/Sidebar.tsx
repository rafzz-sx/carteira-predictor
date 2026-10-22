'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Briefcase,
  Target,
  UserCheck,
  LineChart,
  Sliders,
  Filter,
  Shield,
  FileText,
  Settings,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Início', href: '/', icon: Home },
    { label: 'Carteira', href: '/carteira', icon: Briefcase },
    { label: 'Plano de Ação', href: '/aportes', icon: Target, badge: 'Pendente' },
    { label: 'Perfil de Risco', href: '/perfil', icon: UserCheck },
    { label: 'Mercado B3', href: '/mercado', icon: LineChart },
    { label: 'Simular Cenários', href: '/simular', icon: Sliders },
    { label: 'Screener', href: '/screener', icon: Filter },
    { label: 'Renda Fixa', href: '/renda-fixa', icon: Shield },
    { label: 'Imposto de Renda', href: '/imposto', icon: FileText },
    { label: 'Galeria /design', href: '/design', icon: Settings, tag: 'Fatia 0' },
    { label: 'Como Calculamos', href: '/como-calculamos', icon: HelpCircle },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/[0.08] bg-[#07080C]/50 p-4 gap-6 min-h-[calc(100vh-49px)]">
      {/* Primary CTA (Nova Ação) */}
      <Link
        href="/aportes#novo"
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#7C5CFF] hover:bg-[#7C5CFF]/90 text-white font-medium text-xs tracking-wide transition-all shadow-[0_0_0_1px_rgba(124,92,255,0.35),0_0_20px_rgba(124,92,255,0.18)]"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Nova Ação</span>
      </Link>

      {/* Navigation list */}
      <nav className="flex flex-col gap-1 text-sm font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-xs',
                isActive
                  ? 'bg-white/[0.08] text-[#F3F5FA] font-semibold border border-white/[0.08]'
                  : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.03]'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4',
                    isActive ? 'text-[#7C5CFF]' : 'text-[#A3A9BC]'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="w-2 h-2 rounded-full bg-[#F5B83D]" title="Ação pendente neste mês" />
              )}
              {item.tag && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#7C5CFF]/15 text-[#7C5CFF] border border-[#7C5CFF]/20">
                  {item.tag}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Status Card */}
      <div className="mt-auto p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-[#A3A9BC] flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-medium text-[#F3F5FA]">
          <span>Pregão B3</span>
          <span className="text-[#19D98B] flex items-center gap-1 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#19D98B] animate-pulse"></span>
            Aberto
          </span>
        </div>
        <div className="text-[11px] text-[#70778C]">
          Atraso oficial ~30 min<br />
          Atualização: 17:05
        </div>
      </div>
    </aside>
  );
}
