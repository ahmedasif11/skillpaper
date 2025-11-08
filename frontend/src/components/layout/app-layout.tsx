'use client';

import { useState, useEffect } from 'react';
import { Navbar } from './navbar';
import { useAuthContext } from '../../contexts/AuthContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout } = useAuthContext();

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDarkMode(shouldBeDark);
  }, []);

  // Handle theme changes and persist to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        user={user}
        onLogout={logout}
      />
      <main className="pt-16">{children}</main>
    </div>
  );
}
