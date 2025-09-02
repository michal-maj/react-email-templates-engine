import type { Lang } from "../@types";

const loadLocale = async (locale: Lang) => {
  const messages = await import(`../locales/${locale}.json`);
  return messages.default;
};

export async function translator(lang: Lang) {
  const locales = await loadLocale(lang);
  return (key: string) => locales[key] || key;
}
