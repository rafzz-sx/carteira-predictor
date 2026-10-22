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

function generateUniqueUserId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return 'user_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
  }
  const rand = Math.random().toString(36).substring(2, 8);
  const time = Date.now().toString(36).substring(4);
  return `user_${rand}${time}`;
}

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
      if (urlUser && urlUser.trim()) {
        const clean = urlUser.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        localStorage.setItem('cp_user_id', clean);
        return clean;
      }

      const savedUser = localStorage.getItem('cp_user_id');
      if (savedUser && savedUser !== 'demo-user-1') {
        return savedUser;
      }

      // Generate a brand new unique private workspace ID for this device
      const freshId = generateUniqueUserId();
      localStorage.setItem('cp_user_id', freshId);
      return freshId;
    }
    return 'user_default';
  });

  const [workspaces, setWorkspaces] = useState<UserWorkspace[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cp_workspaces');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0 && !parsed.some((w) => w.id === 'demo-user-1')) {
            return parsed;
          }
        } catch {
          // ignore parsing error
        }
      }
    }
    return [{ id: userId, name: 'Carteira Principal' }];
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
    const clean = newUserId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || generateUniqueUserId();
    setUserIdState(clean);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_user_id', clean);
      window.location.reload(); // Reload to refresh portfolio queries for new workspace
    }
  };

  const addWorkspace = (id: string, name: string) => {
    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || generateUniqueUserId();
    const updated = [...workspaces.filter((w) => w.id !== cleanId), { id: cleanId, name }];
    setWorkspaces(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_workspaces', JSON.stringify(updated));
    }
    setUserId(cleanId);
  };

  useEffect(() => {
    // Sync class on body / html for CSS tokens
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-oled', 'theme-light');
    root.classList.add(`theme-${theme}`);
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

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
