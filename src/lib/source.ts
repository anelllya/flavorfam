/**
 * A recipe's source as a link, when it is one. Seed data stores bare domains
 * ("recepti.gotvach.bg/r-58545"); imports store full URLs. Only http(s) ever becomes a link,
 * and the label is the site's name, which reads better than the whole address.
 */
export function sourceLink(source: string): { href: string; label: string } | undefined {
  const raw = source.trim();
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : /^[\w-]+(\.[\w-]+)+(\/|$)/.test(raw) ? `https://${raw}` : '';
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    return { href: url.href, label: url.hostname.replace(/^www\./, '') };
  } catch {
    return undefined;
  }
}
