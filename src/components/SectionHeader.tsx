import type { ReactNode } from 'react';
import s from './SectionHeader.module.css';

/** Figma: Recipe-head-element. Title on the left, one optional action on the right. */
export function SectionHeader({ title, action, as: Tag = 'h2', id }: {
  title: string; action?: ReactNode; as?: 'h2' | 'h3'; id?: string;
}) {
  return (
    <div className={s.head}>
      <Tag className={s.title} id={id}>{title}</Tag>
      {action}
    </div>
  );
}
