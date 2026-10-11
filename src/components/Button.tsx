import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import s from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'large' | 'small';

interface Common {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  block?: boolean;
  children: ReactNode;
}

const cls = (variant: Variant, size: Size, block?: boolean) =>
  [s.button, s[variant], size === 'small' && s.small, block && s.block].filter(Boolean).join(' ');

/** Figma: Button (Size × State × Type). Ghost is new, added for low-emphasis actions. */
export function Button({ variant = 'primary', size = 'large', icon, block, children, ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cls(variant, size, block)} {...rest}>
      {icon && <Icon name={icon} size={size === 'small' ? 'sm' : 'md'} />}
      {children}
    </button>
  );
}

/**
 * `newTab` opens the link in a new tab: it ends with the `external` icon (for sighted users) and
 * `newTabHint` (for screen readers), so every new-tab link in the system looks and reads the same.
 */
export function ButtonLink({ variant = 'primary', size = 'large', icon, block, children, to, newTab, newTabHint }:
  Common & { to: string; newTab?: boolean; newTabHint?: string }) {
  return (
    <Link to={to} className={cls(variant, size, block)} {...(newTab && { target: '_blank', rel: 'noopener noreferrer' })}>
      {icon && <Icon name={icon} size={size === 'small' ? 'sm' : 'md'} />}
      {children}
      {newTab && <Icon name="external" size="sm" />}
      {newTab && newTabHint && <span className="visually-hidden">{` ${newTabHint}`}</span>}
    </Link>
  );
}
