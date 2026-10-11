import { useMemo } from 'react';
import { AppHeader, Button, ButtonLink, Checkbox, Page, SectionHeader, Stack } from '../../components';
import { AISLES } from '../../data';
import { t } from '../../i18n';
import { buildShoppingList, formatQty } from '../../lib/shopping';
import { useStore } from '../../lib/store';
import s from './ShoppingList.module.css';

export function ShoppingList() {
  const { state, recipes, lookupIngredient, toggleChecked, clearChecked } = useStore();
  const list = useMemo(() => buildShoppingList(state.plan, recipes, lookupIngredient), [state.plan, recipes, lookupIngredient]);
  const all = AISLES.flatMap((a) => list[a]);
  const done = all.filter((i) => state.checked.includes(i.key)).length;

  if (all.length === 0) {
    return (
      <>
        <AppHeader title={t('list.title')} />
        <Page>
          <p>{t('list.empty')}</p>
          <ButtonLink to="/app/week" icon="calendar">{t('list.emptyAction')}</ButtonLink>
        </Page>
      </>
    );
  }

  return (
    <>
      <AppHeader title={t('list.title')} />
      <Page>
        <Stack row between gap={3}>
          <p className={s.progress} role="status">{t('list.progress', { done, total: all.length })}</p>
          <Button variant="ghost" size="small" onClick={clearChecked} disabled={done === 0}>{t('list.clearTicks')}</Button>
        </Stack>
        {AISLES.filter((a) => list[a].length > 0).map((aisle) => (
          <section key={aisle} className={s.aisle} aria-labelledby={`aisle-${aisle}`}>
            <SectionHeader title={t(`aisle.${aisle}`)} id={`aisle-${aisle}`} />
            <ul className={s.items}>
              {list[aisle].map((item) => {
                const unit = t(`unit.${item.unit}`);
                const from = item.recipeIds.map((id) => recipes.find((r) => r.id === id)?.title ?? id).join(', ');
                return (
                  <li key={item.key}>
                    <Checkbox checked={state.checked.includes(item.key)} onChange={() => toggleChecked(item.key)}>
                      <span className={s.qty}>{formatQty(item.qty)}{unit && ` ${unit}`}</span> {item.name}
                      <span className={s.from}>{t('list.from', { recipes: from })}</span>
                    </Checkbox>
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
