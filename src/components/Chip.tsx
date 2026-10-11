import s from './Chip.module.css';

/** New component: single-select filter chips. Built from the small secondary Button spec. */
export function ChipGroup<T extends string>({ label, options, value, onChange }: {
  label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className={s.group} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className={s.chip} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
