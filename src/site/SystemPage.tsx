import { useMemo, useState } from 'react';
import tokens from '../../tokens/tokens.json';
import {
  Button, Checkbox, ChipGroup, Dialog, ExternalLink, ICON_NAMES, Notice, Rail, Snackbar, StatTile, Icon, IconButton, IngredientRow, Logo, NumberField, RecipeTile, SearchField,
  SectionHeader, Select, Stack, TextField, ToggleGroup, type IconName,
} from '../components';
import { DAYS, SLOTS, seedRecipes, type Day, type Slot } from '../data';
import { t } from '../i18n';
import { WithToc } from './OnThisPage';
import s from './SystemPage.module.css';
import site from './Site.module.css';

// The token gallery is the one place allowed to set styles dynamically: it renders tokens, so it can't be built from them.
// The override is scoped to this file in eslint.config.js.

const guardrails = [
  ['no-raw-color', 'Hex, rgb(), hsl() and named colours are rejected outside tokens.css.'],
  ['use-tokens', 'Spacing, radius, type and motion must be var(--token). Custom stylelint rule.'],
  ['no-inline-style', 'No style={{}} in components or screens.'],
  ['no-hardcoded-copy', 'JSX text is rejected. Copy goes through t() and en.json.'],
  ['data-access', 'Screens read data through src/data, never raw JSON.'],
  ['axe', 'Every route is scanned with axe-core. Zero violations.'],
  ['visual', 'Every route is screenshotted and diffed against a baseline.'],
  ['unit', 'Shopping-list maths is unit tested: aggregation by id, never by name.'],
] as const;

// The stack and the alternatives, named as identifiers (not copy); the reasoning lives in en.json.
const stack = [
  ['Vite', 'site.stack.vite'],
  ['React + TypeScript', 'site.stack.react'],
  ['CSS Modules + tokens', 'site.stack.css'],
  ['HashRouter + GitHub Pages', 'site.stack.hosting'],
  ['The gate', 'site.stack.gate'],
] as const;
const options = [
  ['Next.js', 'site.stack.next'],
  ['Astro', 'site.stack.astro'],
  ['Create React App', 'site.stack.cra'],
  ['MUI / shadcn', 'site.stack.library'],
] as const;

// The page's sections, in order, for the "On this page" list. Ids match the SectionHeaders below.
const sectionKeys = [
  ['colors', 'site.system.colors'], ['space', 'site.system.space'], ['type', 'site.system.type'],
  ['components', 'site.system.components'], ['icons', 'site.system.icons'], ['stack', 'site.stack.title'],
  ['guardrails', 'site.system.guardrails'],
] as const;

export function SystemPage() {
  const sections = useMemo(() => sectionKeys.map(([id, key]) => ({ id, title: t(key) })), []);
  const sample = seedRecipes.find((r) => r.id === 'lentils-eggs')!;
  // Live demos: the toggles and the sheet work here exactly as in the app.
  const [days, setDays] = useState<Day[]>(['mon', 'thu']);
  const [slots, setSlots] = useState<Slot[]>(['dinner']);
  const [sheet, setSheet] = useState(false);
  const dayOptions = DAYS.map((d) => ({ value: d, label: t(`dayShort.${d}`), ariaLabel: t(`day.${d}`) }));
  const slotOptions = SLOTS.map((x) => ({ value: x, label: t(`slot.${x}`) }));
  return (
    <main className={site.main}>
      <WithToc sections={sections} wide>
      <div className={site.stack}>
        <h1 className={site.title}>{t('site.system.title')}</h1>
        <p className={site.lede}>{t('site.system.lede')}</p>

        <section className={site.stack} aria-labelledby="colors">
          <SectionHeader title={t('site.system.colors')} id="colors" />
          <ul className={s.swatches}>
            {Object.keys(tokens.semantic.dark).map((k) => (
              <li key={k} className={s.swatch}>
                <span className={s.chip} style={{ background: `var(--color-${k})` }} />
                <code>{`--color-${k}`}</code>
              </li>
            ))}
          </ul>
        </section>

        <section className={site.stack} aria-labelledby="space">
          <SectionHeader title={t('site.system.space')} id="space" />
          <ul className={s.scale}>
            {Object.entries(tokens.space).map(([k, v]) => (
              <li key={k} className={s.scaleRow}>
                <code>{`--space-${k}`}</code>
                <span className={s.bar} style={{ inlineSize: `var(--space-${k})` }} />
                <span className={site.muted}>{`${v}px`}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={site.stack} aria-labelledby="type">
          <SectionHeader title={t('site.system.type')} id="type" />
          <ul className={s.scale}>
            {Object.entries(tokens.font.size).reverse().map(([k, v]) => (
              <li key={k} className={s.scaleRow}>
                <code>{`--text-${k}`}</code>
                <span style={{ fontSize: `var(--text-${k})` }}>{t('site.system.sample')}</span>
                <span className={site.muted}>{`${v}px`}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={site.stack} aria-labelledby="components">
          <SectionHeader title={t('site.system.components')} id="components" />
          <div className={s.gallery}>
            <div className={s.cell}><Stack gap={2}>{(['info', 'success', 'warning', 'danger'] as const).map((tone) => <Notice key={tone} tone={tone}>{t(`site.system.status.${tone}`)}</Notice>)}</Stack><code>{'Notice (info · success · warning · danger)'}</code></div>
            <div className={s.cell}><Stack gap={2}><Snackbar message={t('snack.saved')} onDismiss={() => {}} /><Snackbar message={t('settings.importError')} tone="danger" /></Stack><code>{'Snackbar · useSnackbar().show()'}</code></div>
            <div className={s.cell}><Stack row gap={4}><Logo size={34} /><Logo size={64} label={t('app.name')} /></Stack><code>{'Logo (decorative, or named with label)'}</code></div>
            <div className={s.cell}><Stack gap={3}><Button icon="plus">{t('recipe.addToWeek')}</Button><Button variant="secondary">{t('week.toList')}</Button><Stack row gap={2}><Button size="small">{t('recipeForm.save')}</Button><Button variant="secondary" size="small">{t('recipeForm.cancel')}</Button><Button variant="ghost" size="small">{t('week.clear')}</Button></Stack></Stack><code>{'Button · ButtonLink (large; small = 44px, same as IconButton)'}</code></div>
            <div className={s.cell}><p>{t('recipe.sourceLabel')} <ExternalLink href="https://recepti.gotvach.bg/r-58545">{'recepti.gotvach.bg'}</ExternalLink></p><code>{'ExternalLink'}</code></div>
            <div className={s.cell}><SearchField label={t('search.label')} placeholder={t('search.placeholder')} value="" onChange={() => {}} /><code>{'SearchField'}</code></div>
            <div className={s.cell}><div className={s.tileBox}><RecipeTile recipe={sample} to={`/app/recipes/${sample.id}`} caption={t('home.week.caption', { day: t('dayShort.mon'), slot: t('slot.dinner') })} /></div><code>{'RecipeTile (caption optional)'}</code></div>
            <div className={s.cell}><div className={s.tileBox}><StatTile value={10} label={t('aisle.produce')} caption={t('home.list.items', { count: 10 })} to="/app/list" tone="green" /></div><code>{'StatTile'}</code></div>
            <div className={s.cell}><div className={s.railBox}><Rail label={t('home.recipes.title')}>{seedRecipes.slice(0, 5).map((r) => <RecipeTile key={r.id} recipe={r} to={`/app/recipes/${r.id}`} />)}</Rail></div><code>{'Rail (scroll sideways)'}</code></div>
            <div className={s.cell}><ul className={s.plain}>{sample.ingredients.slice(0, 3).map((l, i) => <IngredientRow key={i} qty={l.qty} unit={l.unit} name={l.ingredientId} />)}</ul><code>{'IngredientRow'}</code></div>
            <div className={s.cell}><Checkbox checked onChange={() => {}}>{t('day.mon')}</Checkbox><Checkbox checked={false} onChange={() => {}}>{t('day.tue')}</Checkbox><code>{'Checkbox'}</code></div>
            <div className={s.cell}><ChipGroup label={t('recipes.title')} value="all" onChange={() => {}} options={[{ value: 'all', label: t('recipes.filter.all') }, { value: 'mama', label: t('recipes.filter.mama') }]} /><code>{'ChipGroup'}</code></div>
            <div className={s.cell}><Select label={t('recipe.pickDay')} value="mon" onChange={() => {}} options={[{ value: 'mon', label: t('day.mon') }]} /><code>{'Select'}</code></div>
            <div className={s.cell}><TextField label={t('recipeForm.name')} value="" onChange={() => {}} /><code>{'TextField'}</code></div>
            <div className={s.cell}><NumberField label={t('recipeForm.servings')} value="4" min={1} onChange={() => {}} /><code>{'NumberField'}</code></div>
            <div className={s.cell}><Stack row gap={2}><IconButton icon="close" label={t('week.clear')} /><IconButton icon="plus" label={t('nav.addRecipe')} filled /><IconButton icon="search" label={t('nav.search')} tonal /><IconButton icon="edit" label={t('recipe.edit')} tonal /><IconButton icon="trash" label={t('recipeForm.delete')} tonal /></Stack><code>{'IconButton · IconLink (default, filled, tonal)'}</code></div>
            <div className={s.cell}><Stack gap={3}><Stack row gap={2}><Button variant="secondary" size="small">{t('recipeForm.cancel')}</Button><Button size="small">{t('recipeForm.save')}</Button><IconButton icon="trash" label={t('recipeForm.delete')} tonal /></Stack><p className={site.muted}>{t('site.system.contextBar')}</p></Stack><code>{'TabBarActions'}</code></div>
            <div className={s.cell}><Stack gap={3}><ToggleGroup label={t('plan.days')} value={days} onChange={setDays} options={dayOptions} /><ToggleGroup label={t('plan.meals')} value={slots} onChange={setSlots} options={slotOptions} /></Stack><code>{'ToggleGroup'}</code></div>
            <div className={s.cell}>
              <Button variant="secondary" size="small" onClick={() => setSheet(true)}>{t('site.system.openDialog')}</Button>
              <Dialog open={sheet} title={t('plan.title')} onClose={() => setSheet(false)}
                actions={<><Button variant="secondary" size="small" onClick={() => setSheet(false)}>{t('plan.cancel')}</Button><Button size="small" onClick={() => setSheet(false)}>{t('plan.confirm', { count: days.length * slots.length })}</Button></>}>
                <ToggleGroup label={t('plan.days')} value={days} onChange={setDays} options={dayOptions} />
                <ToggleGroup label={t('plan.meals')} value={slots} onChange={setSlots} options={slotOptions} />
              </Dialog>
              <code>{'Dialog'}</code>
            </div>
          </div>
        </section>

        <section className={site.stack} aria-labelledby="icons">
          <SectionHeader title={t('site.system.icons')} id="icons" />
          <ul className={s.icons}>
            {ICON_NAMES.map((name: IconName) => (
              <li key={name} className={s.icon}><Icon name={name} size="lg" /><code>{name}</code></li>
            ))}
          </ul>
        </section>

        <section className={site.stack} aria-labelledby="stack">
          <SectionHeader title={t('site.stack.title')} id="stack" />
          <p className={site.lede}>{t('site.stack.lede')}</p>
          <ul className={s.rules}>
            {stack.map(([name, why]) => (
              <li key={name} className={s.rule}><code>{name}</code><span>{t(why)}</span></li>
            ))}
          </ul>
          <SectionHeader title={t('site.stack.options')} as="h3" />
          <ul className={s.rules}>
            {options.map(([name, why]) => (
              <li key={name} className={s.rule}><code>{name}</code><span>{t(why)}</span></li>
            ))}
          </ul>
        </section>

        <section className={site.stack} aria-labelledby="guardrails">
          <SectionHeader title={t('site.system.guardrails')} id="guardrails" />
          <ul className={s.rules}>
            {guardrails.map(([name, desc]) => (
              <li key={name} className={s.rule}><code>{name}</code><span>{desc}</span></li>
            ))}
          </ul>
        </section>
      </div>
      </WithToc>
    </main>
  );
}
