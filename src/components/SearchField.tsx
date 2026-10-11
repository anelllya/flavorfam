import { useId } from 'react';
import { Icon } from './Icon';
import s from './SearchField.module.css';

/** Figma: input / Size=Large, search variant. Label is visually hidden but always present. */
export function SearchField({ label, placeholder, value, onChange, autoFocus }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
  /** Only when the field appears because the person asked for it (e.g. the tab bar search). */
  autoFocus?: boolean;
}) {
  const id = useId();
  return (
    <div className={s.field}>
      <Icon name="search" />
      <label htmlFor={id} className="visually-hidden">{label}</label>
      <input id={id} className={s.input} type="search" placeholder={placeholder} value={value} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
