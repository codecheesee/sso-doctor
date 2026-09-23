import type { Theme } from '../lib/hooks';
import { LockIcon, MonitorIcon, MoonIcon, PulseIcon, SunIcon } from './icons';

const THEMES: Array<{ value: Theme; label: string; Icon: typeof SunIcon }> = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
];

export function Header({ theme, onThemeChange }: { theme: Theme; onThemeChange: (t: Theme) => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
          <PulseIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] leading-tight font-semibold tracking-tight">SSO Doctor</h1>
          <p className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">SAML &amp; JWT troubleshooter</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/15 md:inline-flex dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20">
            <LockIcon className="size-3.5" />
            100% in-browser · nothing is uploaded
          </span>
          <div role="radiogroup" aria-label="Color theme" className="flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-900">
            {THEMES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                title={label}
                onClick={() => onThemeChange(value)}
                className={`rounded-md p-1.5 transition ${
                  theme === value
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="size-4" />
                <span className="sr-only">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
