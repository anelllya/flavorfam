import { Link } from 'react-router-dom';
import s from './RecipeTile.module.css';

/**
 * New component: a number on a tinted tile, with a label under it (e.g. an aisle and its items).
 * Same shape and tints as RecipeTile, so rails of either read as one family.
 */
export function StatTile({ value, label, caption, to, tone }: {
  value: number | string; label: string; caption?: string; to: string; tone: 'green' | 'orange' | 'brown';
}) {
  return (
    <Link to={to} className={s.tile}>
      <span className={`${s.art} ${s[tone]}`} aria-hidden="true">{value}</span>
      <span className={s.title}>{label}</span>
      {caption && <span className={s.caption}>{caption}</span>}
    </Link>
  );
}
