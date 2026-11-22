import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { useLanguage } from "../../features/i18n/useLanguage";
import { listMedications } from "../../lib/demoStore";
import type { LanguageCode } from "../../lib/types";
import ElderNav from "../../components/elder/ElderNav";
import LanguageToggle from "../../components/elder/LanguageToggle";
import { InstallPrompt, INSTALL_HELP_TEXT } from "../../features/pwa/InstallPrompt";

interface TodayDose {
  time: string;
  name: string;
}

/** Local calendar date as YYYY-MM-DD. */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's scheduled doses from active medicines, read-only. */
function todayDoses(familyId: string): TodayDose[] {
  const today = localDateKey(new Date());
  return listMedications(familyId)
    .filter(
      (m) =>
        m.status === "active" && m.start_date <= today && (m.end_date === null || m.end_date >= today),
    )
    .flatMap((m) => m.scheduled_times.map((time) => ({ time, name: m.name })))
    .sort((a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name));
}

/** True when the browser can read text aloud. */
function speechOutputAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

function readAloud(text: string, language: LanguageCode): void {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
  window.speechSynthesis.speak(utterance);
}

const CHOICE_CLASS =
  "flex min-h-16 w-full items-center justify-center rounded-lg border-2 border-charcoal bg-white px-6 py-4 text-center text-2xl font-semibold text-charcoal hover:bg-sage focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

const EMERGENCY_CLASS =
  "flex min-h-16 w-full items-center justify-center rounded-lg border-2 border-charcoal bg-coral px-6 py-4 text-center text-2xl font-bold text-charcoal hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

const READ_CLASS =
  "inline-flex min-h-16 items-center justify-center rounded-lg border-2 border-charcoal bg-white px-6 py-4 text-center text-2xl font-semibold text-charcoal hover:bg-sage focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

export default function ElderHomePage() {
  const { family, elder } = useAuth();
  const { language, setLanguage, t, error: languageError } = useLanguage();
  const familyId = family?.id ?? null;
  const [speechError, setSpeechError] = useState<string | null>(null);

  const doses = useMemo(() => (familyId ? todayDoses(familyId) : []), [familyId]);

  const greetingName = elder?.display_name ?? "there";
  const greetingText = t("greeting", { name: greetingName });

  const medicinesText = (): string => {
    const heading = t("medicines");
    if (doses.length === 0) return `${heading}. No medicines are scheduled for today.`;
    return `${heading}. ${doses.map((dose) => `${dose.time}, ${dose.name}`).join(". ")}`;
  };

  const canSpeak = speechOutputAvailable();

  const onReadAloud = (text: string) => {
    setSpeechError(null);
    try {
      readAloud(text, language);
    } catch {
      setSpeechError("Read aloud did not work. The text is shown on screen.");
    }
  };

  return (
    <main className="min-h-screen bg-ivory px-4 pb-40 pt-8 text-charcoal">
      <div className="mx-auto max-w-2xl space-y-10">
        <header className="space-y-6">
          <LanguageToggle language={language} setLanguage={setLanguage} />
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">{greetingText}</h1>
          {canSpeak && (
            <button type="button" onClick={() => onReadAloud(greetingText)} className={READ_CLASS}>
              Read aloud
            </button>
          )}
        </header>

        {languageError && (
          <p role="alert" className="rounded-lg border-2 border-forest bg-white p-4 text-2xl leading-relaxed">
            {languageError}
          </p>
        )}

        {speechError && (
          <p role="alert" className="rounded-lg border-2 border-forest bg-white p-4 text-2xl leading-relaxed">
            {speechError}
          </p>
        )}

        {!family ? (
          <p className="rounded-lg border border-sage bg-white p-4 text-2xl leading-relaxed">
            Your family link is not set up yet. Ask your family to add you in the app.
          </p>
        ) : (
          <>
            <section aria-labelledby="how-heading" className="space-y-4">
              <h2 id="how-heading" className="text-2xl font-semibold text-forest">
                How are you today?
              </h2>
              <div className="space-y-4">
                <Link to="/app/elder/checkin?status=ok" className={CHOICE_CLASS}>
                  {t("okay")}
                </Link>
                <Link to="/app/elder/checkin?status=need_assistance" className={CHOICE_CLASS}>
                  {t("needHelp")}
                </Link>
                <Link to="/app/elder/checkin?status=contact_family" className={CHOICE_CLASS}>
                  {t("contactFamily")}
                </Link>
                <Link to="/app/elder/emergency" className={EMERGENCY_CLASS}>
                  {t("emergency")}
                </Link>
              </div>
            </section>

            <section aria-labelledby="medicines-heading" className="space-y-4">
              <h2 id="medicines-heading" className="text-2xl font-semibold text-forest">
                Today's medicines
              </h2>
              {doses.length === 0 ? (
                <p className="rounded-lg border border-sage bg-white p-4 text-2xl leading-relaxed">
                  No medicines are scheduled for today.
                </p>
              ) : (
                <ul className="space-y-3">
                  {doses.map((dose) => (
                    <li
                      key={`${dose.name}-${dose.time}`}
                      className="rounded-lg border border-sage bg-white p-4 text-2xl leading-relaxed"
                    >
                      <span className="font-semibold">{dose.time}</span> {dose.name}
                    </li>
                  ))}
                </ul>
              )}
              {canSpeak && (
                <button type="button" onClick={() => onReadAloud(medicinesText())} className={READ_CLASS}>
                  Read aloud
                </button>
              )}
            </section>
          </>
        )}

        <section aria-label="Install app" className="space-y-2">
          <InstallPrompt />
          <p className="text-base leading-relaxed text-charcoal">{INSTALL_HELP_TEXT}</p>
        </section>
      </div>
      <ElderNav />
    </main>
  );
}
