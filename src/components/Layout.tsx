import type { ReactNode } from 'react';
import s from './Layout.module.css';

/** Layout primitives so screens never need their own spacing CSS. */
export function Page({ children }: { children: ReactNode }) {
  return <main className={s.page}>{children}</main>;
}

export function Stack({ children, gap = 4, row, between, as: Tag = 'div' }: {
  children: ReactNode; gap?: 1 | 2 | 3 | 4 | 6; row?: boolean; between?: boolean; as?: 'div' | 'section' | 'ul' | 'ol';
}) {
  const cls = [s.stack, s[`gap-${gap}`], row && s.row, between && s.between].filter(Boolean).join(' ');
  return <Tag className={cls}>{children}</Tag>;
}
