import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { t } from '../i18n';
import { Icon } from './Icon';
import type { Tone } from './Notice';
import s from './Snackbar.module.css';

/** How long a snackbar stays up. Paused while it's hovered or focused, so it can always be read. */
const VISIBLE_MS = 5000;

interface Snack { id: number; message: string; tone: Tone }
interface Ctx { show: (message: string, tone?: Tone) => void; snack: Snack | null; dismiss: () => void; setPaused: (p: boolean) => void }
const SnackbarContext = createContext<Ctx | null>(null);

/**
 * New component: confirms an action that finished (saved, deleted, added to the week). It sits
 * just above the tab bar, survives navigation (the provider lives in AppShell) and is announced
 * through a polite live region. Screens call `useSnackbar().show(message)`.
 */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snack, setSnack] = useState<Snack | null>(null);
  const [paused, setPaused] = useState(false);
  const show = useCallback((message: string, tone: Tone = 'success') => setSnack({ id: Date.now(), message, tone }), []);
  const dismiss = useCallback(() => setSnack(null), []);

  useEffect(() => {
    if (!snack || paused) return;
    const timer = setTimeout(() => setSnack((cur) => (cur?.id === snack.id ? null : cur)), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [snack, paused]);

  const value = useMemo(() => ({ show, snack, dismiss, setPaused }), [show, snack, dismiss]);
  return <SnackbarContext.Provider value={value}>{children}</SnackbarContext.Provider>;
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  return { show: ctx?.show ?? (() => {}) };
}

/** The snackbar itself; also used on its own by the System page. */
export function Snackbar({ message, tone = 'success', onDismiss }: { message: string; tone?: Tone; onDismiss?: () => void }) {
  return (
    <div className={`${s.snackbar} ${s[tone]}`}>
      <Icon name={tone === 'success' ? 'check' : 'close'} size="sm" />
      <span className={s.message}>{message}</span>
      {onDismiss && (
        <button type="button" className={s.dismiss} onClick={onDismiss}>{t('snack.dismiss')}</button>
      )}
    </div>
  );
}

/** Where the provider's snackbar appears: placed by BottomTabs, just above the tab bar. */
export function SnackbarHost() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) return null;
  const { snack, dismiss, setPaused } = ctx;
  return (
    <>
      {/* Announces only the message (not the Dismiss button). Always present, so it can speak. */}
      <p role="status" className="visually-hidden">{snack?.message}</p>
      <div className={s.host} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
        {snack && <Snackbar key={snack.id} message={snack.message} tone={snack.tone} onDismiss={dismiss} />}
      </div>
    </>
  );
}
