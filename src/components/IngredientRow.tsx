import type { Unit } from '../data';
import { t } from '../i18n';
import { formatQty } from '../lib/shopping';
import s from './IngredientRow.module.css';

/** Figma: Ingredient. Quantity bold and right-aligned, dotted rule underneath. */
export function IngredientRow({ qty, unit, name, note }: { qty: number; unit: Unit; name: string; note?: string }) {
  const u = t(`unit.${unit}`);
  return (
    <li className={s.row}>
      <span className={s.qty}>{formatQty(qty)}{u && ` ${u}`}</span>
      <span>
        {name}
        {note && <span className={s.note}>{note}</span>}
      </span>
    </li>
  );
}
