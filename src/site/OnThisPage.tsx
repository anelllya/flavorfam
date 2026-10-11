import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { t } from '../i18n';
import s from './Site.module.css';

export interface Section { id: string; title: string }

/**
 * A page with "On this page" navigation by section heading: a sticky right-hand column on wide
 * screens, above the content on narrow ones. `sections` are the ids and titles of the page's h2s.
 * `wide` lets the content take the remaining width (System) instead of an article column.
 */
export function WithToc({ sections, wide, children }: { sections: Section[]; wide?: boolean; children: ReactNode }) {
  const [current, setCurrent] = useState<string | undefined>(sections[0]?.id);
  // After a click, keep the clicked section highlighted until the reader scrolls themselves:
  // near the end of the page a heading can't reach the top, so position alone would pick the next one.
  const pinned = useRef(false);

  // Highlight the section being read: the last heading near the top of the screen, or the last
  // section once the page is scrolled to the bottom.
  useEffect(() => {
    const headings = sections.map((x) => document.getElementById(x.id)).filter((h): h is HTMLElement => !!h);
    const onScroll = () => {
      if (pinned.current) return;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const passed = headings.filter((h) => h.getBoundingClientRect().top <= window.innerHeight * 0.2);
      setCurrent((atEnd ? headings.at(-1) : passed.at(-1) ?? headings[0])?.id);
    };
    const unpin = () => { pinned.current = false; };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    for (const ev of ['wheel', 'touchmove', 'keydown'] as const) window.addEventListener(ev, unpin, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      for (const ev of ['wheel', 'touchmove', 'keydown'] as const) window.removeEventListener(ev, unpin);
    };
  }, [sections]);

  // The site uses hash routes (#/thinking), so in-page links scroll instead of changing the hash.
  const go = (e: MouseEvent, id: string) => {
    e.preventDefault();
    const heading = document.getElementById(id);
    if (!heading) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    // Headings aren't focusable by default; make this one focusable so keyboard users land there.
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    pinned.current = true;
    setCurrent(id);
  };

  return (
    <div className={wide ? `${s.withToc} ${s.wide}` : s.withToc}>
      {children}
      <nav className={s.toc} aria-labelledby="toc-title">
        <p id="toc-title" className={s.tocTitle}>{t('site.toc')}</p>
        <ol className={s.tocList}>
          {sections.map((x) => (
            <li key={x.id}>
              <a href={`#${x.id}`} className={s.tocLink} title={x.title} aria-current={current === x.id ? 'location' : undefined}
                onClick={(e) => go(e, x.id)}>
                {x.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
