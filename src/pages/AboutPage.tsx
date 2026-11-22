import SiteHeader from "../components/SiteHeader";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-serif text-3xl text-forest sm:text-4xl">About Nanu&apos;s</h1>

        <section className="mt-10 border-t border-sage pt-8">
          <h2 className="font-serif text-2xl text-forest">Distance shouldn&apos;t mean uncertainty</h2>
          <p className="mt-3 max-w-2xl leading-relaxed">
            When family lives far away, the hardest part is often not knowing. Nanu&apos;s exists to
            replace that uncertainty with clear, shared information that everyone agreed to share.
          </p>
        </section>

        <section className="mt-10 border-t border-sage pt-8">
          <h2 className="font-serif text-2xl text-forest">Built on transparency, consent and trust</h2>
          <p className="mt-3 max-w-2xl leading-relaxed">
            Every record shows who entered it and when. Information is shared with consent, and
            responsibility is assigned openly so people know what is expected of them.
          </p>
        </section>

        <section className="mt-10 border-t border-sage pt-8">
          <h2 className="font-serif text-2xl text-forest">What we will not do</h2>
          <ul className="mt-3 max-w-2xl list-disc space-y-2 pl-5 leading-relaxed">
            <li>Make elders feel watched or monitored.</li>
            <li>Make children feel helpless about a parent&apos;s care.</li>
            <li>Judge caregivers unfairly from incomplete records.</li>
          </ul>
        </section>

        <section className="mt-10 border-t border-sage pt-8">
          <h2 className="font-serif text-2xl text-forest">Responsibility and care</h2>
          <p className="mt-3 max-w-2xl leading-relaxed">
            Nanu&apos;s is a coordination tool, not a replacement for medical advice or for the
            people who provide care. It exists to make that care easier to share and easier to
            trust.
          </p>
        </section>
      </main>
    </div>
  );
}
