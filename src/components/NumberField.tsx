import { useId } from 'react';
import s from './TextField.module.css';

/**
 * Figma: input (Label, Size=Large), numeric. Approved gap from run 2 (add recipe).
 * The value is the raw string so a field can be empty mid-edit; the screen parses and validates it.
 */
export function NumberField({ label, value, onChange, min, step, error, required }: {
  label: string; value: string; onChange: (v: string) => void;
  min?: number; step?: number | 'any'; error?: string; required?: boolean;
}) {
  const id = useId();
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>{label}</label>
      <input id={id} className={s.input} type="number" inputMode="decimal" min={min} step={step} value={value} required={required}
        aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-msg` : undefined}
        onChange={(e) => onChange(e.target.value)} />
      {error && <p id={`${id}-msg`} className={s.error}>{error}</p>}
    </div>
  );
}
