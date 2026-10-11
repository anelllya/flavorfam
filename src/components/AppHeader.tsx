import { useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import { IconButton, IconLink } from './IconButton';
import { Logo } from './Logo';
import s from './AppHeader.module.css';

/**
 * Figma: App header (Type=Back link). Title is the page h1.
 * Every screen gets a back arrow except the app's start (Home), which passes `back={false}`
 * and shows the logo there instead (decorative: the h1 already says FlavorFam).
 */
export function AppHeader({ title, back = true }: { title: string; back?: boolean }) {
  const navigate = useNavigate();
  // React Router counts in-app history; with nothing behind us (opened from a link), go Home.
  const goBack = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/app'));
  return (
    <header className={s.header}>
      {back ? <IconButton icon="back" label={t('nav.back')} onClick={goBack} /> : <span className={s.logo}><Logo size={32} /></span>}
      <h1 className={s.title}>{title}</h1>
      <IconLink icon="user" label={t('nav.settings')} to="/app/settings" />
    </header>
  );
}
