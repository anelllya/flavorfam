import { Link, NavLink, Outlet } from 'react-router-dom';
import { t } from '../i18n';
import { ButtonLink, IconButton, Logo } from '../components';
import { useTheme } from '../lib/theme';
import s from './Site.module.css';

export function SiteLayout() {
  const link = ({ isActive }: { isActive: boolean }) => (isActive ? s.link : s.link);
  const { theme, toggle } = useTheme();
  return (
    <div className={s.site}>
      <header>
        <nav className={s.nav}>
          <Link to="/" className={s.brand}><Logo size={28} />{t('app.name')}</Link>
          <NavLink to="/system" className={link}>{t('site.nav.system')}</NavLink>
          <NavLink to="/thinking" className={link}>{t('site.nav.thinking')}</NavLink>
          <NavLink to="/status" className={link}>{t('site.nav.status')}</NavLink>
          <IconButton
            icon={theme === 'dark' ? 'sun' : 'moon'}
            label={t(theme === 'dark' ? 'site.theme.toLight' : 'site.theme.toDark')}
            onClick={toggle}
          />
          <ButtonLink to="/app" size="small" newTab newTabHint={t('site.newTab')}>{t('site.nav.app')}</ButtonLink>
        </nav>
      </header>
      <Outlet />
      <footer className={s.footer}>{t('site.footer')}</footer>
    </div>
  );
}
