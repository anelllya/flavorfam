import { Children, type ReactNode } from 'react';
import s from './Rail.module.css';

/**
 * New component: a horizontal row of cards that scrolls sideways. It runs to the screen edge and
 * sizes cards so the next one is cut off, which is the cue that there's more. Snaps card by card.
 * Each child becomes a list item; `label` names the list for screen readers.
 * Assumes it sits in a Page (it bleeds over the Page's side padding).
 */
export function Rail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul className={s.rail} aria-label={label}>
      {Children.map(children, (child) => child && <li className={s.item}>{child}</li>)}
    </ul>
  );
}
