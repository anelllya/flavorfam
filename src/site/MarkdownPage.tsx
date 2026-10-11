import { Marked } from 'marked';
import { useMemo } from 'react';
import thinking from '../../content/thinking.md?raw';
import status from '../../evals/runs.md?raw';
import { WithToc } from './OnThisPage';
import s from './Site.module.css';

const docs = { thinking, status };

const slug = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';

/** Renders markdown with ids on the section headings (h2), and returns those headings for the contents list. */
function render(md: string) {
  const sections: { id: string; title: string }[] = [];
  const parser = new Marked({
    renderer: {
      heading({ tokens, depth, text }) {
        const html = this.parser.parseInline(tokens);
        if (depth !== 2) return `<h${depth}>${html}</h${depth}>\n`;
        const id = slug(text);
        // The contents list shows plain text: no backticks or emphasis markers from the markdown.
        sections.push({ id, title: text.replace(/[`*_]/g, '') });
        // tabindex lets the contents list move keyboard focus to the section it scrolls to.
        return `<h2 id="${id}" tabindex="-1">${html}</h2>\n`;
      },
    },
  });
  return { html: parser.parse(md, { async: false }), sections };
}

/**
 * Long-form pages are markdown in /content, written by a human. Not UI copy, so not in en.json.
 * `toc` adds "On this page" navigation by section heading (see WithToc).
 */
export function MarkdownPage({ doc, toc = false }: { doc: keyof typeof docs; toc?: boolean }) {
  const { html, sections } = useMemo(() => render(docs[doc]), [doc]);
  const article = <article className={s.prose} dangerouslySetInnerHTML={{ __html: html }} />;
  return (
    <main className={s.main}>
      {toc && sections.length > 0 ? <WithToc sections={sections}>{article}</WithToc> : article}
    </main>
  );
}
