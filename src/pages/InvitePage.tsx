import { useParams } from "react-router-dom";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const cleanToken = token?.trim() ?? "";

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold text-forest sm:text-4xl">Invitation</h1>
        {cleanToken ? (
          <p className="mt-4 text-lg leading-relaxed">
            Invitation received. Accepting invitations arrives in the next phase; no access has been granted yet.
          </p>
        ) : (
          <p role="alert" className="mt-4 rounded-lg border-2 border-coral bg-white p-4 text-lg font-semibold">
            This invitation link is invalid.
          </p>
        )}
      </div>
    </main>
  );
}
