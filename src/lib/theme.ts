import { useEffect, useSyncExternalStore } from 'react';

/**
 * One theme for the whole site, app included. It follows the OS until someone presses the
 * toggle in the site header; from then on that choice wins everywhere. The app in the landing
 * page iframe is a separate document, so it picks up changes through the `storage` event.
 */
const KEY = 'flavorfam:theme';
const LIGHT_QUERY = '(prefers-color-scheme: light)';

type Choice = 'light' | 'dark' | null;

let memory: Choice = null;
const listeners = new Set<() => void>();

function readChoice(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return memory;
  }
}

/** tokens.css defaults to dark, so anything but an explicit light preference is dark. */
function readSystem(): 'light' | 'dark' {
  return matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark';
}

function subscribe(onChange: () => void) {
  const mq = matchMedia(LIGHT_QUERY);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) onChange(); };
  listeners.add(onChange);
  mq.addEventListener('change', onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    mq.removeEventListener('change', onChange);
    window.removeEventListener('storage', onStorage);
  };
}

function setChoice(choice: 'light' | 'dark') {
  memory = choice;
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* private mode: the choice lasts for this visit */
  }
  listeners.forEach((l) => l());
}

/** Applies the theme to this document and returns it, plus a toggle for the header button. */
export function useTheme() {
  const choice = useSyncExternalStore(subscribe, readChoice);
  const system = useSyncExternalStore(subscribe, readSystem);
  const theme = choice ?? system;

  useEffect(() => {
    // tokens.css reads data-theme on <html>; no attribute means follow the OS.
    const root = document.documentElement;
    if (choice) root.setAttribute('data-theme', choice);
    else root.removeAttribute('data-theme');
  }, [choice]);

  return { theme, toggle: () => setChoice(theme === 'dark' ? 'light' : 'dark') };
}
