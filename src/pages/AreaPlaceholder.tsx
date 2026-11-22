interface AreaPlaceholderProps {
  title: string;
  description: string;
}

export default function AreaPlaceholder({ title, description }: AreaPlaceholderProps) {
  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-forest sm:text-4xl">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed">{description}</p>
        <p className="mt-6 rounded-lg border border-sage bg-white p-4 text-base">
          This feature arrives in a later phase.
        </p>
      </div>
    </main>
  );
}
