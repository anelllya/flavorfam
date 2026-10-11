import type { ReactNode } from 'react';
import s from './Notice.module.css';

export type Tone = 'info' | 'success' | 'warning' | 'danger';

/**
 * New component: a status message in the page. Tinted fill (`--color-{tone}-subtle`), strong edge
 * and text (`--color-{tone}`). Pass `role="alert"` for errors that appear after an action; for
 * messages that should be announced politely, render the Notice inside an always-present
 * `role="status"` element (a live region has to exist before it speaks).
 */
export function Notice({ tone = 'info', role, children }: { tone?: Tone; role?: 'alert'; children: ReactNode }) {
  return <p className={`${s.notice} ${s[tone]}`} role={role}>{children}</p>;
}
