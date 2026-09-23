import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'sso-doctor:';

/** useState for a plain object backed by localStorage. Storage errors (private mode, quota) are ignored. */
export function useLocalStorage<T extends object>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? ({ ...initial, ...JSON.parse(raw) } as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value]);

  return [value, setValue];
}

export type Theme = 'light' | 'dark' | 'system';

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const raw = localStorage.getItem(PREFIX + 'theme');
      const t = raw ? JSON.parse(raw) : 'system';
      return t === 'light' || t === 'dark' ? t : 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    try {
      localStorage.setItem(PREFIX + 'theme', JSON.stringify(theme));
    } catch {
      // ignore
    }
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  return [theme, setThemeState];
}

/** Copies text to the clipboard and exposes a short-lived "copied" flag. */
export function useCopy(timeout = 1500): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), timeout);
    return () => clearTimeout(t);
  }, [copied, timeout]);

  const copy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  }, []);

  return [copied, copy];
}

/** Current time, refreshed on an interval so relative times and expiry checks stay live. */
export function useNow(intervalMs = 15000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
