import SiteHeader from "../components/SiteHeader";

type Status = "available" | "later";

interface Feature {
  title: string;
  status: Status;
  description: string;
}

const features: Feature[] = [
  {
    title: "Family coordination: invitations and roles",
    status: "later",
    description:
      "Family spaces with named roles for parents, children, elders and caregivers. Sign-up and family space creation are available now; invitations and member management arrive in a later phase.",
  },
  {
    title: "Medication tracking",
    status: "later",
    description:
      "Parent confirmation and caregiver assistance are recorded as separate entries, so each confirmation shows who actually did what. Arrives in a later phase.",
  },
  {
    title: "Caregiver shifts and check-in/out",
    status: "later",
    description:
      "Caregivers record shifts with check-in and check-out times. Arrives in a later phase.",
  },
  {
    title: "Care tasks and escalation",
    status: "later",
    description:
      "Assign care tasks to family members or caregivers, with escalation when a task is not handled in time. Arrives in a later phase.",
  },
  {
    title: "Care handover",
    status: "later",
    description:
      "Structured handover notes when responsibility moves between people. Arrives in a later phase.",
  },
  {
    title: "Documents in private storage",
    status: "later",
    description:
      "Store care documents in private, access-controlled storage. Arrives in a later phase.",
  },
  {
    title: "Appointments",
    status: "later",
    description:
      "Schedule and track medical and care appointments for the family. Arrives in a later phase.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-serif text-3xl text-forest sm:text-4xl">Features</h1>
        <p className="mt-4 max-w-2xl leading-relaxed">
          This is an honest list of what Nanu&apos;s does today and what is planned. Items marked
          as arriving in a later phase are not yet working.
        </p>

        <ul className="mt-10 divide-y divide-sage border-y border-sage">
          {features.map((feature) => (
            <li key={feature.title} className="py-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-serif text-xl text-forest">{feature.title}</h2>
                <span className="text-sm text-charcoal">
                  {feature.status === "available" ? "Available now" : "Arrives in a later phase"}
                </span>
              </div>
              <p className="mt-2 max-w-2xl leading-relaxed">{feature.description}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
