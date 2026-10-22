// src/lib/theme-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'oled' | 'light';

export interface UserWorkspace {
  id: string;
  name: string;
}

interface UIContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  privacyMode: boolean;
  setPrivacyMode: (active: boolean) => void;
  togglePrivacyMode: () => void;
  userId: string;
  setUserId: (id: string) => void;
  workspaces: UserWorkspace[];
  addWorkspace: (id: string, name: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

const DEFAULT_WORKSPACES: UserWorkspace[] = [
  { id: 'demo-user-1', name: 'Carteira Principal' },
  { id: 'user-convidado', name: 'Carteira Convidado' },
];

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('cp_theme') as Theme | null;
      if (savedTheme && ['dark', 'oled', 'light'].includes(savedTheme)) {
        return savedTheme;
      }
    }
    return 'dark';
  });

  const [privacyMode, setPrivacyModeState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedPrivacy = localStorage.getItem('cp_privacy_mode');
      if (savedPrivacy) {
        return savedPrivacy === 'true';
      }
    }
    return false;
  });

  const [userId, setUserIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlUser = urlParams.get('user') || urlParams.get('userId');
      const savedUser = localStorage.getItem('cp_user_id');
      const resolved = urlUser || savedUser || 'demo-user-1';
      localStorage.setItem('cp_user_id', resolved);
      return resolved;
    }
    return 'demo-user-1';
  });

  const [workspaces, setWorkspaces] = useState<UserWorkspace[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cp_workspaces');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // ignore parsing error
        }
      }
    }
    return DEFAULT_WORKSPACES;
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_theme', newTheme);
    }
  };

  const setPrivacyMode = (active: boolean) => {
    setPrivacyModeState(active);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_privacy_mode', String(active));
    }
  };

  const togglePrivacyMode = () => {
    setPrivacyMode(!privacyMode);
  };

  const setUserId = (newUserId: string) => {
    const clean = newUserId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'demo-user-1';
    setUserIdState(clean);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_user_id', clean);
      window.location.reload(); // Reload to refresh portfolio queries for new workspace
    }
  };

  const addWorkspace = (id: string, name: string) => {
    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanId) return;
    const updated = [...workspaces.filter((w) => w.id !== cleanId), { id: cleanId, name }];
    setWorkspaces(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_workspaces', JSON.stringify(updated));
    }
    setUserId(cleanId);
  };

  useEffect(() => {
    document.documentElement.classList.remove('theme-dark', 'theme-oled', 'theme-light', 'dark');
    document.documentElement.classList.add(`theme-${theme}`);
    if (theme === 'dark' || theme === 'oled') {
      document.documentElement.classList.add('dark');
    }
    if (privacyMode) {
      document.body.classList.add('privacy-active');
    } else {
      document.body.classList.remove('privacy-active');
    }
  }, [theme, privacyMode]);

  return (
    <UIContext.Provider
      value={{
        theme,
        setTheme,
        privacyMode,
        setPrivacyMode,
        togglePrivacyMode,
        userId,
        setUserId,
        workspaces,
        addWorkspace,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
