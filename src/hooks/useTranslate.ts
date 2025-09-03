import { useEffect, useMemo, useState } from "react";
import { translator } from "../helpers/translator";
import type { Lang } from "../@types";
import { useI18nContext } from "../context/i18n";

export const useTranslate = (lang: Lang = "en") => {
  // Read dict from SSR/provider (may be null on client without provider)
  const ctx = useI18nContext();
  const hasSSRDict = !!(ctx && ctx.lang === lang);

  // Async (client) path state — always declared in the same order
  const [tAsync, setTAsync] = useState<(key: string) => string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (key: any) => key
  );
  const [loadingAsync, setLoadingAsync] = useState(true);

  // Only run the async loader if no SSR dict
  useEffect(() => {
    if (hasSSRDict) return;

    let mounted = true;
    setLoadingAsync(true);
    translator(lang).then((translateFn) => {
      if (mounted) {
        setTAsync(() => translateFn);
        setLoadingAsync(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [lang, hasSSRDict]);

  // Choose the translator function (SSR dict wins when available)
  const t = useMemo(() => {
    if (hasSSRDict) {
      const dict = ctx!.dict;
      return (key: string) => dict[key] ?? key;
    }
    return tAsync;
  }, [hasSSRDict, ctx, tAsync]);

  const loading = hasSSRDict ? false : loadingAsync;

  return { t, loading };
};
