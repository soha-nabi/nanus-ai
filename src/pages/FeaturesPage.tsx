import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SiteHeader from "../components/SiteHeader";
import BrandLogo from "../components/BrandLogo";
import {
  HeartHandshake,
  Pill,
  Users,
  CheckSquare,
  Calendar,
  FolderHeart,
  Activity,
  BellRing,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Receipt,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { ensureSharmaDemoSeeded, switchDemoPersona } from "../lib/demoStore";
import { useAuth } from "../features/auth/AuthContext";

type FilterCategory = "all" | "parent" | "child" | "caregiver";

interface FeatureItem {
  id: string;
  category: "parent" | "child" | "caregiver";
  moduleNumber: string;
  title: string;
  subtitle: string;
  humanImpact: string;
  replaces: string;
  icon: typeof Pill;
  photoUrl: string;
  photoAlt: string;
  details: string[];
  demoRole: "ananya" | "rajesh" | "ramesh";
  demoPath: string;
  tag: string;
}

const ALL_FEATURES: FeatureItem[] = [
  {
    id: "medication-dual",
    category: "child",
    moduleNumber: "Module 01",
    title: "Independent Dual-Confirmation Medication Tracking",
    subtitle: "Clinical certainty without treating parents like children",
    humanImpact: "Eliminates the fear that Papa forgot his insulin, or that an attendant falsely claimed medicine was swallowed.",
    replaces: "Daily WhatsApp arguments: 'Did you take your pill? I am not a child!'",
    icon: Pill,
    photoUrl: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80",
    photoAlt: "Organized medication and care setup",
    details: [
      "Parent self-confirms ingestion independently with 1 tap or voice",
      "Caregiver records physical assistance separately without overwriting parent status",
      "Missing confirmations trigger automated escalation before missed doses cause hospitalization",
      "Prohibits automatic marking: true human accountability only",
    ],
    demoRole: "ananya",
    demoPath: "/app/family/health",
    tag: "Core Safeguard",
  },
  {
    id: "elder-checkin",
    category: "parent",
    moduleNumber: "Module 02",
    title: "5-Second 1-Tap Parent Wellness Experience",
    subtitle: "Designed for elderly fingers, high contrast, and zero tech frustration",
    humanImpact: "Gives elderly parents the joy of independence. They confirm they are doing well with one giant button in under 5 seconds.",
    replaces: "Complicated login forms, tiny fonts, and confusing app menus",
    icon: HeartHandshake,
    photoUrl: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=800&q=80",
    photoAlt: "Smiling elderly Indian grandfather with warm eyes",
    details: [
      "Giant 1-tap check-in: '✓ मैं बिल्कुल ठीक हूँ / I am doing well today'",
      "Bilingual support in English & Hindi with built-in voice read-aloud",
      "High contrast (WCAG AAA) with minimum 56px touch targets",
      "Persistent emergency SOS button connecting immediately to all family members",
    ],
    demoRole: "rajesh",
    demoPath: "/app/elder",
    tag: "Elder Autonomy",
  },
  {
    id: "ten-second-view",
    category: "child",
    moduleNumber: "Module 03",
    title: "The 10-Second Family Overview",
    subtitle: "Four vital questions answered on your morning commute",
    humanImpact: "Gives daughters and sons working in distant cities complete peace of mind before their morning meeting starts.",
    replaces: "Frantic phone calls across siblings asking 'Has anyone checked on Ma today?'",
    icon: Activity,
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    photoAlt: "Working daughter looking relieved while checking mobile update",
    details: [
      "Answers: How is my parent? Have medicines been taken? Has caregiver checked in? Does anything need attention?",
      "Next upcoming doctor appointment with assigned escort details",
      "Care Pulse 7-day adherence trends and vital signs overview",
      "Progressive disclosure: see critical alerts first, drill into audit logs when needed",
    ],
    demoRole: "ananya",
    demoPath: "/app/family",
    tag: "Peace of Mind",
  },
  {
    id: "caregiver-checklist",
    category: "caregiver",
    moduleNumber: "Module 04",
    title: "Caregiver Accountability & 6-Step Daily Flow",
    subtitle: "Dignity and respect for care attendants through transparent records",
    humanImpact: "Protects caregivers from unfair blame and provides crystal-clear daily instructions from the family.",
    replaces: "Verbal instructions forgotten over phone calls and suspicion after incidents",
    icon: Users,
    photoUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    photoAlt: "Caregiver attentively assisting senior parent",
    details: [
      "Guided 6-step flow: Check-in → Duties → Task checklist → Med assistance → Update → Check-out",
      "Geofenced timestamped shift attendance logging",
      "One-tap daily report tags ('BP normal', 'Healthy lunch', 'Afternoon walk')",
      "Immutable activity audit log protecting both caregiver and family",
    ],
    demoRole: "ramesh",
    demoPath: "/app/caregiver",
    tag: "Mutual Respect",
  },
  {
    id: "document-vault",
    category: "child",
    moduleNumber: "Module 05",
    title: "Private Medical Document Vault & OCR Intelligence",
    subtitle: "Every prescription, discharge summary, and lab report at your fingertips",
    humanImpact: "When an ER doctor asks for previous cardiology records at 2:00 AM, you have them in 3 seconds.",
    replaces: "Rummaging through physical paper files and lost prescription slips",
    icon: FolderHeart,
    photoUrl: "https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80",
    photoAlt: "Serene Indian home with organized study corner",
    details: [
      "Encrypted cloud document vault with signed URL access only",
      "Prescription intelligence: extract medicine schedules and doctor instructions",
      "Categorized by prescription, lab diagnostic, cardiology, and discharge notes",
      "Role-based privacy: caregivers access only explicitly approved care instructions",
    ],
    demoRole: "ananya",
    demoPath: "/app/family/health",
    tag: "Emergency Preparedness",
  },
  {
    id: "care-handovers",
    category: "caregiver",
    moduleNumber: "Module 06",
    title: "Structured Shift Handovers & Care Continuity",
    subtitle: "Seamless transfer when caregivers change or siblings take turns",
    humanImpact: "No critical instruction is lost when one nurse leaves and another takes over for the night.",
    replaces: "Scribbled notebook notes and verbal handover confusion",
    icon: RotateCcw,
    photoUrl: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=800&q=80",
    photoAlt: "Generations holding hands in support",
    details: [
      "Carries pending tasks, vitals observations, and medicine statuses forward",
      "Requires explicit acknowledgment from the incoming caregiver or family member",
      "Includes vital notes, dietary intake, mood observations, and safety checks",
      "Generates clear, structured PDF summaries for family review",
    ],
    demoRole: "ramesh",
    demoPath: "/app/caregiver/activity",
    tag: "Zero Gaps",
  },
  {
    id: "appointments-escorts",
    category: "child",
    moduleNumber: "Module 07",
    title: "Doctor Appointments & Assigned Escort Coordination",
    subtitle: "Never let an aging parent navigate a hospital clinic alone",
    humanImpact: "Ensures someone is explicitly assigned to accompany Papa to his cardiology review, take notes, and upload the new prescription.",
    replaces: "Uncertainty over who is driving, missed appointments, and forgotten doctor advice",
    icon: Calendar,
    photoUrl: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80",
    photoAlt: "Senior smiling peacefully after healthy clinic checkup",
    details: [
      "Doctor appointment scheduling with clinic location and transportation notes",
      "Explicit escort assignments: assigned to sibling, family member, or trusted attendant",
      "Automated WhatsApp/SMS calendar reminders 48 hours and 2 hours prior",
      "Direct link to Document Vault to attach post-visit consultation notes",
    ],
    demoRole: "ananya",
    demoPath: "/app/family/health",
    tag: "Care Accompaniment",
  },
  {
    id: "care-pulse",
    category: "child",
    moduleNumber: "Module 08",
    title: "Care Pulse™ Weekly Adherence & Trend Analytics",
    subtitle: "Spot health declines weeks before they turn into emergencies",
    humanImpact: "Shows gradual drops in mobility or wellness scores early, allowing you to consult the physician proactively.",
    replaces: "Discovering health deterioration only when a crisis lands a parent in the hospital",
    icon: Activity,
    photoUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    photoAlt: "Daughter reviewing trends with reassuring smile",
    details: [
      "7-day rolling adherence charts comparing prescribed vs taken doses",
      "Caregiver attendance hours and duty verification trends",
      "Weekly wellness score derived from parent check-in consistency and mood",
      "Exportable health summary for physician review during quarterly consultations",
    ],
    demoRole: "ananya",
    demoPath: "/app/family/more",
    tag: "Preventive Care",
  },
  {
    id: "family-journal",
    category: "parent",
    moduleNumber: "Module 09",
    title: "Private Family Journal & Memory Archive",
    subtitle: "Because caring for our elders is also about celebrating life and love",
    humanImpact: "A private family sanctuary where children share old photos, record Papa's stories, and celebrate small daily victories together.",
    replaces: "Getting lost in noisy WhatsApp groups filled with forwards and clutter",
    icon: BookOpen,
    photoUrl: "https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80",
    photoAlt: "Quiet veranda where stories and memories are shared",
    details: [
      "Warm reflection entries with photo attachments and emotional tags",
      "Chronological care milestone timeline celebrating recovery and birthdays",
      "Private family sanctuary isolated strictly within your family workspace",
      "Elders can dictate voice notes that are transcribed and preserved",
    ],
    demoRole: "ananya",
    demoPath: "/app/family/updates",
    tag: "Family Warmth",
  },
  {
    id: "automated-escalations",
    category: "child",
    moduleNumber: "Module 10",
    title: "Intelligent Event Escalations & Safeguard Triggers",
    subtitle: "Automatic alerts when a crucial medication or check-in is missed",
    humanImpact: "You don't need to stare at an app all day. If Papa misses his morning dose by 45 minutes, Nanu's alerts the right person gently.",
    replaces: "Constantly obsessing over whether you forgot to check on them today",
    icon: BellRing,
    photoUrl: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=800&q=80",
    photoAlt: "Hands resting peacefully with automated safeguards running in background",
    details: [
      "Configurable escalation hierarchy: elder → primary caregiver → primary child → backup family",
      "Gentle nudge intervals before urgent alerts are triggered",
      "Zero spam: deduped notifications delivered across in-app, SMS, and WhatsApp",
      "Refill prediction: flags prescription shortages 4 days prior with assigned purchaser",
    ],
    demoRole: "ananya",
    demoPath: "/app/family/more",
    tag: "Active Safeguard",
  },
  {
    id: "caregiver-expenses",
    category: "caregiver",
    moduleNumber: "Module 11",
    title: "Caregiver Out-of-Pocket Expense Management",
    subtitle: "Immediate transparency for grocery, medicine, and emergency taxi purchases",
    humanImpact: "Attendants never have to hesitate or pay out of pocket, and children have complete financial transparency.",
    replaces: "Losing crumpled paper pharmacy receipts and awkward money disputes",
    icon: Receipt,
    photoUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    photoAlt: "Caregiver and elder coordinating home essentials",
    details: [
      "Attendants log grocery, medication, or medical transport purchases with 1 tap",
      "Receipt photo capture and timestamped expense audit log",
      "Family owner instant review and reimbursement settlement tracker",
      "Eliminates cash confusion and keeps care accounts honest and clear",
    ],
    demoRole: "ramesh",
    demoPath: "/app/caregiver/activity",
    tag: "Financial Clarity",
  },
  {
    id: "security-consent",
    category: "child",
    moduleNumber: "Module 12",
    title: "PostgreSQL Row-Level Security & Consent Privacy",
    subtitle: "Bank-grade data isolation where your family data is sacred",
    humanImpact: "No advertiser ever sees your parent's health records. No external caregiver sees other families. Absolute privacy.",
    replaces: "Unsecured messaging apps selling family medical details to data brokers",
    icon: ShieldCheck,
    photoUrl: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80",
    photoAlt: "Senior elder enjoying peaceful, private home life",
    details: [
      "PostgreSQL Row Level Security (RLS) policies enforced on every single table",
      "Private Supabase Storage buckets with short-lived signed URLs",
      "Zero cross-tenant data leakage: cryptographic tenant boundaries",
      "100% consent-driven: elders approve access to their health records",
    ],
    demoRole: "ananya",
    demoPath: "/app/family",
    tag: "Bank-Grade Trust",
  },
];

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const handleLaunchDemo = async (role: "ananya" | "rajesh" | "ramesh", path: string) => {
    try {
      ensureSharmaDemoSeeded();
      switchDemoPersona(role);
      await refresh();
      navigate(path);
    } catch {
      navigate("/login");
    }
  };

  const filteredFeatures = ALL_FEATURES.filter((f) => {
    const matchesCategory = activeCategory === "all" || f.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.humanImpact.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <SiteHeader />

      <main className="overflow-hidden">
        {/* HERO SECTION */}
        <section className="relative border-b border-sage/60 bg-gradient-to-b from-ivory to-white py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-forest/30 bg-forest/5 px-4 py-1.5 text-xs font-semibold text-forest shadow-xs">
                <Sparkles size={14} className="text-forest" />
                <span>Complete Full-Stack Architecture • 12 Active Modules</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl font-extrabold text-forest tracking-tight leading-[1.15]">
                Built for Human Care, <br className="hidden sm:inline" />
                <span className="italic text-charcoal">Not Clinical Bureaucracy.</span>
              </h1>

              <p className="mt-4 text-base sm:text-xl text-charcoal/80 max-w-2xl mx-auto leading-relaxed">
                Every feature in Nanu&apos;s AI exists for one reason: to turn the quiet anxiety of distance into shared family peace, without ever stripping an aging parent of their dignity.
              </p>
            </motion.div>

            {/* FILTER & INTERACTIVE CATEGORY SELECTOR */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-sage/40 pt-8">
              {/* Category Tabs */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 bg-white p-1.5 rounded-2xl border border-sage/60 shadow-xs">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    activeCategory === "all"
                      ? "bg-forest text-ivory shadow-xs"
                      : "text-charcoal/70 hover:bg-ivory hover:text-charcoal"
                  }`}
                >
                  All 12 Modules
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory("child")}
                  className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    activeCategory === "child"
                      ? "bg-forest text-ivory shadow-xs"
                      : "text-charcoal/70 hover:bg-ivory hover:text-charcoal"
                  }`}
                >
                  For Distant Children
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory("parent")}
                  className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    activeCategory === "parent"
                      ? "bg-forest text-ivory shadow-xs"
                      : "text-charcoal/70 hover:bg-ivory hover:text-charcoal"
                  }`}
                >
                  For Aging Parents
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory("caregiver")}
                  className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    activeCategory === "caregiver"
                      ? "bg-forest text-ivory shadow-xs"
                      : "text-charcoal/70 hover:bg-ivory hover:text-charcoal"
                  }`}
                >
                  For Caregivers
                </button>
              </div>

              {/* Instant Search Bar */}
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search features (e.g. meds, handover)..."
                  className="w-full rounded-xl border border-sage bg-white px-4 py-2 text-xs sm:text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section className="py-12 sm:py-20 bg-ivory">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-6 flex items-center justify-between text-xs text-charcoal/60 font-semibold">
              <span>Showing {filteredFeatures.length} of {ALL_FEATURES.length} capabilities</span>
              <span>100% Implemented & Demo Ready</span>
            </div>

            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredFeatures.map((f) => {
                  const Icon = f.icon;
                  return (
                    <motion.div
                      layout
                      key={f.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                      className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-sage/70 bg-white shadow-xs transition-all hover:border-forest/50 hover:shadow-lg"
                    >
                      <div>
                        {/* Human Photography Thumbnail */}
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-forest/10">
                          <img
                            src={f.photoUrl}
                            alt={f.photoAlt}
                            className="h-full w-full object-cover filter brightness-[0.97] group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent flex items-end justify-between p-4">
                            <span className="rounded-full bg-ivory/95 px-2.5 py-0.5 text-[11px] font-bold text-forest shadow-xs">
                              {f.tag}
                            </span>
                            <span className="text-[11px] font-bold tracking-wider uppercase text-ivory/90">
                              {f.moduleNumber}
                            </span>
                          </div>
                        </div>

                        {/* Card Content Body */}
                        <div className="p-6 space-y-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest/10 text-forest">
                              <Icon size={18} />
                            </div>
                            <h2 className="font-serif text-lg font-bold text-forest leading-snug">
                              {f.title}
                            </h2>
                          </div>

                          <p className="text-xs font-medium text-charcoal/80 leading-relaxed italic">
                            &ldquo;{f.subtitle}&rdquo;
                          </p>

                          {/* Emotional Benefit Callout */}
                          <div className="rounded-xl border border-sage/40 bg-ivory/60 p-3 text-xs space-y-1">
                            <strong className="text-forest block">Why this matters:</strong>
                            <p className="text-charcoal/80 leading-relaxed">{f.humanImpact}</p>
                          </div>

                          {/* Replaces Box */}
                          <div className="rounded-xl border border-coral/30 bg-coral/5 p-2.5 text-[11px] text-charcoal/80 flex items-start gap-2">
                            <span className="font-bold text-coral shrink-0">Replaces:</span>
                            <span>{f.replaces}</span>
                          </div>

                          {/* Detail Bullet Points */}
                          <ul className="space-y-1.5 text-xs text-charcoal/70 pt-1">
                            {f.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <CheckCircle2 size={13} className="text-forest shrink-0 mt-0.5" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Card Footer: Interactive Live Demo Button */}
                      <div className="border-t border-sage/40 bg-ivory/40 p-4 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => handleLaunchDemo(f.demoRole, f.demoPath)}
                          className="inline-flex items-center gap-1.5 font-bold text-forest hover:underline"
                        >
                          <span>Try in Live Demo</span>
                          <ArrowRight size={13} />
                        </button>
                        <span className="text-[11px] text-charcoal/50">
                          {f.category === "parent" ? "Elder Mode" : f.category === "caregiver" ? "Caregiver Mode" : "Family Mode"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* SECTION 3: THE 3-WAY ACCOUNTABILITY ECOSYSTEM (INTERACTIVE DIAGRAM) */}
        <section className="border-t border-sage/60 py-16 sm:py-24 bg-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-forest">
                System Philosophy
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-forest">
                The 3-Way Accountability Ecosystem
              </h2>
              <p className="mt-3 text-sm sm:text-base text-charcoal/70">
                Care fails when it is siloed. Nanu&apos;s AI connects all three stakeholders into one seamless, honest loop.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stakeholder 1 */}
              <div className="rounded-3xl border-2 border-forest/30 bg-ivory/50 p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-forest text-ivory px-3 py-1 text-xs font-bold">
                    Stakeholder A
                  </span>
                  <span className="text-xs text-forest font-semibold">Autonomy</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-forest">The Aging Parent</h3>
                <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
                  Never feels surveilled or infantilized. Retains full consent and controls their own daily check-in with large readable touch targets.
                </p>
                <div className="pt-2 text-xs font-semibold text-forest flex items-center gap-1.5">
                  <CheckSquare size={14} />
                  <span>1-Tap Wellness & Meds Confirmation</span>
                </div>
              </div>

              {/* Stakeholder 2 */}
              <div className="rounded-3xl border-2 border-forest/40 bg-white p-6 sm:p-8 space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-forest text-ivory px-3 py-1 text-xs font-bold">
                    Stakeholder B
                  </span>
                  <span className="text-xs text-forest font-semibold">Peace of Mind</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-forest">The Distant Children</h3>
                <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
                  No longer spend their mornings in anxious uncertainty. A 10-second glance confirms health, medicine adherence, and caregiver attendance.
                </p>
                <div className="pt-2 text-xs font-semibold text-forest flex items-center gap-1.5">
                  <Activity size={14} />
                  <span>10-Second Family Status & Escalate Rules</span>
                </div>
              </div>

              {/* Stakeholder 3 */}
              <div className="rounded-3xl border-2 border-forest/30 bg-ivory/50 p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-forest text-ivory px-3 py-1 text-xs font-bold">
                    Stakeholder C
                  </span>
                  <span className="text-xs text-forest font-semibold">Respect</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-forest">The Caregiver</h3>
                <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
                  Clear daily instructions, verified shift attendance, and independent assistance logs protect them from unfair blame and foster mutual trust.
                </p>
                <div className="pt-2 text-xs font-semibold text-forest flex items-center gap-1.5">
                  <Users size={14} />
                  <span>Shift Checklists & Structured Handover</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: CALL TO ACTION */}
        <section className="py-20 bg-forest text-ivory">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-6">
            <BrandLogo size="lg" className="justify-center" />
            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-ivory">
              Ready to bring peace of mind to your family?
            </h2>
            <p className="text-base sm:text-lg text-sage max-w-xl mx-auto leading-relaxed">
              Experience the complete Sharma family live simulation, or set up your own private family workspace in 2 minutes.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signup"
                className="w-full sm:w-auto rounded-xl bg-coral px-8 py-4 text-base font-bold text-charcoal hover:bg-coral/90 transition-all shadow-md"
              >
                Create Family Workspace Free
              </Link>
              <button
                type="button"
                onClick={() => handleLaunchDemo("ananya", "/app/family")}
                className="w-full sm:w-auto rounded-xl border border-sage/60 px-7 py-4 text-base font-semibold text-ivory hover:bg-white/10 transition-all"
              >
                Explore Live Demo (1-Click)
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-sage/60 bg-ivory py-8 text-xs text-charcoal/70">
        <div className="mx-auto flex max-w-5xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showText={false} />
            <span>NANU&apos;S AI — &ldquo;Care is love, made visible.&rdquo;</span>
          </div>
          <div className="flex items-center gap-4 font-medium">
            <Link to="/about" className="hover:underline">About</Link>
            <Link to="/features" className="hover:underline text-forest font-bold">Features</Link>
            <Link to="/login" className="hover:underline">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
