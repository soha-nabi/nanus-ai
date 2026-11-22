import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getElderPreferences, setElderLanguage } from "../../lib/demoStore";
import { t as translate } from "../../lib/i18n";
import type { LanguageCode } from "../../lib/types";

export interface UseLanguageResult {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string, vars?: Record<string, string>) => string;
  /** Last language-preference error, or null. */
  error: string | null;
}

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Could not save your language. Please try again.";
}

export function useLanguage(): UseLanguageResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [error, setError] = useState<string | null>(null);

  // Load the saved preference on mount and whenever the signed-in user changes.
  useEffect(() => {
    setError(null);
    if (!userId) {
      setLanguageState("en");
      return;
    }
    try {
      const prefs = getElderPreferences(userId);
      setLanguageState(prefs?.language ?? "en");
    } catch (err) {
      setLanguageState("en");
      setError(errorMessage(err));
    }
  }, [userId]);

  const setLanguage = useCallback(
    (code: LanguageCode) => {
      if (!userId) {
        setError("Please sign in to choose a language.");
        return;
      }
      setError(null);
      try {
        setElderLanguage(userId, code);
        setLanguageState(code);
      } catch (err) {
        setError(errorMessage(err));
      }
    },
    [userId],
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => translate(language, key, vars),
    [language],
  );

  return { language, setLanguage, t, error };
}
