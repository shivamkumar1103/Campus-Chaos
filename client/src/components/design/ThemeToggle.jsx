import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle({ compact = false }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to Warm Retro-Pop light' : 'Switch to Cyber-Acid dark'}
      title={dark ? 'WARM RETRO-POP ☀' : 'CYBER-ACID ●'}
      className="brutal-sm invert-hover group flex cursor-pointer items-center gap-2 bg-sun px-2.5 py-1.5 font-mono text-[11px] font-bold tracking-widest text-ink uppercase hover:bg-hyper hover:text-white dark:bg-acid dark:text-obsidian dark:hover:bg-hyper dark:hover:text-white"
    >
      {dark ? <Sun className="size-4 transition-transform group-hover:rotate-90" /> : <Moon className="size-4 transition-transform group-hover:-rotate-12" />}
      {!compact && <span>{dark ? 'Retro-Pop' : 'Cyber-Acid'}</span>}
      <span className="hidden rounded-sm border border-current px-1 text-[9px] sm:inline">{dark ? 'DARK' : 'LIGHT'}</span>
    </button>
  );
}
