import { useId } from 'react';
import s from './TextField.module.css';

/**
 * Figma: input (Label, Size=Large). Approved gap from run 2 (add recipe).
 * `multiline` renders a textarea. `suggestions` adds native autocomplete; free text is still allowed.
 * `warning` is advisory (the value is kept), `error` blocks saving and marks the field invalid.
 */
export function TextField({ label, value, onChange, multiline, suggestions, warning, error, required }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; suggestions?: string[]; warning?: string; error?: string; required?: boolean;
}) {
  const id = useId();
  const message = error ?? warning;
  const field = {
    id, value, required,
    className: s.input,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': message ? `${id}-msg` : undefined,
  };
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>{label}</label>
      {multiline ? (
        <textarea {...field} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...field} type="text" list={suggestions ? `${id}-list` : undefined} autoComplete={suggestions ? 'off' : undefined}
          onChange={(e) => onChange(e.target.value)} />
      )}
      {suggestions && <datalist id={`${id}-list`}>{suggestions.map((o) => <option key={o} value={o} />)}</datalist>}
      {message && <p id={`${id}-msg`} className={error ? s.error : s.warning}>{message}</p>}
    </div>
  );
}
