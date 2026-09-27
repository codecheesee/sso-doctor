import type { Theme } from '../lib/hooks';
import { GithubIcon, LogoMark, MonitorIcon, MoonIcon, SunIcon } from './icons';
import { GridPattern, Tag } from './ui';

const REPO_URL = 'https://github.com/codecheesee/sso-doctor';

const THEMES: Array<{ value: Theme; label: string; Icon: typeof SunIcon }> = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
];

export function Header({ theme, onThemeChange }: { theme: Theme; onThemeChange: (t: Theme) => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-900/[0.06] bg-white/70 backdrop-blur-xl backdrop-saturate-150 dark:border-white/[0.06] dark:bg-zinc-950/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <a href="./" className="flex items-center gap-2.5 rounded-lg" aria-label="SSO Doctor home">
          <LogoMark className="size-8 drop-shadow-[0_4px_12px_rgb(16_185_129/0.35)]" />
          <span className="text-[15px] font-semibold tracking-tight">
            SSO Doctor
          </span>
        </a>
        <Tag tone="zinc" className="hidden sm:inline-flex">
          v1.1
        </Tag>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 rounded-full bg-brand-400/10 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-500/20 ring-inset md:inline-flex dark:text-brand-300 dark:ring-brand-400/20">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping-slow rounded-full bg-brand-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
            </span>
            Local-only · zero network calls
          </span>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <GithubIcon className="size-[18px]" />
            <span className="sr-only">Source on GitHub</span>
          </a>

          <div role="radiogroup" aria-label="Color theme" className="flex rounded-full bg-zinc-900/[0.04] p-0.5 ring-1 ring-zinc-900/[0.06] dark:bg-white/5 dark:ring-white/10">
            {THEMES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                title={label}
                onClick={() => onThemeChange(value)}
                className={`rounded-full p-1.5 transition ${
                  theme === value
                    ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:bg-zinc-700 dark:text-white dark:ring-white/10'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
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

/** Decorative gradient + grid behind the top of the page. */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] overflow-hidden">
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]">
        <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_20%_0%,rgb(52_211_153/0.28),transparent_70%),radial-gradient(50%_70%_at_85%_10%,rgb(45_212_191/0.22),transparent_70%),radial-gradient(40%_60%_at_55%_0%,rgb(190_242_100/0.18),transparent_70%)] opacity-70 dark:opacity-40" />
        <GridPattern
          size={48}
          squares={[
            [-4, 1],
            [-1, 3],
            [2, 0],
            [3, 2],
            [6, 1],
            [-7, 4],
          ]}
          className="absolute inset-0 h-full w-full fill-brand-500/[0.06] stroke-zinc-900/[0.06] dark:fill-brand-400/[0.05] dark:stroke-white/[0.06]"
        />
      </div>
    </div>
  );
}

export function Intro() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-10 pb-2 sm:px-6 lg:pt-14">
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag tone="brand">SAML 2.0</Tag>
        <Tag tone="sky">OIDC</Tag>
        <Tag tone="violet">JWT · JWE</Tag>
      </div>
      <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Diagnose SSO tokens{' '}
        <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent dark:from-brand-300 dark:to-teal-300">without them leaving your machine.</span>
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        Paste a SAMLResponse or JWT. SSO Doctor decodes it, runs protocol checks, and explains every failure with a fix.
      </p>
    </div>
  );
}
