import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AppHeader, Button, ButtonLink, IconButton, Notice, NumberField, Page, SectionHeader, Select, Stack, TabBarActions, TextField,
  useSnackbar,
} from '../../components';
import { CATEGORIES, UNITS, type Unit } from '../../data';
import { t } from '../../i18n';
import { useStore } from '../../lib/store';
import {
  emptyDraft, emptyLine, emptyStep, hasErrors, matchIngredient, toDraft, toRecipe, validate,
  type Draft, type DraftLine,
} from '../../lib/recipeForm';
import { aiUrl, buildPrompt, parseAiReply, type AiTarget } from '../../lib/recipeImport';
import s from './RecipeForm.module.css';

const unitLabel = (u: Unit) => (u === 'pcs' ? t('recipeForm.unitPcs') : t(`unit.${u}`));

/**
 * Add a recipe (/app/recipes/new) or edit one of your own (/app/recipes/:id/edit).
 * Keyed by id: both routes render this component, so without the key React would keep the
 * previous draft when you go from editing one recipe straight to adding a new one.
 */
export function RecipeForm() {
  const { id } = useParams();
  return <RecipeFormFor key={id ?? 'new'} id={id} />;
}

function RecipeFormFor({ id }: { id?: string }) {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { recipes, allIngredients, lookupIngredient, saveRecipe, deleteRecipe, canEdit, canDelete, photos, setPhoto, removePhoto } = useStore();
  const existing = id ? recipes.find((r) => r.id === id) : undefined;
  const [draft, setDraft] = useState<Draft>(() => (existing ? toDraft(existing, lookupIngredient) : emptyDraft()));
  const [submitted, setSubmitted] = useState(false);
  const names = useMemo(() => allIngredients.map((i) => i.name).sort((a, b) => a.localeCompare(b)), [allIngredients]);

  const title = t(id ? 'recipeForm.titleEdit' : 'recipeForm.titleNew');
  // Save lives in the tab bar's context row, outside the <form>, so it submits by form id.
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  // Photo changes wait for Save, like every other field. A picked file is checked straight away.
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const preview = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : ''), [photoFile]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  if (id && !(existing && canEdit(existing.id))) {
    return (<><AppHeader title={title} /><Page><p>{t('recipe.notFound')}</p></Page></>);
  }

  const errors = validate(draft);
  const show = submitted ? errors : { lineName: {}, lineQty: {} };
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setLine = (key: string, patch: Partial<DraftLine>) =>
    set('lines', draft.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  // Picking a known ingredient also picks its usual unit.
  const setLineName = (key: string, name: string) => {
    const known = matchIngredient(name, allIngredients);
    setLine(key, known ? { name, unit: known.unit } : { name });
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors(errors)) {
      // The error summary may be off-screen above the tab bar: take focus to the first field to fix.
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const { recipe, newIngredients } = toRecipe(draft, allIngredients, existing?.id);
    saveRecipe(recipe, newIngredients);
    if (photoFile) setPhoto(recipe.id, photoFile).catch(() => { /* checked on pick; nothing useful to show after leaving */ });
    else if (photoRemoved) removePhoto(recipe.id).catch(() => {});
    snackbar.show(t('snack.saved'));
    navigate(`/app/recipes/${recipe.id}`, { replace: true });
  };

  const photo = photoRemoved ? '' : preview || (existing ? photos[existing.id] : '') || '';
  const pickPhoto = async (file?: File) => {
    if (!file) return;
    try {
      (await createImageBitmap(file)).close();
      setPhotoFile(file);
      setPhotoRemoved(false);
      setPhotoError('');
    } catch {
      setPhotoError(t('recipe.photoError'));
    }
  };
  const clearPhoto = () => { setPhotoFile(null); setPhotoRemoved(true); setPhotoError(''); };

  const remove = () => {
    if (!existing || !window.confirm(t('recipeForm.confirmDelete', { title: existing.title }))) return;
    deleteRecipe(existing.id);
    snackbar.show(t('snack.deleted'));
    navigate('/app/recipes', { replace: true });
  };

  return (
    <>
      <AppHeader title={title} />
      <Page>
        {!existing && (
          <RecipeImport ingredientNames={names} onDraft={(d) => { setDraft(d); setSubmitted(false); }} />
        )}
        <form id={formId} ref={formRef} className={s.form} onSubmit={save} noValidate>
          <Stack gap={3} as="section">
            <TextField label={t('recipeForm.name')} value={draft.title} onChange={(v) => set('title', v)} required
              error={show.title && t('recipeForm.error.title')} />
            <Select label={t('recipeForm.category')} value={draft.category} onChange={(v) => set('category', v)}
              options={CATEGORIES.map((c) => ({ value: c, label: t(`category.${c}`) }))} />
            <div className={s.pair}>
              <NumberField label={t('recipeForm.servings')} value={draft.servings} min={1} step={1} required
                onChange={(v) => set('servings', v)} error={show.servings && t('recipeForm.error.servings')} />
              <NumberField label={t('recipeForm.time')} value={draft.time} min={1} step={1}
                onChange={(v) => set('time', v)} error={show.time && t('recipeForm.error.time')} />
            </div>
          </Stack>

          <Stack gap={3} as="section">
            <SectionHeader title={t('recipeForm.ingredients')} />
            <ol className={s.rows}>
              {draft.lines.map((line, i) => {
                const n = i + 1;
                const isNew = !!line.name.trim() && !matchIngredient(line.name, allIngredients);
                return (
                  <li key={line.key} className={draft.lines.length > 1 ? s.line : `${s.line} ${s.single}`}>
                    <div className={s.name}>
                      <TextField label={t('recipeForm.ingredient', { n })} value={line.name} suggestions={names}
                        onChange={(v) => setLineName(line.key, v)}
                        error={show.lineName[line.key] && t('recipeForm.error.ingredient')}
                        warning={isNew ? t('recipeForm.newIngredient') : undefined} />
                    </div>
                    <NumberField label={t('recipeForm.qty')} value={line.qty} min={0} step="any"
                      onChange={(v) => setLine(line.key, { qty: v })} error={show.lineQty[line.key] && t('recipeForm.error.qty')} />
                    <Select label={t('recipeForm.unit')} value={line.unit} onChange={(v) => setLine(line.key, { unit: v })}
                      options={UNITS.map((u) => ({ value: u, label: unitLabel(u) }))} />
                    {draft.lines.length > 1 && (
                      <div className={s.remove}>
                        <IconButton icon="close" label={t('recipeForm.removeIngredient', { n })}
                          onClick={() => set('lines', draft.lines.filter((l) => l.key !== line.key))} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            {show.lines && <Notice tone="danger" role="alert">{t('recipeForm.error.noIngredients')}</Notice>}
            <div>
              <Button icon="plus" variant="secondary" size="small" onClick={() => set('lines', [...draft.lines, emptyLine()])}>
                {t('recipeForm.addIngredient')}
              </Button>
            </div>
          </Stack>

          <Stack gap={3} as="section">
            <SectionHeader title={t('recipeForm.method')} />
            <ol className={s.rows}>
              {draft.steps.map((step, i) => (
                <li key={step.key} className={draft.steps.length > 1 ? s.step : `${s.step} ${s.single}`}>
                  <TextField label={t('recipeForm.step', { n: i + 1 })} value={step.text} multiline
                    onChange={(v) => set('steps', draft.steps.map((x) => (x.key === step.key ? { ...x, text: v } : x)))} />
                  {draft.steps.length > 1 && (
                    <div className={s.remove}>
                      <IconButton icon="close" label={t('recipeForm.removeStep', { n: i + 1 })}
                        onClick={() => set('steps', draft.steps.filter((x) => x.key !== step.key))} />
                    </div>
                  )}
                </li>
              ))}
            </ol>
            {show.steps && <Notice tone="danger" role="alert">{t('recipeForm.error.noSteps')}</Notice>}
            <div>
              <Button icon="plus" variant="secondary" size="small" onClick={() => set('steps', [...draft.steps, emptyStep()])}>
                {t('recipeForm.addStep')}
              </Button>
            </div>
          </Stack>

          <TextField label={t('recipeForm.notes')} value={draft.notes} multiline onChange={(v) => set('notes', v)} />

          <Stack gap={3} as="section">
            <SectionHeader title={t('recipeForm.photo')} />
            {photo && <img className={s.photo} src={photo} alt="" />}
            <Stack row gap={3}>
              <Button icon="upload" variant="secondary" size="small" onClick={() => fileRef.current?.click()}>
                {t(photo ? 'recipe.changePhoto' : 'recipe.addPhoto')}
              </Button>
              {photo && <Button variant="secondary" size="small" onClick={clearPhoto}>{t('recipe.removePhoto')}</Button>}
            </Stack>
            <input ref={fileRef} type="file" accept="image/*" hidden aria-hidden="true" tabIndex={-1}
              onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
            {photoError && <Notice tone="danger" role="alert">{photoError}</Notice>}
          </Stack>

          {submitted && hasErrors(errors) && <Notice tone="danger" role="alert">{t('recipeForm.invalid')}</Notice>}
        </form>
        <TabBarActions>
          <ButtonLink to={existing ? `/app/recipes/${existing.id}` : '/app/recipes'} variant="secondary" size="small">
            {t('recipeForm.cancel')}
          </ButtonLink>
          <div className={s.grow}>
            <Button type="submit" form={formId} size="small" block>{t('recipeForm.save')}</Button>
          </div>
          {existing && canDelete(existing.id) && <IconButton icon="trash" label={t('recipeForm.delete')} tonal onClick={remove} />}
        </TabBarActions>
      </Page>
    </>
  );
}

const AI_TARGETS: AiTarget[] = ['chatgpt', 'claude', 'gemini'];

/**
 * Import from the web with the person's own AI: build a request, copy it and open the AI,
 * then read the pasted JSON reply into the form. Lives outside the form so Enter can't save.
 */
function RecipeImport({ ingredientNames, onDraft }: { ingredientNames: string[]; onDraft: (d: Draft) => void }) {
  const [link, setLink] = useState('');
  const [reply, setReply] = useState('');
  const [request, setRequest] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const ask = (target: AiTarget) => {
    const prompt = buildPrompt(link, ingredientNames);
    const ai = t(`recipeImport.${target}`);
    // Open first, while the click still counts as a user gesture, or popup blockers step in.
    window.open(aiUrl(target, prompt), '_blank', 'noopener,noreferrer');
    setRequest(prompt);
    navigator.clipboard.writeText(prompt).then(
      () => setStatus(t('recipeImport.copied', { ai })),
      () => setStatus(t('recipeImport.copyFailed', { ai })),
    );
  };

  const fill = () => {
    const draft = parseAiReply(reply);
    if (!draft) { setError(t('recipeImport.invalid')); setStatus(''); return; }
    setError('');
    setStatus(t('recipeImport.filled'));
    onDraft(draft);
  };

  return (
    <Stack gap={3} as="section">
      <SectionHeader title={t('recipeImport.title')} />
      <p className={s.hint}>{t('recipeImport.hint')}</p>
      <TextField label={t('recipeImport.link')} value={link} onChange={setLink} />
      <p className={s.label}>{t('recipeImport.ask')}</p>
      <Stack row gap={2}>
        {AI_TARGETS.map((target) => (
          <Button key={target} variant="secondary" size="small" onClick={() => ask(target)}>{t(`recipeImport.${target}`)}</Button>
        ))}
      </Stack>
      {request && <TextField label={t('recipeImport.request')} value={request} onChange={setRequest} multiline />}
      <TextField label={t('recipeImport.reply')} value={reply} onChange={setReply} multiline error={error || undefined} />
      <div>
        <Button variant="secondary" size="small" onClick={fill} disabled={!reply.trim()}>{t('recipeImport.fill')}</Button>
      </div>
      <div role="status">{status && <Notice tone="success">{status}</Notice>}</div>
    </Stack>
  );
}
