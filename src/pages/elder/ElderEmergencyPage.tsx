import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { requestEmergency } from "../../lib/demoStore";
import ElderNav from "../../components/elder/ElderNav";

type Step = "idle" | "confirm" | "sent";

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

const EMERGENCY_CLASS =
  "flex min-h-16 w-full items-center justify-center rounded-lg border-2 border-charcoal bg-coral px-6 py-4 text-center text-2xl font-bold text-charcoal hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

const BUTTON_CLASS =
  "flex min-h-16 w-full items-center justify-center rounded-lg border-2 border-charcoal bg-white px-6 py-4 text-center text-2xl font-semibold text-charcoal hover:bg-sage focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

export default function ElderEmergencyPage() {
  const { user, family, elder } = useAuth();
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);

  const onConfirm = () => {
    if (!user || !family || !elder) return;
    setError(null);
    try {
      requestEmergency({
        familyId: family.id,
        elderId: elder.id,
        requestedBy: user.id,
        message: null,
      });
      setStep("sent");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const onCancel = () => {
    setError(null);
    setStep("idle");
  };

  return (
    <main className="min-h-screen bg-ivory px-4 pb-40 pt-8 text-charcoal">
      <div className="mx-auto max-w-2xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Help</h1>
        </header>

        <p className="rounded-lg border-2 border-charcoal bg-white p-4 text-2xl leading-relaxed">
          Call your local emergency number directly if you need urgent help.
        </p>

        {!family || !user ? (
          <p className="rounded-lg border border-sage bg-white p-4 text-2xl leading-relaxed">
            Your family link is not set up yet. Ask your family to add you in the app.
          </p>
        ) : step === "sent" ? (
          <>
            <p role="status" className="rounded-lg border border-sage bg-white p-4 text-2xl font-semibold leading-relaxed">
              Your family has been notified in the app.
            </p>
            <Link to="/app/elder" className={BUTTON_CLASS}>
              Back to home
            </Link>
          </>
        ) : step === "confirm" ? (
          <div className="space-y-4">
            <p className="rounded-lg border-2 border-coral bg-white p-4 text-2xl leading-relaxed">
              This tells your family in the app. It does not call emergency services. If you are in danger, call
              your local emergency number now.
            </p>
            <button type="button" onClick={onConfirm} className={EMERGENCY_CLASS}>
              Yes, send emergency request
            </button>
            <button type="button" onClick={onCancel} className={BUTTON_CLASS}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setStep("confirm")} className={EMERGENCY_CLASS}>
            Send emergency request
          </button>
        )}

        {error && (
          <p role="alert" className="rounded-lg border-2 border-forest bg-white p-4 text-2xl leading-relaxed">
            {error}
          </p>
        )}
      </div>
      <ElderNav />
    </main>
  );
}
