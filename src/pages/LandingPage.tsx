import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import SiteHeader from "../components/SiteHeader";

export default function LandingPage() {
  const reduceMotion = useReducedMotion();

  const heroMotion = reduceMotion
    ? { initial: false as const, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4">
        <motion.section
          className="py-16 sm:py-24"
          initial={heroMotion.initial}
          animate={heroMotion.animate}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="font-serif text-4xl leading-tight text-forest sm:text-5xl">
            Care is love, made visible.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-charcoal">
            Even when family lives miles apart, care stays close. Nanu&apos;s brings parents,
            children and caregivers together in one trusted space.
          </p>
        </motion.section>

        <section className="border-t border-sage py-12">
          <h2 className="font-serif text-2xl text-forest">How Nanu&apos;s works</h2>
          <p className="mt-3 max-w-2xl leading-relaxed">
            A family creates one shared space. Members join with clear roles, and each person sees
            what they are responsible for and what they have chosen to share.
          </p>
        </section>

        <section className="border-t border-sage py-12">
          <h2 className="font-serif text-2xl text-forest">
            Three experiences: elder, family, caregiver
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed">
            Elders get a simple, large-text view built for them. Family members coordinate from
            their own view. Caregivers see only the work assigned to them.
          </p>
        </section>

        <section className="border-t border-sage py-12">
          <h2 className="font-serif text-2xl text-forest">Medication coordination</h2>
          <p className="mt-3 max-w-2xl leading-relaxed">
            Medication records keep the parent&apos;s own confirmation separate from any help a
            caregiver gave, so everyone can see what happened without guesswork.
          </p>
        </section>

        <section className="border-t border-sage py-12">
          <h2 className="font-serif text-2xl text-forest">Caregiver accountability</h2>
          <p className="mt-3 max-w-2xl leading-relaxed">
            Shifts, check-ins and check-outs are recorded with timestamps, so families can verify
            care was given and caregivers have a clear record to point to.
          </p>
        </section>

        <section className="border-t border-sage py-12">
          <h2 className="font-serif text-2xl text-forest">Family handovers</h2>
          <p className="mt-3 max-w-2xl leading-relaxed">
            When responsibility moves from one person to another, a handover note carries the
            key details forward so nothing important is lost between households or shifts.
          </p>
        </section>

        <section className="border-t border-sage py-12">
          <h2 className="font-serif text-2xl text-forest">Security and trust</h2>
          <p className="mt-3 max-w-2xl leading-relaxed">
            Access is limited by role. Private documents are kept in private storage, and each
            person decides what they share with whom.
          </p>
        </section>

        <section className="my-12 rounded-lg bg-sage/40 p-6 sm:p-10">
          <h2 className="font-serif text-2xl text-forest">Start with one shared space</h2>
          <p className="mt-3 max-w-2xl leading-relaxed">
            Create your family space in a few minutes, or log in if you already have one.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="flex min-h-12 items-center justify-center rounded-md bg-coral px-6 font-medium text-charcoal hover:bg-coral/90"
            >
              Start your family space
            </Link>
            <Link
              to="/login"
              className="flex min-h-12 items-center justify-center rounded-md border border-forest px-6 font-medium text-forest hover:bg-sage/60"
            >
              Log in
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
