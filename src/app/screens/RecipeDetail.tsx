import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AppHeader, Button, Dialog, ExternalLink, Icon, IconButton, IconLink, IngredientRow, Notice, Page, SectionHeader, Stack,
  TabBarActions, ToggleGroup, useSnackbar,
} from '../../components';
import { DAYS, SLOTS, ingredientLabel, type Day, type Ingredient, type Slot } from '../../data';
import { t } from '../../i18n';
import { sourceLink } from '../../lib/source';
import { useStore } from '../../lib/store';
import { parsePick } from './Recipes';
import s from './RecipeDetail.module.css';

const labelFor = (ing: Ingredient | undefined, id: string, qty: number, unit: Parameters<typeof ingredientLabel>[2]) =>
  ing ? ingredientLabel(ing, qty, unit) : id;

export function RecipeDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { recipes, addToPlan, planRecipe, photos, lookupIngredient, canEdit, canDelete, deleteRecipe } = useStore();
  const pick = parsePick(params.get('pick'));
  // The "Add to week" sheet: any number of days × meals, so one dish can cover several meals.
  const [planning, setPlanning] = useState(false);
  const [days, setDays] = useState<Day[]>([]);
  const [slots, setSlots] = useState<Slot[]>(['dinner']);
  const snackbar = useSnackbar();
  const recipe = recipes.find((r) => r.id === id);

  if (!recipe) {
    return (<><AppHeader title={t('app.name')} /><Page><p>{t('recipe.notFound')}</p></Page></>);
  }

  const where = (d: Day, sl: Slot) => ({ day: t(`day.${d}`), slot: t(`slot.${sl}`).toLowerCase() });
  // Picking for a known slot (from Week) adds straight away; otherwise open the sheet.
  const add = () => {
    if (pick) {
      addToPlan(pick.day, pick.slot, recipe.id);
      snackbar.show(t('snack.addedTo', where(pick.day, pick.slot)));
      navigate('/app/week');
      return;
    }
    setPlanning(true);
  };
  const count = days.length * slots.length;
  const confirm = () => {
    const { added: n, replaced } = planRecipe(recipe.id, days, slots);
    const msg = n === 0 ? t('plan.already') : n === 1 ? t('plan.added.one') : t('plan.added', { count: n });
    const text = replaced === 0 ? msg : `${msg} ${replaced === 1 ? t('plan.replaced.one') : t('plan.replaced', { count: replaced })}`;
    snackbar.show(text, n === 0 ? 'info' : 'success');
    setPlanning(false);
    setDays([]);
  };

  const remove = () => {
    if (!window.confirm(t('recipeForm.confirmDelete', { title: recipe.title }))) return;
    deleteRecipe(recipe.id);
    snackbar.show(t('snack.deleted'));
    navigate('/app/recipes', { replace: true });
  };

  const source = recipe.source ? sourceLink(recipe.source) : undefined;

  // Read mode only shows the photo; adding or changing it happens in the edit form.
  const photo = photos[recipe.id];

  return (
    <>
      <AppHeader title={t('app.name')} />
      <Page>
        {photo && <img className={s.photo} src={photo} alt="" />}
        <div className={photo ? s.heroPlain : `${s.hero} ${s[recipe.category]}`}>
          <h2 className={s.title}>{recipe.title}</h2>
          {recipe.originalTitle && <p lang="bg">{recipe.originalTitle}</p>}
        </div>
        <div className={s.meta}>
          <span className={s.metaItem}><Icon name="user" size="sm" />{t('recipe.servings', { count: recipe.servings })}</span>
          {recipe.timeMinutes && <span className={s.metaItem}><Icon name="clock" size="sm" />{t('recipe.time', { minutes: recipe.timeMinutes })}</span>}
          <span>{t(`collection.${recipe.collection}`)}</span>
        </div>
        {recipe.draft && <Notice tone="warning">{t('recipe.draftHint')}</Notice>}
        <TabBarActions>
          <div className={s.grow}>
            <Button icon="plus" size="small" block onClick={add}>
              {pick ? t('recipe.addToSlot', where(pick.day, pick.slot)) : t('recipe.addToWeek')}
            </Button>
          </div>
          {canEdit(recipe.id) && <IconLink icon="edit" label={t('recipe.edit')} to={`/app/recipes/${recipe.id}/edit`} tonal />}
          {canDelete(recipe.id) && <IconButton icon="trash" label={t('recipeForm.delete')} tonal onClick={remove} />}
        </TabBarActions>
        <Dialog open={planning} title={t('plan.title')} onClose={() => setPlanning(false)}
          actions={(
            <>
              <Button variant="secondary" size="small" onClick={() => setPlanning(false)}>{t('plan.cancel')}</Button>
              <div className={s.grow}>
                <Button size="small" block disabled={count === 0} onClick={confirm}>
                  {count === 0 ? t('plan.none') : count === 1 ? t('plan.confirm.one') : t('plan.confirm', { count })}
                </Button>
              </div>
            </>
          )}>
          <p className={s.hint}>{t('plan.hint')}</p>
          <ToggleGroup label={t('plan.days')} value={days} onChange={setDays}
            options={DAYS.map((d) => ({ value: d, label: t(`dayShort.${d}`), ariaLabel: t(`day.${d}`) }))} />
          <ToggleGroup label={t('plan.meals')} value={slots} onChange={setSlots}
            options={SLOTS.map((x) => ({ value: x, label: t(`slot.${x}`) }))} />
        </Dialog>

        <Stack gap={3} as="section">
          <SectionHeader title={t('recipe.ingredients')} />
          <ul className={s.list}>
            {recipe.ingredients.map((line, i) => (
              <IngredientRow key={i} qty={line.qty} unit={line.unit} name={labelFor(lookupIngredient(line.ingredientId), line.ingredientId, line.qty, line.unit)} note={line.note} />
            ))}
          </ul>
        </Stack>

        <Stack gap={3} as="section">
          <SectionHeader title={t('recipe.method')} />
          <ol className={s.steps}>{recipe.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
        </Stack>

        {(recipe.notes || recipe.source) && (
          <Stack gap={3} as="section">
            <SectionHeader title={t('recipe.notes')} />
            <div className={s.notes}>
              {recipe.notes && <p>{recipe.notes}</p>}
              {recipe.source && (source ? (
                <p>{t('recipe.sourceLabel')} <ExternalLink href={source.href}>{source.label}</ExternalLink></p>
              ) : <p>{t('recipe.source', { source: recipe.source })}</p>)}
            </div>
          </Stack>
        )}
      </Page>
    </>
  );
}
