import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import SiteHeader from "../components/SiteHeader";
import BrandLogo from "../components/BrandLogo";
import { ensureSharmaDemoSeeded, switchDemoPersona } from "../lib/demoStore";
import { useAuth } from "../features/auth/AuthContext";

type PreviewRole = "elder" | "child" | "caregiver";

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [activePreview, setActivePreview] = useState<PreviewRole>("child");

  const handleLaunchDemo = async (persona: "ananya" | "rajesh" | "ramesh") => {
    try {
      ensureSharmaDemoSeeded();
      switchDemoPersona(persona);
      await refresh();
      if (persona === "rajesh") navigate("/app/elder");
      else if (persona === "ramesh") navigate("/app/caregiver");
      else navigate("/app/family");
    } catch {
      navigate("/login");
    }
  };

  const heroMotion = reduceMotion
    ? { initial: false as const, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <div className="min-h-screen bg-ivory text-charcoal flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-sage/60 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              className="mx-auto max-w-3xl text-center"
              initial={heroMotion.initial}
              animate={heroMotion.animate}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-forest/30 bg-white/80 px-4 py-1.5 text-xs font-semibold text-forest shadow-xs mb-6">
                <span className="h-2 w-2 rounded-full bg-forest animate-pulse" />
                <span>The Shared Family-Care Accountability Ecosystem</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl font-bold leading-[1.15] text-forest tracking-tight">
                Care is love, <br className="hidden sm:inline" />
                <span className="italic text-charcoal">made visible.</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl leading-relaxed text-charcoal/90 max-w-2xl mx-auto">
                Even when family lives miles apart, care stays close. Nanu&apos;s brings elderly parents,
                children living in different cities, and appointed external caregivers together into one trusted space.
              </p>

              {/* Primary Call to Action */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/signup"
                  className="w-full sm:w-auto rounded-lg bg-forest px-8 py-3.5 text-base font-semibold text-ivory hover:bg-forest/90 transition-all shadow-md text-center"
                >
                  Start Your Family Space
                </Link>
                <button
                  type="button"
                  onClick={() => handleLaunchDemo("ananya")}
                  className="w-full sm:w-auto rounded-lg border-2 border-forest bg-white px-7 py-3 text-base font-semibold text-forest hover:bg-sage/20 transition-all shadow-xs text-center flex items-center justify-center gap-2"
                >
                  <span>Explore Live Sharma Demo</span>
                  <span className="text-xs bg-forest/10 px-2 py-0.5 rounded text-forest font-bold">1-Click</span>
                </button>
              </div>

              <p className="mt-4 text-xs text-charcoal/60">
                Distance shouldn&apos;t mean uncertainty. No credit card required.
              </p>
            </motion.div>

            {/* INTERACTIVE PRODUCT PREVIEW SHOWCASE */}
            <motion.div
              className="mt-14 mx-auto max-w-4xl rounded-2xl border-2 border-sage bg-white shadow-xl overflow-hidden"
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {/* Preview Window Header & Role Switch Tabs */}
              <div className="border-b border-sage/60 bg-ivory/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-coral/80" />
                  <span className="h-3 w-3 rounded-full bg-sage" />
                  <span className="h-3 w-3 rounded-full bg-forest/50" />
                  <span className="ml-2 font-serif text-xs font-bold text-forest hidden sm:inline">
                    NANU&apos;S AI LIVE EXPERIENCE PREVIEW
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-sage/60 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActivePreview("elder")}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      activePreview === "elder"
                        ? "bg-forest text-ivory font-semibold shadow-xs"
                        : "text-charcoal hover:bg-ivory"
                    }`}
                  >
                    Elder View
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreview("child")}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      activePreview === "child"
                        ? "bg-forest text-ivory font-semibold shadow-xs"
                        : "text-charcoal hover:bg-ivory"
                    }`}
                  >
                    Family View
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreview("caregiver")}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      activePreview === "caregiver"
                        ? "bg-forest text-ivory font-semibold shadow-xs"
                        : "text-charcoal hover:bg-ivory"
                    }`}
                  >
                    Caregiver Workspace
                  </button>
                </div>
              </div>

              {/* Preview Content Body */}
              <div className="p-6 sm:p-8 bg-ivory/20">
                {activePreview === "elder" && (
                  <div className="space-y-6 max-w-xl mx-auto">
                    <div className="flex items-center justify-between border-b border-sage pb-3">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-charcoal/60 font-semibold">
                          Simplified Senior Experience
                        </span>
                        <h3 className="font-serif text-2xl font-bold text-forest">
                          Namaste, Rajesh-ji
                        </h3>
                      </div>
                      <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                        Hindi / English Voice Ready
                      </span>
                    </div>

                    <div className="rounded-xl border-2 border-forest/30 bg-white p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-forest">Today&apos;s Medicine</span>
                        <span className="text-xs text-forest font-semibold bg-forest/10 px-2 py-0.5 rounded">
                          08:30 AM
                        </span>
                      </div>
                      <p className="text-xl font-bold text-charcoal">
                        Telmisartan 40mg (BP Management)
                      </p>
                      <p className="text-sm text-charcoal/70">1 tablet with warm water after breakfast</p>
                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          className="flex-1 rounded-lg bg-forest py-3 text-sm font-bold text-ivory hover:bg-forest/90"
                        >
                          ✓ Medicine Taken
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-sage px-4 py-3 text-sm font-semibold text-charcoal"
                        >
                          Skip
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-sage bg-white p-4 text-center">
                        <span className="text-xs uppercase text-charcoal/60 font-semibold block">Daily Check-in</span>
                        <span className="text-lg font-bold text-forest mt-1 block">I am okay (ठीक हूँ)</span>
                      </div>
                      <div className="rounded-xl border border-coral bg-coral/10 p-4 text-center">
                        <span className="text-xs uppercase text-coral font-bold block">Direct Help</span>
                        <span className="text-lg font-bold text-charcoal mt-1 block">Emergency SOS</span>
                      </div>
                    </div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => handleLaunchDemo("rajesh")}
                        className="text-xs font-semibold text-forest hover:underline"
                      >
                        Launch Interactive Elder Home View →
                      </button>
                    </div>
                  </div>
                )}

                {activePreview === "child" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-sage pb-3 gap-2">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-charcoal/60 font-semibold">
                          Remote Daughter Dashboard (Ananya in Bengaluru)
                        </span>
                        <h3 className="font-serif text-2xl font-bold text-forest">
                          The 10-Second Family View
                        </h3>
                      </div>
                      <span className="text-xs text-charcoal/60">Updated: Today at 09:15 AM</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-sage bg-white p-4">
                        <span className="text-xs font-semibold text-charcoal/70 uppercase block">What happened today?</span>
                        <p className="mt-1 text-sm font-semibold text-forest">
                          Rajesh confirmed morning BP tablet. Checked in okay via voice.
                        </p>
                      </div>

                      <div className="rounded-xl border border-sage bg-white p-4">
                        <span className="text-xs font-semibold text-charcoal/70 uppercase block">Caregiver on Shift</span>
                        <p className="mt-1 text-sm font-semibold text-charcoal">
                          Ramesh Kumar checked in at 09:05 AM (Scheduled 09:00 - 17:00).
                        </p>
                      </div>

                      <div className="rounded-xl border border-coral/60 bg-coral/10 p-4">
                        <span className="text-xs font-semibold text-coral uppercase block">Attention Needed</span>
                        <p className="mt-1 text-sm font-semibold text-charcoal">
                          Refill Atorvastatin 10mg (2 days overdue).
                        </p>
                      </div>
                    </div>

                    {/* Dual Confirmation Status Card */}
                    <div className="rounded-xl border border-sage bg-white p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-base font-bold text-forest">
                          Medication Dual-Confirmation Status
                        </h4>
                        <span className="text-xs bg-forest/10 text-forest px-2.5 py-0.5 rounded font-semibold">
                          Verified Independence
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-ivory/60 rounded-lg border border-sage/60">
                          <span className="font-bold text-forest block">Parent Ingestion Confirmation:</span>
                          <span className="text-charcoal mt-1 block">
                            ✓ Confirmed &quot;Taken&quot; by Rajesh Sharma at 08:36 AM
                          </span>
                        </div>
                        <div className="p-3 bg-ivory/60 rounded-lg border border-sage/60">
                          <span className="font-bold text-forest block">Caregiver Assistance Log:</span>
                          <span className="text-charcoal mt-1 block">
                            ✓ Assisted & recorded by Ramesh Kumar at 08:40 AM
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => handleLaunchDemo("ananya")}
                        className="text-xs font-semibold text-forest hover:underline"
                      >
                        Launch Interactive Family Dashboard →
                      </button>
                    </div>
                  </div>
                )}

                {activePreview === "caregiver" && (
                  <div className="space-y-6 max-w-xl mx-auto">
                    <div className="flex items-center justify-between border-b border-sage pb-3">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-charcoal/60 font-semibold">
                          Caregiver Shift Workspace (Ramesh Kumar)
                        </span>
                        <h3 className="font-serif text-2xl font-bold text-forest">
                          Today&apos;s Active Shift
                        </h3>
                      </div>
                      <span className="rounded-full bg-forest text-ivory text-xs px-2.5 py-1 font-semibold">
                        Checked In
                      </span>
                    </div>

                    <div className="rounded-xl border border-sage bg-white p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-charcoal/70">
                        <span>Assigned Elder: <strong>Rajesh Sharma (Age 75)</strong></span>
                        <span>09:00 - 17:00</span>
                      </div>

                      <div className="space-y-2 pt-2 text-xs">
                        <div className="flex items-center gap-2 text-forest font-semibold">
                          <span>✓</span>
                          <span>Checked in at residence (09:05 AM)</span>
                        </div>
                        <div className="flex items-center gap-2 text-forest font-semibold">
                          <span>✓</span>
                          <span>Assisted with morning blood pressure check (128/82 mmHg)</span>
                        </div>
                        <div className="flex items-center gap-2 text-charcoal">
                          <span className="h-2 w-2 rounded-full bg-sage inline-block" />
                          <span>Courtyard mobility walk scheduled for 04:30 PM</span>
                        </div>
                        <div className="flex items-center gap-2 text-charcoal">
                          <span className="h-2 w-2 rounded-full bg-sage inline-block" />
                          <span>End-of-shift care handover submission</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => handleLaunchDemo("ramesh")}
                        className="text-xs font-semibold text-forest hover:underline"
                      >
                        Launch Interactive Caregiver Workspace →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* EMOTIONAL STORY HIGHLIGHT SECTION */}
        <section className="border-b border-sage/60 py-16 sm:py-20 bg-ivory/60">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-3xl border border-sage/70 bg-white shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 items-center">
                {/* Image Side */}
                <div className="relative aspect-[4/3] md:aspect-auto md:h-full min-h-[300px] overflow-hidden bg-forest/10">
                  <img
                    src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1000&q=80"
                    alt="Wrinkled elder hands holding a warm cup of morning tea"
                    className="h-full w-full object-cover filter brightness-[0.98]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent flex items-end p-6">
                    <p className="text-xs font-semibold text-ivory/90">
                      &ldquo;Haan beta, sab theek hai.&rdquo; — The tender lie every distant parent tells.
                    </p>
                  </div>
                </div>

                {/* Narrative Side */}
                <div className="p-8 sm:p-12 space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                    <span>Our Origin & Purpose</span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest leading-snug">
                    A daughter in Bengaluru. A father in Jaipur. 500 miles connected by love.
                  </h2>

                  <p className="text-sm sm:text-base leading-relaxed text-charcoal/80">
                    When children move to different cities for careers, care becomes anxious guesswork.
                    Parents hide joint pain and missed doses so we don&apos;t worry at work.
                    Nanu&apos;s AI was born from this love—not to surveil our parents with cameras,
                    but to give families shared visibility, autonomy, and quiet peace of mind.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold">
                    <Link
                      to="/about"
                      className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-ivory hover:bg-forest/90 transition-all shadow-xs"
                    >
                      <span>Read Our Story</span>
                      <span>→</span>
                    </Link>
                    <Link
                      to="/signup"
                      className="text-forest hover:underline"
                    >
                      Start Free Family Workspace
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: HOW NANU'S WORKS */}
        <section className="border-b border-sage/60 py-16 sm:py-20 bg-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-forest">
                Simple, Cohesive Architecture
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-forest">
                How Nanu&apos;s works
              </h2>
              <p className="mt-4 text-base text-charcoal/80 leading-relaxed">
                A single family workspace that respects autonomy while ensuring no care responsibility falls through the cracks.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="rounded-xl border border-sage bg-ivory/40 p-6 space-y-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest text-ivory font-serif text-lg font-bold">
                  1
                </span>
                <h3 className="font-serif text-xl font-bold text-forest">One Family Space</h3>
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  The family owner creates a workspace, attaches the elderly parent, and invites children across different cities with designated roles.
                </p>
              </div>

              <div className="rounded-xl border border-sage bg-ivory/40 p-6 space-y-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest text-ivory font-serif text-lg font-bold">
                  2
                </span>
                <h3 className="font-serif text-xl font-bold text-forest">Verified Caregiver Access</h3>
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  Appointed caregivers onboard with verifiable credentials, shift check-ins, and activity logs. Restricted strictly to assigned families.
                </p>
              </div>

              <div className="rounded-xl border border-sage bg-ivory/40 p-6 space-y-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest text-ivory font-serif text-lg font-bold">
                  3
                </span>
                <h3 className="font-serif text-xl font-bold text-forest">Continuous Accountability</h3>
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  Event-driven escalations detect missed medication confirmations, unattended appointments, or incomplete handovers automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: THREE USER EXPERIENCES */}
        <section className="border-b border-sage/60 py-16 sm:py-20 bg-ivory">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-forest">
                Human-Centred Accessibility
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-forest">
                Three Distinct Experiences
              </h2>
              <p className="mt-4 text-base text-charcoal/80 leading-relaxed">
                Designed specifically for each stakeholder&apos;s cognitive context and daily routine.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Role A */}
              <div className="rounded-xl border border-sage bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-bold text-forest">
                    Role A
                  </span>
                  <span className="text-xs text-charcoal/50">Elderly Parent</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-forest">Gentle & Accessible</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-charcoal/80">
                  <li className="flex items-start gap-2">
                    <span className="text-forest">✓</span>
                    <span>High-contrast text & large touch targets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest">✓</span>
                    <span>English & Hindi voice-based updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest">✓</span>
                    <span>Medication taken / skipped confirmation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest">✓</span>
                    <span>Single-tap family help and emergency action</span>
                  </li>
                </ul>
              </div>

              {/* Role B */}
              <div className="rounded-xl border-2 border-forest/40 bg-white p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-forest text-ivory px-3 py-1 text-xs font-bold">
                    Role B
                  </span>
                  <span className="text-xs text-charcoal/50">Remote Child</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-forest">Complete Family Dashboard</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-charcoal/80">
                  <li className="flex items-start gap-2">
                    <span className="text-forest">✓</span>
                    <span>The signature 10-Second Family Overview</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest">✓</span>
                    <span>Real-time medication confirmation status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest">✓</span>
                    <span>Care Pulse coordination charts & metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest">✓</span>
                    <span>Private family journal and memory archive</span>
                  </li>
                </ul>
              </div>

              {/* Role C */}
              <div className="rounded-xl border border-sage bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-bold text-forest">
                    Role C
                  </span>
                  <span className="text-xs text-charcoal/50">External Caregiver</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-forest">Professional Workspace</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-charcoal/80">
                  <li className="flex items-start gap-2">
                    <span className="text-forest">✓</span>
                    <span>Shift schedule & timestamped check-in/out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest">✓</span>
                    <span>Medication assistance recording</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest">✓</span>
                    <span>Out-of-pocket care expense logging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest">✓</span>
                    <span>Structured shift handover submission</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: MEDICATION COORDINATION */}
        <section className="border-b border-sage/60 py-16 sm:py-20 bg-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-forest">
                Safety Without Guesswork
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest leading-tight">
                Independent Dual-Confirmation Medication Architecture
              </h2>
              <p className="text-sm sm:text-base text-charcoal/80 leading-relaxed">
                Most reminder apps assume a notification means a medicine was swallowed.
                Nanu&apos;s enforces true accountability:
              </p>
              <ul className="space-y-3 text-sm text-charcoal/90">
                <li className="flex items-start gap-3">
                  <span className="text-forest font-bold">1.</span>
                  <span><strong>Never automatically marks taken:</strong> Statuses require human confirmation.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-forest font-bold">2.</span>
                  <span><strong>Dual independent records:</strong> Parent ingestion confirmation and caregiver assistance are stored separately.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-forest font-bold">3.</span>
                  <span><strong>Automatic escalation:</strong> A missed dose alerts the caregiver first, then the designated family contact.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-sage bg-ivory p-6 shadow-sm space-y-4">
              <div className="border-b border-sage/60 pb-3">
                <span className="text-xs font-bold uppercase text-charcoal/60">Live Database Pattern</span>
                <p className="font-serif text-lg font-bold text-forest">Dual Confirmation Workflow</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-forest/30">
                  <p className="font-bold text-forest">Parent Channel (Rajesh Sharma):</p>
                  <p className="text-charcoal mt-0.5">Records personal confirmation: Taken, Skipped, or Unable to Confirm.</p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-sage">
                  <p className="font-bold text-charcoal">Caregiver Channel (Ramesh Kumar):</p>
                  <p className="text-charcoal mt-0.5">Independently records assistance provided with water & meal.</p>
                </div>

                <div className="p-3 bg-forest text-ivory rounded-lg">
                  <p className="font-bold text-sage">Family View (Ananya & Arjun):</p>
                  <p className="text-ivory/90 mt-0.5">Sees both streams side-by-side with tamper-evident audit timestamps.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: CAREGIVER TRUST & ACCOUNTABILITY */}
        <section className="border-b border-sage/60 py-16 sm:py-20 bg-ivory">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-forest">
                Trust Through Transparency
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-forest">
                Caregiver Trust and Accountability
              </h2>
              <p className="mt-4 text-base text-charcoal/80 leading-relaxed">
                No arbitrary star ratings or unfair surveillance. Clear verifiable statuses and scheduled accountability.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="rounded-xl border border-sage bg-white p-5 space-y-2">
                <span className="text-forest font-bold text-sm block">Identity Verification</span>
                <p className="text-charcoal/80">Government ID review status: Not submitted, Submitted, Pending review, or Verified.</p>
              </div>

              <div className="rounded-xl border border-sage bg-white p-5 space-y-2">
                <span className="text-forest font-bold text-sm block">Reference Checks</span>
                <p className="text-charcoal/80">Prior geriatric employer references authenticated before family assignment.</p>
              </div>

              <div className="rounded-xl border border-sage bg-white p-5 space-y-2">
                <span className="text-forest font-bold text-sm block">Shift Check-in / Out</span>
                <p className="text-charcoal/80">Scheduled shift attendance with consent-based geolocation and audit timestamps.</p>
              </div>

              <div className="rounded-xl border border-sage bg-white p-5 space-y-2">
                <span className="text-forest font-bold text-sm block">Audit Activity Logs</span>
                <p className="text-charcoal/80">Every recorded task, photo note, and expense item is logged with dispute handling.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: FAMILY HANDOVERS */}
        <section className="border-b border-sage/60 py-16 sm:py-20 bg-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-forest">
              The Signature Nanu&apos;s Feature
            </span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-forest">
              Structured Care Handovers
            </h2>
            <p className="mt-4 text-base text-charcoal/80 max-w-2xl mx-auto leading-relaxed">
              When care responsibility transfers between caregiver shifts or sibling visits, a structured handover
              carries completed activities, medicine statuses, and pending tasks forward.
            </p>

            <div className="mt-10 rounded-2xl border border-sage bg-ivory/50 p-6 sm:p-8 max-w-3xl mx-auto text-left shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-sage pb-3">
                <div>
                  <span className="text-xs font-bold uppercase text-charcoal/60">Sample Shift Handover</span>
                  <p className="font-serif text-lg font-bold text-forest">Ramesh Kumar → Ananya Sharma</p>
                </div>
                <span className="rounded bg-forest/10 px-2.5 py-1 text-xs font-semibold text-forest">
                  Acknowledged
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-forest">Activities Completed:</p>
                  <p className="text-charcoal mt-1">• Morning courtyard walk (20 mins)</p>
                  <p className="text-charcoal">• Blood pressure check: 128/82 mmHg</p>
                </div>
                <div>
                  <p className="font-bold text-forest">Pending Responsibilities:</p>
                  <p className="text-coral font-medium mt-1">• Refill Atorvastatin 10mg (Overdue)</p>
                  <p className="text-charcoal">• Cardiology follow-up in 3 days</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: SECURITY AND TRUST */}
        <section className="border-b border-sage/60 py-16 sm:py-20 bg-ivory">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-forest">
              Enterprise Data Protection
            </span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-forest">
              Security, Consent & Privacy
            </h2>
            <p className="mt-4 text-base text-charcoal/80 max-w-2xl mx-auto leading-relaxed">
              PostgreSQL Row Level Security on every table. Private encrypted storage buckets. Zero cross-family leakage.
            </p>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="rounded-xl border border-sage bg-white p-5 space-y-2">
                <span className="text-forest font-serif font-bold text-base">Row Level Security</span>
                <p className="text-xs text-charcoal/80 leading-relaxed">
                  PostgreSQL RLS ensures caregivers only access explicitly assigned parents, and family members see only their family space.
                </p>
              </div>

              <div className="rounded-xl border border-sage bg-white p-5 space-y-2">
                <span className="text-forest font-serif font-bold text-base">Private Document Vault</span>
                <p className="text-xs text-charcoal/80 leading-relaxed">
                  Medical reports and prescriptions are isolated in private storage with signed URL access only.
                </p>
              </div>

              <div className="rounded-xl border border-sage bg-white p-5 space-y-2">
                <span className="text-forest font-serif font-bold text-base">Immutable Audit History</span>
                <p className="text-xs text-charcoal/80 leading-relaxed">
                  All critical mutations, confirmations, and escalations are logged for absolute transparency.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: FINAL CTA */}
        <section className="py-20 bg-forest text-ivory">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
            <BrandLogo size="lg" className="justify-center" />
            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-ivory">
              Distance shouldn&apos;t mean uncertainty.
            </h2>
            <p className="text-base sm:text-lg text-sage max-w-2xl mx-auto leading-relaxed">
              Join families across cities who have replaced anxiety with visibility, trust, and shared accountability.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signup"
                className="w-full sm:w-auto rounded-lg bg-coral px-8 py-3.5 text-base font-semibold text-charcoal hover:bg-coral/90 transition-all shadow-md"
              >
                Create Your Family Space
              </Link>
              <button
                type="button"
                onClick={() => handleLaunchDemo("ananya")}
                className="w-full sm:w-auto rounded-lg border border-sage px-7 py-3.5 text-base font-semibold text-ivory hover:bg-white/10 transition-all"
              >
                Explore Live Sharma Family Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-sage/60 bg-ivory py-8 text-xs text-charcoal/70">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showText={false} />
            <span>NANU&apos;S AI — &quot;Care is love, made visible.&quot;</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:underline">About</Link>
            <Link to="/features" className="hover:underline">Features</Link>
            <Link to="/login" className="hover:underline">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
