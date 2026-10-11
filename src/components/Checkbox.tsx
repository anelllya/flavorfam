import type { ReactNode } from 'react';
import s from './Checkbox.module.css';

/** New component (not in Figma yet). Whole row is the hit target. */
export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className={[s.row, checked && s.checked].filter(Boolean).join(' ')}>
      <input type="checkbox" className={s.input} checked={checked} onChange={onChange} />
      <span className={s.body}>{children}</span>
    </label>
  );
}
