import s from './ToggleGroup.module.css';

/**
 * New component: multi-select toggle buttons in an even grid (e.g. days of the week).
 * Built from the chip spec; each button reports its state with aria-pressed.
 * `ariaLabel` gives a fuller name when the visible label is short ("Mon" → "Monday").
 */
export function ToggleGroup<T extends string>({ label, options, value, onChange }: {
  label: string; options: { value: T; label: string; ariaLabel?: string }[]; value: T[]; onChange: (v: T[]) => void;
}) {
  const toggle = (v: T) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className={s.group} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className={s.toggle} aria-pressed={value.includes(o.value)}
          aria-label={o.ariaLabel} onClick={() => toggle(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
