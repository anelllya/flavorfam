import { Link } from 'react-router-dom';
import { AppHeader, Button, ButtonLink, Icon, IconButton, Page, SectionHeader, Stack } from '../../components';
import { DAYS, SLOTS } from '../../data';
import { t } from '../../i18n';
import { useStore } from '../../lib/store';
import s from './Week.module.css';

export function Week() {
  const { state, recipes, removeFromPlan, clearPlan } = useStore();

  return (
    <>
      <AppHeader title={t('week.title')} />
      <Page>
        <Stack row between gap={3}>
          <p>{t('week.summary', { count: state.plan.length })}</p>
          <Stack row gap={2}>
            <Button variant="ghost" size="small" onClick={clearPlan} disabled={state.plan.length === 0}>{t('week.clear')}</Button>
            <ButtonLink to="/app/list" variant="secondary" size="small" icon="cart">{t('week.toList')}</ButtonLink>
          </Stack>
        </Stack>

        {DAYS.map((day) => (
          <section key={day} className={s.day} aria-labelledby={`day-${day}`}>
            <SectionHeader title={t(`day.${day}`)} id={`day-${day}`} />
            <ul className={s.slots}>
              {SLOTS.map((slot) => {
                const entries = state.plan.filter((p) => p.day === day && p.slot === slot);
                const where = { day: t(`day.${day}`), slot: t(`slot.${slot}`).toLowerCase() };
                return (
                  <li key={slot} className={s.slot}>
                    <span className={s.slotName}>{t(`slot.${slot}`)}</span>
                    {entries.length === 0 ? (
                      <Link to={`/app/recipes?pick=${day}:${slot}`} className={s.empty} aria-label={t('week.addTo', where)}>
                        <Icon name="plus" size="sm" />{t('week.empty')}
                      </Link>
                    ) : (
                      <ul className={s.meals}>
                        {entries.map((e) => {
                          const recipe = recipes.find((r) => r.id === e.recipeId);
                          return recipe ? (
                            <li key={e.id} className={s.mealRow}>
                              <Link to={`/app/recipes/${recipe.id}`} className={s.meal}>{recipe.title}</Link>
                              <IconButton icon="close" label={t('week.remove', { recipe: recipe.title, ...where })} onClick={() => removeFromPlan(e.id)} />
                            </li>
                          ) : null;
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </Page>
    </>
  );
}
