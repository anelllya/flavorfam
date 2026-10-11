// All UI copy lives in en.json (the resx equivalent). Translating = adding es.json / bg.json.
import en from './en.json';

export type StringKey = keyof typeof en;
const dict: Record<string, string> = en;

export function t(key: StringKey, vars: Record<string, string | number> = {}): string {
  const raw = dict[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
