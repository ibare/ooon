import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { en } from './en';
import { ko } from './ko';
import type { Dictionary, Lang } from './types';

const dicts: Record<Lang, Dictionary> = { en, ko };

interface LangContextValue {
  lang: Lang;
  t: Dictionary;
}

const LangContext = createContext<LangContextValue>({ lang: 'en', t: en });

export function LangProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ lang, t: dicts[lang] }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  return useContext(LangContext);
}
