import { useId } from 'react';
import { Icon } from './Icon';
import s from './Select.module.css';

/**
 * Figma: input (Label, Size=Large), as a native select. The browser's arrow is replaced by our
 * chevron, inset from the rounded border like the text is.
 */
export function Select<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>{label}</label>
      <div className={s.control}>
        <select id={id} className={s.select} value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className={s.chevron}><Icon name="chevron-down" size="sm" /></span>
      </div>
    </div>
  );
}
