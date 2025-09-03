import { useEffect, useState } from "react";
import { translator } from "../helpers/translator";
import type { Lang } from "../@types";

export const useTranslate = (lang: Lang = "en") => {
  const [t, setT] = useState<(key: string) => string>(
    () => (key: string) => key
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    translator(lang).then((translateFn) => {
      if (isMounted) {
        setT(() => translateFn);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [lang]);

  return { t, loading };
};
