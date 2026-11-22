import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { homeForRole } from "../routes/homeForRole";

const setupSchema = z.object({
  familyName: z.string().trim().min(2, "Enter a family name (at least 2 characters)."),
  elderName: z.string().trim().min(2, "Enter the elder's name (at least 2 characters)."),
});

type SetupValues = z.infer<typeof setupSchema>;

const inputClass =
  "mt-2 block w-full min-h-12 rounded-lg border border-sage bg-white px-4 text-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-forest";
const buttonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-forest px-6 text-lg font-semibold text-ivory hover:bg-charcoal focus:outline-none focus:ring-2 focus:ring-coral disabled:cursor-not-allowed disabled:opacity-60";
const fieldErrorClass = "mt-2 text-base font-semibold text-charcoal";

export default function SetupPage() {
  const { membership, loading, isDemo, createFamily } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: { familyName: "", elderName: "" },
  });

  // Someone who already belongs to a family does not need setup.
  if (!loading && membership) {
    return <Navigate to={homeForRole(membership.role)} replace />;
  }

  const onSubmit = async (values: SetupValues) => {
    setFormError(null);
    try {
      await createFamily(values.familyName, values.elderName);
      // The creator of a new family is always its owner.
      navigate(homeForRole("owner"), { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create your family. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold text-forest sm:text-4xl">Create your family</h1>
        <p className="mt-2 text-lg">Give your family a name and tell us the elder&apos;s name.</p>

        {isDemo && (
          <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
            Demo mode — Supabase is not configured. Accounts are stored only in this browser.
          </p>
        )}

        {formError && (
          <div role="alert" className="mt-4 rounded-lg border-2 border-coral bg-white p-4 text-lg font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
          <div>
            <label htmlFor="setup-family" className="block text-lg font-semibold">
              Family name
            </label>
            <input
              id="setup-family"
              type="text"
              className={inputClass}
              aria-invalid={errors.familyName ? "true" : "false"}
              aria-describedby={errors.familyName ? "setup-family-error" : undefined}
              {...register("familyName")}
            />
            {errors.familyName && (
              <p id="setup-family-error" role="alert" className={fieldErrorClass}>
                {errors.familyName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="setup-elder" className="block text-lg font-semibold">
              Elder&apos;s display name
            </label>
            <input
              id="setup-elder"
              type="text"
              className={inputClass}
              aria-invalid={errors.elderName ? "true" : "false"}
              aria-describedby={errors.elderName ? "setup-elder-error" : undefined}
              {...register("elderName")}
            />
            {errors.elderName && (
              <p id="setup-elder-error" role="alert" className={fieldErrorClass}>
                {errors.elderName.message}
              </p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className={buttonClass}>
            {isSubmitting ? "Creating family…" : "Create family"}
          </button>
        </form>
      </div>
    </main>
  );
}
