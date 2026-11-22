import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { useLanguage } from "../../features/i18n/useLanguage";
import { submitWellnessCheckin } from "../../lib/demoStore";
import type { WellnessStatus } from "../../lib/types";
import ElderNav from "../../components/elder/ElderNav";

const ANSWER_TEXT: Record<WellnessStatus, string> = {
  ok: "You said: I am okay.",
  need_assistance: "You said: I need help.",
  contact_family: "You said: Please contact my family.",
};

const VOICE_ERROR = "Voice input did not work. Please use the buttons.";

function parseStatus(raw: string | null): WellnessStatus | null {
  if (raw === "ok" || raw === "need_assistance" || raw === "contact_family") return raw;
  return null;
}

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

// Browser speech recognition (standard or webkit-prefixed). Typed locally because the DOM lib does not include it.
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<RecognitionAlternative>>;
}
interface RecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
}
type RecognitionConstructor = new () => RecognitionInstance;

function getRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Only these words are mapped. Each group must match exactly one status, with no negation.
const KEYWORD_GROUPS: { status: WellnessStatus; words: string[] }[] = [
  { status: "ok", words: ["okay", "ठीक"] },
  { status: "need_assistance", words: ["help", "मदद"] },
  { status: "contact_family", words: ["family", "परिवार"] },
];

const NEGATIONS = ["not", "no", "dont", "don't", "नहीं", "न"];

/** Returns a status only when the words clearly point to one answer. Otherwise null. */
function matchTranscript(transcript: string): WellnessStatus | null {
  const tokens = transcript
    .toLowerCase()
    .replace(/[.,!?;:"()।]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (tokens.some((w) => NEGATIONS.includes(w))) return null;
  const hits = KEYWORD_GROUPS.filter((group) => tokens.some((w) => group.words.includes(w)));
  return hits.length === 1 ? hits[0].status : null;
}

const PRIMARY_CLASS =
  "flex min-h-16 w-full items-center justify-center rounded-lg bg-forest px-6 py-4 text-center text-2xl font-semibold text-ivory hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

const LINK_CLASS =
  "inline-flex min-h-16 items-center justify-center rounded-lg border-2 border-charcoal bg-white px-6 py-4 text-center text-2xl font-semibold text-charcoal hover:bg-sage focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

export default function ElderCheckinPage() {
  const { user, family, elder } = useAuth();
  const { language, t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const status = parseStatus(params.get("status"));
  const [error, setError] = useState<string | null>(null);
  const [sentStatus, setSentStatus] = useState<WellnessStatus | null>(null);
  const [listening, setListening] = useState<boolean>(false);
  const [heard, setHeard] = useState<{ text: string; matched: boolean } | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);

  // "Sent" applies only to the answer that was actually submitted.
  const sent = status !== null && sentStatus === status;

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const onSend = () => {
    if (!status || !user || !family || !elder) return;
    setError(null);
    try {
      submitWellnessCheckin({
        familyId: family.id,
        elderId: elder.id,
        submittedBy: user.id,
        status,
        notes: null,
      });
      setSentStatus(status);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Voice only fills in the answer on screen. The elder still presses Send.
  const onSpeak = () => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) return;
    setVoiceError(null);
    setHeard(null);
    try {
      const recognition = new Recognition();
      recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        setListening(false);
        const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
        if (!transcript) {
          setVoiceError(VOICE_ERROR);
          return;
        }
        const matched = matchTranscript(transcript);
        setHeard({ text: transcript, matched: matched !== null });
        if (matched) {
          setError(null);
          setParams({ status: matched });
        }
      };
      recognition.onerror = () => {
        setListening(false);
        setVoiceError(VOICE_ERROR);
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      setVoiceError(VOICE_ERROR);
    }
  };

  const voiceSupported = getRecognitionConstructor() !== null;

  const voicePanel: ReactNode = voiceSupported ? (
    <div className="space-y-4">
      {!sent && (
        <button type="button" onClick={onSpeak} disabled={listening} className={LINK_CLASS}>
          {listening ? "Listening..." : "Speak"}
        </button>
      )}

      {heard && heard.matched && (
        <p role="status" className="rounded-lg border border-sage bg-white p-4 text-2xl leading-relaxed">
          I heard &ldquo;{heard.text}&rdquo;. Check that it is right, then press {t("sendToFamily")}.
        </p>
      )}

      {heard && !heard.matched && (
        <p role="status" className="rounded-lg border border-sage bg-white p-4 text-2xl leading-relaxed">
          I heard &ldquo;{heard.text}&rdquo;, but I could not tell which answer that is. Please use the buttons.
        </p>
      )}

      {voiceError && (
        <p role="alert" className="rounded-lg border-2 border-forest bg-white p-4 text-2xl leading-relaxed">
          {voiceError}
        </p>
      )}
    </div>
  ) : null;

  const shell = (children: ReactNode) => (
    <main className="min-h-screen bg-ivory px-4 pb-40 pt-8 text-charcoal">
      <div className="mx-auto max-w-2xl space-y-8">{children}</div>
      <ElderNav />
    </main>
  );

  if (!status) {
    return shell(
      <>
        <h1 className="text-3xl font-bold text-forest sm:text-4xl">{t("checkin")}</h1>
        <p className="text-2xl leading-relaxed">{t("chooseFeeling")}</p>
        {voicePanel}
        <Link to="/app/elder" className={LINK_CLASS}>
          Back to home
        </Link>
      </>,
    );
  }

  if (!family || !user) {
    return shell(
      <>
        <h1 className="text-3xl font-bold text-forest sm:text-4xl">{t("checkin")}</h1>
        <p className="rounded-lg border border-sage bg-white p-4 text-2xl leading-relaxed">
          Your family link is not set up yet. Ask your family to add you in the app.
        </p>
        <Link to="/app/elder" className={LINK_CLASS}>
          Back to home
        </Link>
      </>,
    );
  }

  return shell(
    <>
      <h1 className="text-3xl font-bold text-forest sm:text-4xl">{t("checkin")}</h1>
      <p className="text-2xl leading-relaxed">{ANSWER_TEXT[status]}</p>

      {voicePanel}

      {!sent && (
        <button type="button" onClick={onSend} className={PRIMARY_CLASS}>
          {t("sendToFamily")}
        </button>
      )}

      {error && (
        <p role="alert" className="rounded-lg border-2 border-forest bg-white p-4 text-2xl leading-relaxed">
          {error}
        </p>
      )}

      {sent && (
        <p role="status" className="rounded-lg border border-sage bg-white p-4 text-2xl font-semibold leading-relaxed">
          {t("sentToFamily")}
        </p>
      )}

      <Link to="/app/elder" className={LINK_CLASS}>
        Back to home
      </Link>
    </>,
  );
}
