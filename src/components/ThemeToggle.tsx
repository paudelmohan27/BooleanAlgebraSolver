import { useEffect } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export default function ThemeToggle() {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    // Initial theme setup on mount
    setTheme(theme);
  }, [theme, setTheme]);

  return (
    <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md p-1 rounded-full border border-slate-300/50 dark:border-slate-700/50 transition-all duration-300">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-full transition-all duration-300 ${
          theme === 'light'
            ? 'bg-white text-blue-600 shadow-md scale-110'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Light Mode"
      >
        <Sun className="h-4.5 w-4.5" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-full transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-950 text-sky-400 shadow-md scale-110'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Dark Mode"
      >
        <Moon className="h-4.5 w-4.5" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-full transition-all duration-300 ${
          theme === 'system'
            ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-md scale-110'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="System Mode"
      >
        <Laptop className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
