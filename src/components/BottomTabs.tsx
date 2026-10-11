import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { t } from '../i18n';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { useTabBarSlot } from './TabBarActions';
import { SearchField } from './SearchField';
import { SnackbarHost } from './Snackbar';
import s from './BottomTabs.module.css';

/** `match` decides the active tab: Recipes covers every recipe page except Add. */
const tabs: { to: string; icon: IconName; label: Parameters<typeof t>[0]; match: (path: string) => boolean }[] = [
  { to: '/app', icon: 'sparkles', label: 'nav.home', match: (p) => p === '/app' || p === '/app/' },
  { to: '/app/recipes', icon: 'grid', label: 'nav.recipes', match: (p) => p.startsWith('/app/recipes') && !p.startsWith('/app/recipes/new') },
  { to: '/app/recipes/new', icon: 'plus', label: 'nav.add', match: (p) => p.startsWith('/app/recipes/new') },
  { to: '/app/week', icon: 'calendar', label: 'nav.week', match: (p) => p.startsWith('/app/week') },
  { to: '/app/list', icon: 'list', label: 'nav.list', match: (p) => p.startsWith('/app/list') },
];

function Tab({ to, icon, label, active }: Omit<(typeof tabs)[number], 'match'> & { active: boolean }) {
  return (
    <Link to={to} aria-current={active ? 'page' : undefined} className={[s.tab, active && s.active].filter(Boolean).join(' ')}>
      <span className={s.icon}><Icon name={icon} size="lg" /></span>
      {t(label)}
    </Link>
  );
}

/**
 * Figma: Bottom tabs, reworked: a neutral container with a search row above five plain tabs.
 * The round search button opens the app's only search field. Typing filters Recipes live
 * (it navigates there on the first keystroke and keeps other params, like a week pick);
 * closing the search clears it.
 * The top row is a context bar: a screen's <TabBarActions> replace the search there.
 */
export function BottomTabs() {
  const { setTarget, hasActions } = useTabBarSlot();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const onRecipes = pathname === '/app/recipes';
  // The URL is the only copy of the query, so Recipes' "Clear search" and the back button stay in step.
  const q = onRecipes ? params.get('q') ?? '' : '';
  const [open, setOpen] = useState(false);
  const searchButton = useRef<HTMLButtonElement>(null);
  const closedByUser = useRef(false);

  // Closing hands focus back to the button that opened the search.
  useEffect(() => {
    if (!open && closedByUser.current) searchButton.current?.focus();
    closedByUser.current = false;
  }, [open]);

  const search = (value: string) => {
    const next = new URLSearchParams(onRecipes ? params : undefined);
    if (value.trim()) next.set('q', value); else next.delete('q');
    const query = next.toString();
    navigate(`/app/recipes${query ? `?${query}` : ''}`, { replace: onRecipes });
  };
  const close = () => {
    closedByUser.current = true;
    setOpen(false);
    if (q) search('');
  };
  // Results are already showing; Enter just puts the keyboard away.
  const submit = (e: FormEvent) => {
    e.preventDefault();
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <div className={s.bar}>
      <SnackbarHost />
      <div className={s.searchRow}>
        <div ref={setTarget} className={hasActions ? s.actions : s.hidden} />
        {!hasActions && (open ? (
          <form role="search" className={s.searchForm} onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && close()}>
            <div className={s.searchField}>
              <SearchField label={t('search.label')} placeholder={t('search.placeholder')} value={q} onChange={search} autoFocus />
            </div>
            <IconButton icon="close" label={t('nav.closeSearch')} onClick={close} />
          </form>
        ) : (
          <IconButton ref={searchButton} icon="search" label={t('nav.search')} tonal aria-expanded={false} onClick={() => setOpen(true)} />
        ))}
      </div>
      <nav className={s.tabs} aria-label={t('nav.main')}>
        {tabs.map(({ match, ...tab }) => <Tab key={tab.to} {...tab} active={match(pathname)} />)}
      </nav>
    </div>
  );
}
