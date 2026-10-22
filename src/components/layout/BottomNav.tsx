'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LineChart, Briefcase, Sliders, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Início', href: '/', icon: Home },
    { label: 'Mercado', href: '/mercado', icon: LineChart },
    { label: 'Carteira', href: '/carteira', icon: Briefcase, hasPending: true },
    { label: 'Simular', href: '/simular', icon: Sliders },
    { label: 'Mais', href: '/design', icon: Menu },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07080C]/95 border-t border-white/[0.08] backdrop-blur-lg px-2 py-2 flex items-center justify-around text-[10px] font-medium text-[#A3A9BC]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 relative px-3 py-1 rounded-lg transition-colors',
              isActive ? 'text-[#7C5CFF] font-semibold' : 'hover:text-[#F3F5FA]'
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
            {item.hasPending && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#F5B83D]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
