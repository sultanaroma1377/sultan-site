import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('sultan_theme'); } catch { /* Use the default theme if storage is unavailable. */ }
    const next = saved !== 'light';
    document.documentElement.classList.toggle('dark', next);
    setDark(next);
  }, []);
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    setDark(next);
    try { localStorage.setItem('sultan_theme', next ? 'dark' : 'light'); } catch { /* Switching still works without persistence. */ }
  };
  return <Button variant="outline" size="icon" className="fixed bottom-5 right-5 z-40 h-11 w-11 rounded-full bg-card shadow-lg print:hidden" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun /> : <Moon />}</Button>;
}