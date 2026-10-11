import { useMemo } from 'react';
import {
  AppHeader, ButtonLink, Notice, Page, Rail, RecipeTile, SectionHeader, Stack, StatTile,
} from '../../components';
import { AISLES, DAYS, SLOTS } from '../../data';
import { t } from '../../i18n';
import { byRecent } from '../../lib/recipeForm';
import { buildShoppingList } from '../../lib/shopping';
import { useStore } from '../../lib/store';
import s from './Home.module.css';

const TONES = ['green', 'orange', 'brown'] as const;

/** Home: three rails (recent recipes, this week, the shopping list), each with its counter. */
export function Home() {
  const { state, recipes, photos, lookupIngredient } = useStore();

  const recent = useMemo(() => byRecent(recipes).slice(0, 5), [recipes]);

  // Planned meals in calendar order: Monday breakfast first.
  const week = useMemo(() => [...state.plan]
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot))
    .flatMap((p) => {
      const recipe = recipes.find((r) => r.id === p.recipeId);
      return recipe ? [{ entry: p, recipe }] : [];
    }), [state.plan, recipes]);
  const slotsInWeek = DAYS.length * SLOTS.length;

  const list = useMemo(() => buildShoppingList(state.plan, recipes, lookupIngredient), [state.plan, recipes, lookupIngredient]);
  const items = AISLES.flatMap((a) => list[a]);
  const ticked = items.filter((i) => state.checked.includes(i.key)).length;

  return (
    <>
      <AppHeader title={t('app.name')} back={false} />
      <Page>
        <p className={s.welcome}>{t('home.welcome')}</p>

        <section className={s.section} aria-labelledby="home-recipes">
          <div>
            <SectionHeader id="home-recipes" title={t('home.recipes.title')}
              action={<ButtonLink to="/app/recipes" variant="ghost" size="small">{t('home.seeAll')}</ButtonLink>} />
            <p className={s.count}>{t('home.recipes.count', { count: recipes.length })}</p>
          </div>
          <Rail label={t('home.recipes.title')}>
            {recent.map((r) => <RecipeTile key={r.id} recipe={r} photo={photos[r.id]} to={`/app/recipes/${r.id}`} />)}
          </Rail>
        </section>

        <section className={s.section} aria-labelledby="home-week">
          <div>
            <SectionHeader id="home-week" title={t('home.week.title')}
              action={<ButtonLink to="/app/week" variant="ghost" size="small">{t('home.seeAll')}</ButtonLink>} />
            <p className={s.count}>{t('home.week.count', { count: week.length, total: slotsInWeek })}</p>
          </div>
          {week.length === 0 ? (
            <Stack gap={3}>
              <Notice>{t('home.week.empty')}</Notice>
              <div><ButtonLink to="/app/week" variant="secondary" size="small">{t('home.week.plan')}</ButtonLink></div>
            </Stack>
          ) : (
            <Rail label={t('home.week.title')}>
              {week.map(({ entry, recipe }) => (
                <RecipeTile key={entry.id} recipe={recipe} photo={photos[recipe.id]} to={`/app/recipes/${recipe.id}`}
                  caption={t('home.week.caption', { day: t(`dayShort.${entry.day}`), slot: t(`slot.${entry.slot}`) })} />
              ))}
            </Rail>
          )}
        </section>

        <section className={s.section} aria-labelledby="home-list">
          <div>
            <SectionHeader id="home-list" title={t('home.list.title')}
              action={<ButtonLink to="/app/list" variant="ghost" size="small">{t('home.seeAll')}</ButtonLink>} />
            <p className={s.count}>{t('home.list.count', { done: ticked, total: items.length })}</p>
          </div>
          {items.length === 0 ? (
            <Notice>{t('home.list.empty')}</Notice>
          ) : (
            <Rail label={t('home.list.title')}>
              {AISLES.filter((a) => list[a].length > 0).map((aisle, i) => {
                const n = list[aisle].length;
                const done = list[aisle].filter((it) => state.checked.includes(it.key)).length;
                return (
                  <StatTile key={aisle} value={n} label={t(`aisle.${aisle}`)} to="/app/list" tone={TONES[i % TONES.length]}
                    caption={done ? t('home.list.ticked', { done, count: n }) : n === 1 ? t('home.list.items.one') : t('home.list.items', { count: n })} />
                );
              })}
            </Rail>
          )}
        </section>
      </Page>
    </>
  );
}
