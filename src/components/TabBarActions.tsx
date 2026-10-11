import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * The tab bar's top row is a context bar. A screen with actions of its own (Add to week, Save,
 * Edit...) renders them in <TabBarActions>; screens without get the default search.
 * New component (not in Figma yet), added with the context-bar change.
 */
interface Slot { target: HTMLElement | null; setTarget: (el: HTMLElement | null) => void; count: number; add: () => () => void }
const SlotContext = createContext<Slot | null>(null);

export function TabBarProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [count, setCount] = useState(0);
  const add = useCallback(() => { setCount((n) => n + 1); return () => setCount((n) => n - 1); }, []);
  const value = useMemo(() => ({ target, setTarget, count, add }), [target, count, add]);
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}

/** For BottomTabs: where actions go, and whether any screen has claimed the row. */
export function useTabBarSlot() {
  const slot = useContext(SlotContext);
  return { setTarget: slot?.setTarget ?? (() => {}), hasActions: (slot?.count ?? 0) > 0 };
}

export function TabBarActions({ children }: { children: ReactNode }) {
  const slot = useContext(SlotContext);
  const add = slot?.add;
  useEffect(() => add?.(), [add]);
  return slot?.target ? createPortal(children, slot.target) : null;
}
