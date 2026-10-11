import { Link } from 'react-router-dom';
import type { Recipe } from '../data';
import { t } from '../i18n';
import s from './RecipeTile.module.css';

/**
 * Figma: Recipe-Category-image / Level=Recipe.
 * Shows the user's photo when there is one, otherwise a typographic tile tinted by category.
 * `caption` adds a muted line under the title (e.g. "Mon · Dinner" on Home's week rail).
 */
export function RecipeTile({ recipe, to, photo, caption }: { recipe: Recipe; to: string; photo?: string; caption?: string }) {
  return (
    <Link to={to} className={s.tile}>
      <span className={`${s.art} ${s[recipe.category]}`} aria-hidden="true">
        {photo ? <img className={s.photo} src={photo} alt="" /> : recipe.title.charAt(0)}
        {recipe.draft && <span className={s.badge}>{t('recipe.draft')}</span>}
      </span>
      <span className={s.title}>{recipe.title}</span>
      {caption && <span className={s.caption}>{caption}</span>}
    </Link>
  );
}
