import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { AppHeader, Button, ButtonLink, ChipGroup, Page, RecipeTile, SectionHeader, Stack } from '../../components';
import { CATEGORIES, type Category, DAYS, SLOTS, type Day, type Slot } from '../../data';
import { t } from '../../i18n';
import { byRecent } from '../../lib/recipeForm';
import { useStore } from '../../lib/store';
import s from './Recipes.module.css';

type Filter = 'all' | 'mama' | 'mine' | Category;

export function Recipes() {
  const { recipes, photos } = useStore();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const filter = (params.get('f') ?? 'all') as Filter;
  const pick = parsePick(params.get('pick'));

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    // "All" shows what you added or edited most recently first; the other filters keep the seed order.
    const list = filter === 'all' ? byRecent(recipes) : recipes;
    return list.filter((r) =>
      (filter === 'all' || (filter === 'mama' || filter === 'mine' ? r.collection === filter : r.category === filter)) &&
      (!needle || r.title.toLowerCase().includes(needle) || r.originalTitle?.toLowerCase().includes(needle)));
  }, [recipes, q, filter]);

  const options: { value: Filter; label: string }[] = [
    { value: 'all', label: t('recipes.filter.all') },
    { value: 'mama', label: t('recipes.filter.mama') },
    ...(recipes.some((r) => r.collection === 'mine') ? [{ value: 'mine' as Filter, label: t('recipes.filter.mine') }] : []),
    ...CATEGORIES.map((c) => ({ value: c as Filter, label: t(`category.${c}`) })),
  ];
  const pickQuery = pick ? `?pick=${pick.day}:${pick.slot}` : '';

  return (
    <>
      <AppHeader title={t('recipes.title')} />
      <Page>
        {pick && (
          <Stack row between gap={2}>
            <p className={s.banner}>{t('recipes.picking', { day: t(`day.${pick.day}`), slot: t(`slot.${pick.slot}`).toLowerCase() })}</p>
            <ButtonLink to="/app/week" variant="ghost" size="small">{t('recipes.cancelPick')}</ButtonLink>
          </Stack>
        )}
        {q.trim() && (
          <Stack row between gap={2}>
            <p>{t('recipes.searching', { query: q.trim() })}</p>
            <Button variant="ghost" size="small" onClick={() => set('q', '')}>{t('recipes.clearSearch')}</Button>
          </Stack>
        )}
        <ChipGroup label={t('recipes.title')} options={options} value={filter} onChange={(v) => set('f', v === 'all' ? '' : v)} />
        <Stack gap={3} as="section">
          <SectionHeader title={t('recipes.count', { count: results.length })} />
          {results.length === 0 ? (
            <p>{t('recipes.empty', { query: q })}</p>
          ) : (
            <ul className={s.grid}>
              {results.map((r) => (
                <li key={r.id}><RecipeTile recipe={r} photo={photos[r.id]} to={`/app/recipes/${r.id}${pickQuery}`} /></li>
              ))}
            </ul>
          )}
        </Stack>
      </Page>
    </>
  );
}

export function parsePick(raw: string | null): { day: Day; slot: Slot } | null {
  if (!raw) return null;
  const [day, slot] = raw.split(':') as [Day, Slot];
  return DAYS.includes(day) && SLOTS.includes(slot) ? { day, slot } : null;
}
