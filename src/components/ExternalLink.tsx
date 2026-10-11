import type { ReactNode } from 'react';
import { t } from '../i18n';
import { Icon } from './Icon';
import s from './ExternalLink.module.css';

/**
 * New component: an inline text link to another site. Always opens in a new tab and says so,
 * with the same ↗ icon and screen-reader hint as a `newTab` ButtonLink.
 */
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={s.link}>
      {children}
      <Icon name="external" size="sm" />
      <span className="visually-hidden">{` ${t('link.newTab')}`}</span>
    </a>
  );
}
