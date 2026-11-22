import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import DemoRoleSwitcher from "../../components/DemoRoleSwitcher";
import { useLanguage } from "../../features/i18n/useLanguage";
import {
  listMedications,
  listMedicationEvents,
  listWellnessCheckins,
  submitWellnessCheckin,
  recordElderMedicineConfirmation,
} from "../../lib/demoStore";
import type { LanguageCode, Medication, MedicationEvent, ParentConfirmation, WellnessCheckin } from "../../lib/types";
import ElderNav from "../../components/elder/ElderNav";
import LanguageToggle from "../../components/elder/LanguageToggle";
import { InstallPrompt, INSTALL_HELP_TEXT } from "../../features/pwa/InstallPrompt";
import { CheckCircle2, HeartHandshake, PhoneCall, AlertTriangle, Volume2, Pill } from "lucide-react";

interface TodayDose {
  medicationId: string;
  time: string;
  name: string;
  dosage: string;
}

/** Local calendar date as YYYY-MM-DD. */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatCheckinTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Today's scheduled doses from active medicines. */
function todayDoses(familyId: string): TodayDose[] {
  const today = localDateKey(new Date());
  return listMedications(familyId)
    .filter(
      (m: Medication) =>
        m.status === "active" && m.start_date <= today && (m.end_date === null || m.end_date >= today)
    )
    .flatMap((m: Medication) =>
      m.scheduled_times.map((time: string) => ({
        medicationId: m.id,
        time,
        name: m.name,
        dosage: m.instructions,
      }))
    )
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

export default function ElderHomePage() {
  const { family, elder, user } = useAuth();
  const { language, setLanguage, t, error: languageError } = useLanguage();
  const familyId = family?.id ?? "demo-family-1";
  const elderId = elder?.id ?? "demo-elder-kamala";
  const userId = user?.id ?? "demo-elder-user";

  const [refreshKey, setRefreshKey] = useState(0);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showAlternativeStatus, setShowAlternativeStatus] = useState(false);

  const todayKey = localDateKey(new Date());

  // Today's scheduled doses
  const doses = useMemo(() => (familyId ? todayDoses(familyId) : []), [familyId, refreshKey]);

  // Today's events to know if doses have been confirmed
  const medEvents: MedicationEvent[] = useMemo(
    () => (familyId ? listMedicationEvents(familyId) : []),
    [familyId, refreshKey]
  );

  // Latest checkin today
  const checkins: WellnessCheckin[] = useMemo(
    () => (familyId ? listWellnessCheckins(familyId) : []),
    [familyId, refreshKey]
  );

  const todayCheckin = checkins.find((c) => c.created_at.startsWith(todayKey));

  const greetingName = elder?.display_name ?? "there";
  const greetingText = t("greeting", { name: greetingName });

  const canSpeak = speechOutputAvailable();

  const onReadAloud = (text: string) => {
    setSpeechNotice(null);
    try {
      readAloud(text, language);
    } catch {
      setSpeechNotice("Speech is not supported on this browser.");
    }
  };

  // ONE-TAP 5-SECOND WELLNESS CHECK-IN
  const handleOneTapCheckin = (status: "ok" | "need_assistance" | "contact_family") => {
    setActionError(null);
    try {
      submitWellnessCheckin({
        familyId,
        elderId,
        submittedBy: userId,
        status,
        notes: null,
      });
      const message =
        status === "ok"
          ? language === "hi"
            ? "बहुत अच्छा! आपका चेक-इन दर्ज हो गया है। परिवार को सूचित कर दिया गया है।"
            : "Wonderful! Your check-in is recorded. Your family knows you are doing well."
          : language === "hi"
          ? "आपकी सहायता सूचना परिवार को भेज दी गई है।"
          : "Your update has been sent to your family.";
      setActionNotice(message);
      setShowAlternativeStatus(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not record check-in.");
    }
  };

  // ONE-TAP MEDICINE CONFIRMATION DIRECTLY ON HOME SCREEN
  const handleConfirmMedicine = (medicationId: string, time: string, status: ParentConfirmation) => {
    setActionError(null);
    try {
      const scheduledAt = new Date(`${todayKey}T${time}:00`).toISOString();
      recordElderMedicineConfirmation({
        medicationId,
        familyId,
        scheduledAt,
        actorId: userId,
        status,
      });
      const text =
        status === "taken"
          ? language === "hi"
            ? "दवाई ले ली गई है — दर्ज हो गया।"
            : "Recorded: Medicine taken."
          : language === "hi"
          ? "दवाई छोड़ दी गई — दर्ज हो गया।"
          : "Recorded: Medicine skipped.";
      setActionNotice(text);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not record medicine.");
    }
  };

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DemoRoleSwitcher />

      <main className="px-4 pb-36 pt-6 text-charcoal">
        <div className="mx-auto max-w-xl space-y-6">
          {/* Header & Accessibility Bar */}
          <header className="flex items-center justify-between border-b border-sage/40 pb-4">
            <LanguageToggle language={language} setLanguage={setLanguage} />
            {canSpeak && (
              <button
                type="button"
                onClick={() => onReadAloud(`${greetingText}. ${todayCheckin ? "You have already checked in today." : "Please check in below."}`)}
                className="flex items-center gap-1.5 rounded-xl border-2 border-forest/30 bg-white px-3.5 py-2 text-sm font-bold text-forest hover:bg-forest/10 transition-colors"
                aria-label="Read screen aloud"
              >
                <Volume2 size={18} />
                <span>{language === "hi" ? "सुनें" : "Listen"}</span>
              </button>
            )}
          </header>

          {/* Welcome Heading */}
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-forest sm:text-4xl tracking-tight">
              {greetingText}
            </h1>
            <p className="text-lg text-charcoal/80">
              {language === "hi"
                ? "आज आप कैसा महसूस कर रहे हैं?"
                : "How are you feeling today?"}
            </p>
          </div>

          {/* Notifications / Feedback */}
          {actionNotice && (
            <div
              role="status"
              className="flex items-center justify-between rounded-2xl border-2 border-forest bg-forest/15 p-4 text-base font-bold text-forest shadow-xs animate-in fade-in"
            >
              <span>{actionNotice}</span>
              <button
                type="button"
                onClick={() => setActionNotice(null)}
                className="text-xs underline text-forest ml-2"
              >
                {language === "hi" ? "ठीक है" : "Dismiss"}
              </button>
            </div>
          )}

          {actionError && (
            <p role="alert" className="rounded-2xl border-2 border-coral bg-coral/10 p-4 text-base font-bold text-charcoal">
              {actionError}
            </p>
          )}

          {languageError && (
            <p role="alert" className="rounded-xl border border-coral bg-white p-3 text-sm text-coral">
              {languageError}
            </p>
          )}

          {speechNotice && (
            <p role="status" className="rounded-xl border border-sage bg-white p-3 text-sm text-charcoal">
              {speechNotice}
            </p>
          )}

          {/* SECTION 1: 1-TAP 5-SECOND WELLNESS CHECK-IN */}
          <section aria-label="Daily Check-in" className="space-y-4">
            {todayCheckin ? (
              // Already Checked-in Reassuring Banner
              <div className="rounded-2xl border-2 border-forest/40 bg-white p-6 shadow-xs text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest text-ivory">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-forest">
                    {language === "hi" ? "आज का चेक-इन हो गया है" : "You checked in today!"}
                  </h2>
                  <p className="text-sm text-charcoal/70 mt-1">
                    {language === "hi"
                      ? `${formatCheckinTime(todayCheckin.created_at)} पर दर्ज हुआ। आपका परिवार आश्वस्त है।`
                      : `Checked in at ${formatCheckinTime(todayCheckin.created_at)}. Your family knows you are okay.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAlternativeStatus(!showAlternativeStatus)}
                  className="text-sm font-semibold text-forest underline hover:opacity-80 pt-1"
                >
                  {showAlternativeStatus
                    ? language === "hi" ? "छिपाएँ" : "Hide"
                    : language === "hi" ? "स्थिति बदलें" : "Update how I'm feeling"}
                </button>
              </div>
            ) : null}

            {(!todayCheckin || showAlternativeStatus) && (
              <div className="space-y-3">
                {/* BIG 1-TAP "I AM DOING WELL" BUTTON (5-SECOND CHECKIN) */}
                <button
                  type="button"
                  onClick={() => handleOneTapCheckin("ok")}
                  className="flex min-h-24 w-full flex-col items-center justify-center rounded-2xl border-3 border-forest bg-forest px-6 py-5 text-center text-ivory shadow-md transition-transform active:scale-[0.98] hover:bg-forest/95"
                >
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {language === "hi" ? "✓ मैं बिल्कुल ठीक हूँ" : "✓ I am doing well today"}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-sage/90 mt-1">
                    {language === "hi"
                      ? "एक टैप में परिवार को सूचित करें"
                      : "Tap once to let your family know"}
                  </span>
                </button>

                {/* Secondary Feeling Options */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOneTapCheckin("need_assistance")}
                    className="flex min-h-16 flex-col items-center justify-center rounded-xl border-2 border-sage bg-white p-3 text-center hover:bg-sage/20 transition-colors"
                  >
                    <HeartHandshake size={22} className="text-forest mb-1" />
                    <span className="text-sm sm:text-base font-bold text-charcoal">
                      {language === "hi" ? "मदद चाहिए" : "Need assistance"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOneTapCheckin("contact_family")}
                    className="flex min-h-16 flex-col items-center justify-center rounded-xl border-2 border-sage bg-white p-3 text-center hover:bg-sage/20 transition-colors"
                  >
                    <PhoneCall size={22} className="text-forest mb-1" />
                    <span className="text-sm sm:text-base font-bold text-charcoal">
                      {language === "hi" ? "परिवार को बुलाएँ" : "Call family"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 2: TODAY'S MEDICINES (1-TAP CONFIRMATION) */}
          <section aria-labelledby="meds-heading" className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 id="meds-heading" className="text-xl font-bold text-forest flex items-center gap-2">
                <Pill size={22} className="text-forest" />
                <span>{language === "hi" ? "आज की दवाइयाँ" : "Today's Medicines"}</span>
              </h2>
              <Link
                to="/app/elder/medicines"
                className="text-xs font-semibold text-forest underline hover:opacity-80"
              >
                {language === "hi" ? "सब देखें" : "View all"}
              </Link>
            </div>

            {doses.length === 0 ? (
              <div className="rounded-xl border border-sage/60 bg-white p-4 text-center text-charcoal/70 text-sm">
                {language === "hi"
                  ? "आज के लिए कोई दवाई निर्धारित नहीं है।"
                  : "No medicines scheduled for today."}
              </div>
            ) : (
              <div className="space-y-3">
                {doses.map((dose) => {
                  const scheduledAtPrefix = `${todayKey}T${dose.time}`;
                  const event = medEvents.find(
                    (e) => e.medication_id === dose.medicationId && e.scheduled_at.startsWith(scheduledAtPrefix)
                  );
                  const isTaken = event?.parent_confirmation === "taken";
                  const isSkipped = event?.parent_confirmation === "skipped";

                  return (
                    <div
                      key={`${dose.medicationId}-${dose.time}`}
                      className={`rounded-2xl border p-4 shadow-xs transition-all ${
                        isTaken
                          ? "border-forest/40 bg-white opacity-95"
                          : "border-forest/50 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-sage/30 px-2 py-0.5 text-xs font-bold text-forest">
                              {dose.time}
                            </span>
                            <h3 className="text-lg font-bold text-charcoal">{dose.name}</h3>
                          </div>
                          <p className="text-xs text-charcoal/70 mt-1">{dose.dosage}</p>
                        </div>

                        {isTaken ? (
                          <span className="flex items-center gap-1 rounded-full bg-forest/15 px-3 py-1 text-xs font-bold text-forest">
                            <CheckCircle2 size={14} />
                            {language === "hi" ? "ले ली" : "Taken"}
                          </span>
                        ) : isSkipped ? (
                          <span className="rounded-full bg-coral/20 px-3 py-1 text-xs font-bold text-charcoal">
                            {language === "hi" ? "छोड़ दी" : "Skipped"}
                          </span>
                        ) : null}
                      </div>

                      {/* 1-Tap Medicine Actions */}
                      {!isTaken && (
                        <div className="flex items-center gap-2 pt-3 border-t border-sage/30 mt-3">
                          <button
                            type="button"
                            onClick={() => handleConfirmMedicine(dose.medicationId, dose.time, "taken")}
                            className="flex-1 rounded-xl bg-forest py-2.5 text-sm font-bold text-ivory hover:bg-forest/90 transition-colors shadow-xs"
                          >
                            {language === "hi" ? "ले ली (Taken)" : "I took it"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmMedicine(dose.medicationId, dose.time, "skipped")}
                            className="rounded-xl border border-sage bg-ivory px-4 py-2.5 text-xs font-semibold text-charcoal hover:bg-coral/10 transition-colors"
                          >
                            {language === "hi" ? "छोड़ दी" : "Skip"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* SECTION 3: PERSISTENT HIGH-CONTRAST EMERGENCY BUTTON */}
          <section aria-label="Emergency Help" className="pt-2">
            <Link
              to="/app/elder/emergency"
              className="flex min-h-16 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-coral bg-coral/15 px-6 py-4 text-center font-bold text-charcoal hover:bg-coral/25 active:scale-[0.99] transition-all shadow-xs"
            >
              <AlertTriangle size={22} className="text-coral shrink-0" />
              <span className="text-lg sm:text-xl">
                {language === "hi" ? "आपातकालीन सहायता (Get Help)" : "Emergency Help (Get Help)"}
              </span>
            </Link>
          </section>

          {/* PWA Install Notice */}
          <section aria-label="Install app" className="space-y-2 pt-2">
            <InstallPrompt />
            <p className="text-xs text-charcoal/60 text-center">{INSTALL_HELP_TEXT}</p>
          </section>
        </div>

        {/* 3-Section Accessible Navigation */}
        <ElderNav />
      </main>
    </div>
  );
}
