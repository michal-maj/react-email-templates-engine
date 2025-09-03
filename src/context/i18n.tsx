import React, { createContext, useContext } from "react";

export type Dict = Record<string, string>;
type Ctx = { lang: string; dict: Dict };

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  lang,
  dict,
  children,
}: React.PropsWithChildren<{ lang: string; dict: Dict }>) {
  return (
    <I18nContext.Provider value={{ lang, dict }}>
      {children}
    </I18nContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18nContext() {
  return useContext(I18nContext);
}
