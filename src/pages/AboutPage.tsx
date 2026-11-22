import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SiteHeader from "../components/SiteHeader";
import BrandLogo from "../components/BrandLogo";
import {
  Heart,
  Quote,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface StoryChapter {
  id: string;
  tag: string;
  title: string;
  hindiTitle: string;
  quote: string;
  body: string;
  image: string;
  imageAlt: string;
  takeaway: string;
}

const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: "evening-call",
    tag: "The Daily Reality",
    title: "The 8:00 PM WhatsApp Call",
    hindiTitle: "शाम की वह जानी-पहचानी कॉल",
    quote: "“Haan beta, sab theek hai. Tum tension mat lo, khana kha liya?”",
    body: "Every evening across Bengaluru, Mumbai, London, and New York, millions of working children dial the same number with the same knot in their stomach. And every evening, Indian parents give the exact same loving response—even when knees are aching, pill bottles sit unopened on the bedside table, and the caregiver didn't show up until noon.",
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Wrinkled elder hands holding a warm cup of morning tea",
    takeaway: "Parents hide their struggles to protect us from worry. Distance turns care into guesswork.",
  },
  {
    id: "silent-worry",
    tag: "The Invisible Guilt",
    title: "The Weight of 500 Miles",
    hindiTitle: "दूरियों की अनकही चिंता",
    quote: "“I was in an executive meeting when my sister called from Jaipur. Papa had missed his insulin for three days.”",
    body: "Distance doesn't mean lack of love. But when children leave home to pursue careers in distant cities, a quiet, lingering guilt takes root. You wonder if Papa took his morning blood pressure tablet. You wonder if Mummy’s arthritis is flaring up. You ask siblings, message WhatsApp groups, and call caregivers—feeling helpless, intrusive, and always half an hour too late.",
    image: "https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Sunlight falling through wooden veranda doors in a peaceful Indian home",
    takeaway: "WhatsApp groups and frantic phone calls are not a care coordination system.",
  },
  {
    id: "dignity-first",
    tag: "Our Core Belief",
    title: "Care Without Surveillance",
    hindiTitle: "निगरानी नहीं, आदर और सम्मान",
    quote: "“Our parents spent their entire lives giving us wings. We will never turn their twilight years into a monitored cell.”",
    body: "When modern technology tackles eldercare, its instinct is often cold surveillance: CCTV cameras pointed at the living room sofa, GPS tracking bands, and robotic reminders that make an elderly mother feel like a patient under house arrest. We vehemently rejected this. True care preserves dignity. An elder must have autonomy, consent, and voice.",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Smiling elder grandfather with gentle pride and peaceful warmth",
    takeaway: "Zero invasive cameras. 100% consent-driven transparency.",
  },
  {
    id: "shared-promise",
    tag: "The Solution",
    title: "Care is Love, Made Visible",
    hindiTitle: "प्यार, जो स्पष्ट दिखता है",
    quote: "“When care is transparent, anxiety turns into gratitude. Everyone knows what happened, and everyone rests peacefully.”",
    body: "Nanu's AI was created to replace the daily anxiety of distance with quiet clarity. In ten seconds on your morning commute, you see that Papa confirmed his medication, the caregiver Ramesh arrived at 08:30 AM, and an appointment with Dr. Mehta is confirmed for Thursday. No frantic calls. No forgotten responsibilities. Just visible love.",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Caring companion assisting an elder with warmth and dignity",
    takeaway: "One shared ecosystem for parents, children across cities, and trusted caregivers.",
  },
];

interface Testimonial {
  name: string;
  role: string;
  city: string;
  parentName: string;
  parentCity: string;
  quote: string;
  highlight: string;
  avatar: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ananya Sharma",
    role: "Product Director",
    city: "Bengaluru",
    parentName: "Rajesh Sharma",
    parentCity: "Jaipur",
    quote: "Before Nanu's, every single WhatsApp call with my father was an interrogation: 'Did you take Telmisartan? Did Ramesh come?' It strained our relationship. Now, I open the 10-Second View at 9:00 AM, see everything is confirmed, and our evening phone calls are about childhood stories, laughter, and poetry again.",
    highlight: "Saved our evening conversations",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Dr. Amit Mehra",
    role: "Orthopedic Surgeon",
    city: "London / Delhi",
    parentName: "Suman Mehra",
    parentCity: "Lucknow",
    quote: "Living eight hours behind IST made emergency care tracking a nightmare. The dual-confirmation system in Nanu's is brilliant: my mother confirms she took her medicine, and her caregiver logs assistance independently. I have clinical peace of mind across oceans.",
    highlight: "Cross-continent clinical peace",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Ramesh Kumar",
    role: "Certified Geriatric Caregiver",
    city: "Jaipur",
    parentName: "Caregiver Partner",
    parentCity: "Sharma Residence",
    quote: "Caregivers are often blamed when family members disagree among themselves. With Nanu's shift checklist and photo evidence for prescriptions, my work is respected, verified, and transparent. The Sharma family treats me like a partner, not a suspect.",
    highlight: "Dignity and respect for caregivers",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
];

export default function AboutPage() {
  const [activeChapterId, setActiveChapterId] = useState("evening-call");
  const [activeLetterLang, setActiveLetterLang] = useState<"en" | "hi">("en");
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);
  const [interactiveComparison, setInteractiveComparison] = useState<"without" | "with">("with");

  const activeChapter = STORY_CHAPTERS.find((c) => c.id === activeChapterId) ?? STORY_CHAPTERS[0];

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <SiteHeader />

      <main className="overflow-hidden">
        {/* HERO SECTION — EMOTIONAL OPENING */}
        <section className="relative border-b border-sage/60 bg-gradient-to-b from-ivory to-white py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-forest/30 bg-forest/5 px-4 py-1.5 text-xs font-semibold text-forest shadow-xs mb-6">
                <Heart size={14} className="text-coral fill-coral animate-pulse" />
                <span>The Story & Soul of Nanu&apos;s AI</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl font-extrabold text-forest tracking-tight leading-[1.15]">
                Why We Built Nanu&apos;s AI
              </h1>

              <p className="mt-4 font-serif text-xl sm:text-2xl italic text-charcoal/80">
                &ldquo;Care is love, made visible.&rdquo;
              </p>

              <p className="mt-6 text-base sm:text-lg leading-relaxed text-charcoal/80 max-w-2xl mx-auto">
                Born out of the silent guilt of living miles away, the anxious evening phone calls to aging parents,
                and the deep conviction that care must never rob an elder of their dignity.
              </p>
            </motion.div>

            {/* HERO EMOTIONAL PHOTOGRAPHY BANNER */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mt-12 overflow-hidden rounded-3xl border-2 border-sage/70 shadow-xl bg-white"
            >
              <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-forest/10 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1600&q=80"
                  alt="Wrinkled elderly hands gently holding warm tea cup in golden morning sunlight"
                  className="h-full w-full object-cover filter brightness-[0.95] contrast-[1.05]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent flex items-end p-6 sm:p-10">
                  <div className="text-ivory max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-widest text-sage">
                      Jaipur, Rajasthan • 08:15 AM
                    </p>
                    <p className="mt-2 font-serif text-lg sm:text-2xl font-bold leading-snug">
                      &ldquo;When family lives far away, the hardest part is not knowing.
                      Peace of mind shouldn&apos;t require twenty anxious phone calls a day.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 2: INTERACTIVE STORY CHAPTERS (MOTION TABS) */}
        <section className="border-b border-sage/60 py-16 sm:py-24 bg-ivory">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-forest">
                The Journey
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-forest">
                Four Moments That Changed How We Care
              </h2>
              <p className="mt-3 text-sm sm:text-base text-charcoal/70">
                Click through the moments every distant family experiences, and how we solved them.
              </p>
            </div>

            {/* Chapter Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
              {STORY_CHAPTERS.map((chapter, idx) => {
                const isActive = chapter.id === activeChapterId;
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => setActiveChapterId(chapter.id)}
                    className={`relative rounded-2xl p-4 text-left transition-all ${
                      isActive
                        ? "bg-forest text-ivory shadow-md scale-[1.02]"
                        : "bg-white border border-sage/60 text-charcoal hover:border-forest/40"
                    }`}
                  >
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                      isActive ? "text-sage" : "text-charcoal/50"
                    }`}>
                      Chapter 0{idx + 1}
                    </span>
                    <h3 className="mt-1 text-sm sm:text-base font-bold leading-snug">
                      {chapter.title}
                    </h3>
                    {isActive && (
                      <motion.div
                        layoutId="chapterPill"
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1.5 w-10 bg-coral rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Chapter Card with Framer Motion AnimatePresence */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeChapter.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden rounded-3xl border border-sage/70 bg-white shadow-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Photo Side */}
                  <div className="relative h-64 md:h-auto min-h-[300px] overflow-hidden bg-forest/10">
                    <img
                      src={activeChapter.image}
                      alt={activeChapter.imageAlt}
                      className="h-full w-full object-cover filter brightness-[0.98]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent flex items-end p-5">
                      <span className="rounded-full bg-ivory/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-charcoal">
                        {activeChapter.tag}
                      </span>
                    </div>
                  </div>

                  {/* Narrative Side */}
                  <div className="p-6 sm:p-10 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex items-center gap-2 text-forest/70 text-xs font-semibold uppercase">
                        <span>{activeChapter.hindiTitle}</span>
                      </div>

                      <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-forest">
                        {activeChapter.title}
                      </h3>

                      {/* Emotional Quote */}
                      <blockquote className="mt-4 rounded-xl border-l-4 border-coral bg-coral/10 p-4 font-serif text-base italic text-charcoal/90">
                        {activeChapter.quote}
                      </blockquote>

                      <p className="mt-4 text-sm sm:text-base leading-relaxed text-charcoal/80">
                        {activeChapter.body}
                      </p>
                    </div>

                    <div className="rounded-xl border border-sage/50 bg-ivory/70 p-4 flex items-start gap-3 text-xs sm:text-sm">
                      <Sparkles size={18} className="text-forest shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-forest font-semibold">The Nanu&apos;s Principle: </strong>
                        <span className="text-charcoal/80">{activeChapter.takeaway}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* SECTION 3: "A LETTER TO OUR PARENTS" (एक पाती माँ-बाबूजी के नाम) */}
        <section className="border-b border-sage/60 py-16 sm:py-20 bg-[#F5EFE6]">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-forest">
                From The Heart
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-forest">
                A Letter to Our Parents
              </h2>
              <p className="mt-2 text-sm text-charcoal/70">माँ-बाबूजी के नाम एक पाती</p>

              {/* Language Switcher for Letter */}
              <div className="mt-5 inline-flex items-center gap-1 rounded-full border border-forest/30 bg-white p-1 text-xs font-bold shadow-xs">
                <button
                  type="button"
                  onClick={() => setActiveLetterLang("en")}
                  className={`rounded-full px-4 py-1.5 transition-colors ${
                    activeLetterLang === "en" ? "bg-forest text-ivory" : "text-charcoal"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLetterLang("hi")}
                  className={`rounded-full px-4 py-1.5 transition-colors ${
                    activeLetterLang === "hi" ? "bg-forest text-ivory" : "text-charcoal"
                  }`}
                >
                  हिंदी (Hindi)
                </button>
              </div>
            </div>

            {/* Parchment Styled Letter Container */}
            <motion.div
              layout
              className="relative rounded-3xl border-2 border-sage/60 bg-[#FDFBF7] p-8 sm:p-12 shadow-md space-y-6"
            >
              <div className="flex items-center justify-between border-b border-sage/40 pb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={20} className="text-forest" />
                  <span className="font-serif text-sm font-bold text-forest">
                    {activeLetterLang === "en" ? "To Ma and Babuji," : "आदरणीय माँ और बाबूजी,"}
                  </span>
                </div>
                <span className="rounded-full bg-coral/20 px-3 py-0.5 text-xs font-semibold text-charcoal">
                  {activeLetterLang === "en" ? "With Eternal Gratitude" : "सादर प्रणाम"}
                </span>
              </div>

              {activeLetterLang === "en" ? (
                <div className="font-serif text-base sm:text-lg leading-relaxed text-charcoal/90 space-y-4">
                  <p>
                    You spent thirty years giving us wings. You saved every rupee for our college fees,
                    stood awake by our beds when we had a fever, and waved us goodbye at railway stations with tears hidden behind proud smiles.
                  </p>
                  <p>
                    When we moved to Bengaluru, Pune, London, or New York, you never asked for anything.
                    Whenever we ask how you are, you say: <em>&ldquo;Haan beta, sab theek hai.&rdquo;</em> You swallow joint pain in silence so we don&apos;t lose focus on our work.
                  </p>
                  <p>
                    We built Nanu&apos;s AI not to watch you, not to control you, and never to treat you like patients.
                    We built it so that we can carry our share of the responsibility—quietly, respectfully, and faithfully.
                    So that you never have to hesitate before saying you need a refill, and we never have to spend another night wondering if you took your medicine.
                  </p>
                  <p className="pt-2 font-bold text-forest">
                    You gave us everything. This is our promise to make sure you are always cared for.
                  </p>
                  <p className="text-sm italic text-charcoal/70">
                    — Your children across cities, founders of Nanu&apos;s AI
                  </p>
                </div>
              ) : (
                <div className="font-serif text-base sm:text-lg leading-relaxed text-charcoal/90 space-y-4">
                  <p>
                    आपने अपनी पूरी ज़िंदगी हमें पंख देने में लगा दी। कॉलेज की फ़ीस के लिए एक-एक रुपया जोड़ा,
                    बुखार में रात-रात भर सिरहाने बैठे रहे, और जब हम शहर छोड़कर निकले तो गर्व से मुस्कराते हुए अपनी नम आँखें छुपा लीं।
                  </p>
                  <p>
                    हम बेंगलुरु, मुंबई या परदेस चले गए, पर आपने कभी शिकायत नहीं की। हर फ़ोन पर सिर्फ़ यही कहा:
                    <em>&ldquo;हाँ बेटा, सब ठीक है, तुम अपनी पढ़ाई-नौकरी पर ध्यान दो।&rdquo;</em> जोड़ों का दर्द सह लिया पर हमें कभी परेशान नहीं होने दिया।
                  </p>
                  <p>
                    नानु&apos;स एआई हमने आप पर नज़र रखने या आपको मरीज समझने के लिए नहीं बनाया।
                    यह तो हमारा तरीका है उस ज़िम्मेदारी को निभाने का, जो आपका हक़ है।
                    ताकि आपको कभी दवाई खत्म होने पर झिझकना न पड़े, और हम मीलों दूर रहकर भी सुकून से सो सकें कि आप सुरक्षित हैं।
                  </p>
                  <p className="pt-2 font-bold text-forest">
                    आपने हमें चलना सिखाया; अब हमारा फ़र्ज़ है कि आपकी हर ज़रूरत का सम्मानपूर्वक ध्यान रखा जाए।
                  </p>
                  <p className="text-sm italic text-charcoal/70">
                    — आपके दूर बैठे बच्चे, नानु&apos;स एआई परिवार
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* SECTION 4: INTERACTIVE "WITHOUT VS WITH NANU'S" */}
        <section className="border-b border-sage/60 py-16 sm:py-20 bg-ivory">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-forest">
                Real-Life Comparison
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-forest">
                The Daily Difference for Distant Families
              </h2>
              <p className="mt-3 text-sm text-charcoal/70">
                Toggle between the old chaos and the peace of shared visibility.
              </p>

              {/* Interactive Mode Toggle */}
              <div className="mt-6 inline-flex rounded-full border border-sage bg-white p-1 text-xs font-bold shadow-xs">
                <button
                  type="button"
                  onClick={() => setInteractiveComparison("without")}
                  className={`rounded-full px-5 py-2 transition-all ${
                    interactiveComparison === "without"
                      ? "bg-coral text-white font-bold shadow-xs"
                      : "text-charcoal hover:bg-ivory"
                  }`}
                >
                  Without Nanu&apos;s (Anxiety & Calls)
                </button>
                <button
                  type="button"
                  onClick={() => setInteractiveComparison("with")}
                  className={`rounded-full px-5 py-2 transition-all ${
                    interactiveComparison === "with"
                      ? "bg-forest text-ivory font-bold shadow-xs"
                      : "text-charcoal hover:bg-ivory"
                  }`}
                >
                  With Nanu&apos;s (Quiet Peace)
                </button>
              </div>
            </div>

            {/* Comparison Cards */}
            <motion.div
              layout
              className="grid gap-4 sm:grid-cols-2"
            >
              {interactiveComparison === "without" ? (
                <>
                  <div className="rounded-2xl border border-coral/40 bg-coral/5 p-6 space-y-3">
                    <span className="text-xs font-bold uppercase text-coral">Morning 08:30 AM</span>
                    <h3 className="text-lg font-bold text-charcoal">The Interrogation Call</h3>
                    <p className="text-sm text-charcoal/80 leading-relaxed">
                      You call during your morning cab ride. Papa is irritated: &ldquo;Why do you ask every day if I took my sugar pill? I am not a child.&rdquo; Tension begins the day.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-coral/40 bg-coral/5 p-6 space-y-3">
                    <span className="text-xs font-bold uppercase text-coral">Caregiver Uncertainty</span>
                    <h3 className="text-lg font-bold text-charcoal">Did Ramesh Actually Show Up?</h3>
                    <p className="text-sm text-charcoal/80 leading-relaxed">
                      You have no idea if the attendant arrived, if the BP was checked, or if Mummy had a proper meal. You ping siblings on WhatsApp asking if anyone spoke to him.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-coral/40 bg-coral/5 p-6 space-y-3">
                    <span className="text-xs font-bold uppercase text-coral">Medication Gaps</span>
                    <h3 className="text-lg font-bold text-charcoal">The Last-Minute Refill Crisis</h3>
                    <p className="text-sm text-charcoal/80 leading-relaxed">
                      At 10:00 PM on Sunday, Papa notices the insulin pen is empty. A frantic search for late-night pharmacies begins from two cities away.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-coral/40 bg-coral/5 p-6 space-y-3">
                    <span className="text-xs font-bold uppercase text-coral">Invasive Alternatives</span>
                    <h3 className="text-lg font-bold text-charcoal">Cameras in the Living Room</h3>
                    <p className="text-sm text-charcoal/80 leading-relaxed">
                      Parents feel constantly watched and undignified, pulling curtains or turning off WiFi to maintain privacy in their own home.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-forest/40 bg-white p-6 space-y-3 shadow-xs">
                    <span className="text-xs font-bold uppercase text-forest">Morning 08:30 AM</span>
                    <h3 className="text-lg font-bold text-forest">10-Second Peace of Mind</h3>
                    <p className="text-sm text-charcoal/80 leading-relaxed">
                      You open your phone. Green checkmark: Papa confirmed his medication with 1 tap at 08:15 AM. You send a cheerful &ldquo;Good morning Papa!&rdquo; sticker.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-forest/40 bg-white p-6 space-y-3 shadow-xs">
                    <span className="text-xs font-bold uppercase text-forest">Caregiver Accountability</span>
                    <h3 className="text-lg font-bold text-forest">Verified Attendance & Checklist</h3>
                    <p className="text-sm text-charcoal/80 leading-relaxed">
                      Ramesh checked in at 08:30 AM, logged assistance for the morning walk, and recorded blood pressure (126/82). Both family and attendant are protected.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-forest/40 bg-white p-6 space-y-3 shadow-xs">
                    <span className="text-xs font-bold uppercase text-forest">Automated Refills</span>
                    <h3 className="text-lg font-bold text-forest">Refill Reminders Assigned Early</h3>
                    <p className="text-sm text-charcoal/80 leading-relaxed">
                      Four days before the prescription runs out, an automated task is assigned to sibling Rohit in Delhi, who orders it online with 1 click.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-forest/40 bg-white p-6 space-y-3 shadow-xs">
                    <span className="text-xs font-bold uppercase text-forest">Dignity First</span>
                    <h3 className="text-lg font-bold text-forest">Zero Cameras, Full Respect</h3>
                    <p className="text-sm text-charcoal/80 leading-relaxed">
                      Parents have complete agency. Large touch buttons, Hindi voice read-aloud, and private homes that remain sacred sanctuaries.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </section>

        {/* SECTION 5: EMOTIONAL METRICS (IMPACT COUNTERS) */}
        <section className="border-b border-sage/60 py-16 bg-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <span className="font-serif text-4xl sm:text-5xl font-extrabold text-forest block">
                  0
                </span>
                <span className="text-xs sm:text-sm font-semibold text-charcoal">
                  Invasive Cameras
                </span>
                <p className="text-xs text-charcoal/60">100% Dignity Preserved</p>
              </div>

              <div className="space-y-1">
                <span className="font-serif text-4xl sm:text-5xl font-extrabold text-forest block">
                  10s
                </span>
                <span className="text-xs sm:text-sm font-semibold text-charcoal">
                  Family Glance Time
                </span>
                <p className="text-xs text-charcoal/60">4 Questions Answered</p>
              </div>

              <div className="space-y-1">
                <span className="font-serif text-4xl sm:text-5xl font-extrabold text-forest block">
                  1-Tap
                </span>
                <span className="text-xs sm:text-sm font-semibold text-charcoal">
                  Parent Check-In
                </span>
                <p className="text-xs text-charcoal/60">Under 5 Seconds</p>
              </div>

              <div className="space-y-1">
                <span className="font-serif text-4xl sm:text-5xl font-extrabold text-forest block">
                  100%
                </span>
                <span className="text-xs sm:text-sm font-semibold text-charcoal">
                  Consent-Driven
                </span>
                <p className="text-xs text-charcoal/60">Shared Family Trust</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: ECHOES OF CARE (INTERACTIVE REAL VOICES) */}
        <section className="border-b border-sage/60 py-16 sm:py-24 bg-ivory">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-forest">
                Real Stories
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-forest">
                Voices of Those We Serve
              </h2>
              <p className="mt-2 text-sm text-charcoal/70">
                Children living far away, caring elderly parents, and trusted care attendants.
              </p>
            </div>

            {/* Testimonial Active Display */}
            <motion.div
              key={activeTestimonialIdx}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-sage/70 bg-white p-8 sm:p-10 shadow-md space-y-6"
            >
              <Quote size={32} className="text-forest/30" />
              <p className="font-serif text-lg sm:text-xl leading-relaxed text-charcoal italic">
                &ldquo;{TESTIMONIALS[activeTestimonialIdx].quote}&rdquo;
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-sage/40 pt-4 gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={TESTIMONIALS[activeTestimonialIdx].avatar}
                    alt={TESTIMONIALS[activeTestimonialIdx].name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-forest/30"
                  />
                  <div>
                    <h4 className="font-bold text-charcoal text-base">
                      {TESTIMONIALS[activeTestimonialIdx].name}
                    </h4>
                    <p className="text-xs text-charcoal/60">
                      {TESTIMONIALS[activeTestimonialIdx].role} • {TESTIMONIALS[activeTestimonialIdx].city} (Caring for {TESTIMONIALS[activeTestimonialIdx].parentName}, {TESTIMONIALS[activeTestimonialIdx].parentCity})
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest self-start sm:self-center">
                  {TESTIMONIALS[activeTestimonialIdx].highlight}
                </span>
              </div>
            </motion.div>

            {/* Testimonial Selectors */}
            <div className="mt-6 flex justify-center items-center gap-2">
              {TESTIMONIALS.map((t, idx) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setActiveTestimonialIdx(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === activeTestimonialIdx ? "w-8 bg-forest" : "w-2.5 bg-sage hover:bg-forest/50"
                  }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7: FINAL CALL TO ACTION */}
        <section className="py-20 bg-forest text-ivory">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-6">
            <BrandLogo size="lg" className="justify-center" />
            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-ivory">
              Give your parents the gift of dignity. <br className="hidden sm:inline" />
              Give yourself the gift of peace.
            </h2>
            <p className="text-base sm:text-lg text-sage max-w-xl mx-auto leading-relaxed">
              Start your private family workspace in under two minutes. No cameras, no surveillance, no credit card required.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signup"
                className="w-full sm:w-auto rounded-xl bg-coral px-8 py-4 text-base font-bold text-charcoal hover:bg-coral/90 transition-all shadow-md"
              >
                Create Your Family Space
              </Link>
              <Link
                to="/features"
                className="w-full sm:w-auto rounded-xl border border-sage/60 px-7 py-4 text-base font-semibold text-ivory hover:bg-white/10 transition-all"
              >
                See All 12 Modules
              </Link>
            </div>

            <p className="text-xs text-sage/70 pt-2">
              Questions or bespoke care arrangements? Our family team is always here for yours.
            </p>
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
            <Link to="/about" className="hover:underline text-forest">About</Link>
            <Link to="/features" className="hover:underline">Features</Link>
            <Link to="/login" className="hover:underline">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
