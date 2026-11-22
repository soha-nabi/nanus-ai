import type { LanguageCode } from "../../lib/types";

interface LanguageToggleProps {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
}

const OPTIONS: { code: LanguageCode; label: string; lang: string }[] = [
  { code: "en", label: "English", lang: "en" },
  { code: "hi", label: "हिन्दी", lang: "hi" },
];

const BASE_CLASS =
  "flex min-h-16 flex-1 items-center justify-center rounded-lg border-2 border-charcoal px-6 py-4 text-center text-2xl font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

export default function LanguageToggle({ language, setLanguage }: LanguageToggleProps) {
  return (
    <div role="group" aria-label="Language" className="flex gap-3">
      {OPTIONS.map(({ code, label, lang }) => {
        const pressed = language === code;
        return (
          <button
            key={code}
            type="button"
            lang={lang}
            aria-pressed={pressed}
            onClick={() => setLanguage(code)}
            className={`${BASE_CLASS} ${pressed ? "bg-forest text-ivory" : "bg-white text-charcoal hover:bg-sage"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
