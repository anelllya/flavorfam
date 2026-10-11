import { t } from '../i18n';
import s from './Loop.module.css';

const nodes = [
  { key: 'site.loop.intent', x: 20, y: 20 },
  { key: 'site.loop.system', x: 220, y: 20 },
  { key: 'site.loop.skill', x: 420, y: 20 },
  { key: 'site.loop.generate', x: 420, y: 130 },
  { key: 'site.loop.evals', x: 220, y: 130 },
  { key: 'site.loop.fix', x: 20, y: 130 },
] as const;

/** The core loop: intent, system, skill, generation, gate, fix, and the fix feeds the system. */
export function Loop() {
  return (
    <figure className={s.figure}>
      <svg viewBox="0 0 600 230" className={s.svg} role="img" aria-labelledby="loop-desc">
        <desc id="loop-desc">{t('site.loop.desc')}</desc>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className={s.head} />
          </marker>
        </defs>
        {['M180 45H216', 'M380 45H416', 'M500 70V126', 'M420 155H384', 'M220 155H184'].map((d) => (
          <path key={d} d={d} className={s.edge} markerEnd="url(#arrow)" />
        ))}
        <path d="M100 130V100H300V72" className={`${s.edge} ${s.feedback}`} markerEnd="url(#arrow)" />
        <text x="200" y="94" className={s.edgeLabel}>{t('site.loop.update')}</text>
        {nodes.map((n) => (
          <g key={n.key}>
            <rect x={n.x} y={n.y} width="160" height="50" rx="12" className={n.key === 'site.loop.evals' ? s.gate : s.node} />
            <text x={n.x + 80} y={n.y + 30} className={s.label}>{t(n.key)}</text>
          </g>
        ))}
      </svg>
      <figcaption className={s.caption}>{t('site.loop.desc')}</figcaption>
    </figure>
  );
}
