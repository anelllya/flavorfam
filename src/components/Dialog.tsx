import { useEffect, useId, useRef, type ReactNode } from 'react';
import s from './Dialog.module.css';

/**
 * New component: a modal bottom sheet on the native <dialog>, which brings focus trapping,
 * Escape to close and a backdrop. `actions` sit in a row at the bottom, like the tab bar's.
 */
export function Dialog({ open, title, onClose, children, actions }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode; actions: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={s.dialog} aria-labelledby={titleId} onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}>
      <div className={s.body}>
        <h2 id={titleId} className={s.title}>{title}</h2>
        {children}
        <div className={s.actions}>{actions}</div>
      </div>
    </dialog>
  );
}
