import type { ButtonHTMLAttributes, Ref } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import s from './IconButton.module.css';

interface Props {
  icon: IconName;
  /** Required: icon-only controls must have an accessible name. */
  label: string;
  filled?: boolean;
  /** Neutral round button on a surface (e.g. the tab bar search). */
  tonal?: boolean;
}

export function IconButton({ icon, label, filled, tonal, ref, ...rest }:
  Props & ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> }) {
  return (
    <button ref={ref} type="button" aria-label={label} title={label}
      className={[s.iconButton, filled && s.filled, tonal && s.tonal].filter(Boolean).join(' ')} {...rest}>
      <Icon name={icon} />
    </button>
  );
}

export function IconLink({ icon, label, filled, tonal, to }: Props & { to: string }) {
  return (
    <Link to={to} aria-label={label} title={label} className={[s.iconButton, filled && s.filled, tonal && s.tonal].filter(Boolean).join(' ')}>
      <Icon name={icon} />
    </Link>
  );
}
