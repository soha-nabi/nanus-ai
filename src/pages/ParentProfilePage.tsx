import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthContext";
import { updateElderDisplayName } from "../lib/demoStore";

const displayNameSchema = z.string().trim().min(2, "Display name must be at least 2 characters.");

const profileSchema = z.object({
  displayName: displayNameSchema,
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

export default function ParentProfilePage() {
  const { user, family, elder, membership, isDemo, refresh } = useAuth();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean>(false);

  const canEdit = membership?.role === "owner" || membership?.role === "family_member";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      displayName: elder?.display_name ?? "",
    },
  });

  if (!family || !user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Parent profile</h1>
          <p className="mt-4 text-lg leading-relaxed">Create or join a family to see its parent profile.</p>
        </div>
      </main>
    );
  }

  const onSave = async (values: ProfileFormValues) => {
    setSaveError(null);
    setSaved(false);
    try {
      if (!elder) {
        throw new Error("No parent profile yet.");
      }
      updateElderDisplayName(elder.id, user.id, values.displayName);
      await refresh();
      reset({ displayName: values.displayName.trim() });
      setSaved(true);
    } catch (err) {
      setSaveError(errorMessage(err));
    }
  };

  const inputClass =
    "mt-2 block min-h-12 w-full rounded-lg border border-sage bg-white px-4 py-3 text-lg text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest";
  const sectionClass = "space-y-4";
  const cardClass = "space-y-3 rounded-lg border border-sage bg-white p-4 text-base";

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Parent profile</h1>
          <p className="mt-2 text-lg leading-relaxed">{family.name}</p>
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode — data is stored only in this browser.
            </p>
          )}
        </header>

        <section aria-labelledby="details-heading" className={sectionClass}>
          <h2 id="details-heading" className="text-2xl font-semibold text-forest">
            Details
          </h2>
          {!elder ? (
            <p className={cardClass}>No parent profile yet.</p>
          ) : (
            <dl className={cardClass}>
              <div>
                <dt className="inline font-semibold">Family: </dt>
                <dd className="inline">{family.name}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Display name: </dt>
                <dd className="inline">{elder.display_name}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Created: </dt>
                <dd className="inline">{formatDateTime(elder.created_at)}</dd>
              </div>
            </dl>
          )}
        </section>

        {canEdit && elder ? (
          <section aria-labelledby="edit-heading" className={sectionClass}>
            <h2 id="edit-heading" className="text-2xl font-semibold text-forest">
              Edit display name
            </h2>

            {saveError && (
              <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
                {saveError}
              </p>
            )}
            {saved && !saveError && (
              <p role="status" className="rounded-lg border border-sage bg-white p-4 text-base">
                Display name saved.
              </p>
            )}

            <form
              onSubmit={handleSubmit(onSave)}
              noValidate
              className="space-y-4 rounded-lg border border-sage bg-white p-4"
            >
              <div>
                <label htmlFor="parent-display-name" className="text-lg font-semibold">
                  Display name
                </label>
                <input
                  id="parent-display-name"
                  type="text"
                  autoComplete="off"
                  className={inputClass}
                  aria-invalid={errors.displayName ? "true" : "false"}
                  aria-describedby={errors.displayName ? "parent-display-name-error" : undefined}
                  {...register("displayName", {
                    validate: (value) => {
                      const result = displayNameSchema.safeParse(value);
                      return result.success || result.error.issues[0]?.message || "Enter a display name.";
                    },
                  })}
                />
                {errors.displayName && (
                  <p id="parent-display-name-error" role="alert" className="mt-2 text-base text-forest">
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting ? "Saving..." : "Save display name"}
              </button>
            </form>
          </section>
        ) : (
          elder && (
            <p className="rounded-lg border border-sage bg-white p-4 text-base">
              Only family owners and members can edit the parent profile.
            </p>
          )
        )}
      </div>
    </main>
  );
}
