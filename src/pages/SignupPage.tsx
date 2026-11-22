import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { homeForRole } from "../routes/homeForRole";

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name (at least 2 characters)."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignupValues = z.infer<typeof signupSchema>;

const inputClass =
  "mt-2 block w-full min-h-12 rounded-lg border border-sage bg-white px-4 text-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-forest";
const buttonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-forest px-6 text-lg font-semibold text-ivory hover:bg-charcoal focus:outline-none focus:ring-2 focus:ring-coral disabled:cursor-not-allowed disabled:opacity-60";
const fieldErrorClass = "mt-2 text-base font-semibold text-charcoal";

export default function SignupPage() {
  const { user, membership, loading, isDemo, signUp } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  if (!loading && user) {
    return <Navigate to={membership ? homeForRole(membership.role) : "/app/setup"} replace />;
  }

  const onSubmit = async (values: SignupValues) => {
    setFormError(null);
    setConfirmationSent(false);
    try {
      const result = await signUp(values.email, values.password, values.fullName);
      if (result.needsConfirmation) setConfirmationSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create your account. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold text-forest sm:text-4xl">Create your account</h1>
        <p className="mt-2 text-lg">Care is love, made visible.</p>

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

        {confirmationSent && (
          <div role="status" className="mt-4 rounded-lg border border-sage bg-white p-4 text-lg">
            Check your email to confirm your account, then sign in.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
          <div>
            <label htmlFor="signup-name" className="block text-lg font-semibold">
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              className={inputClass}
              aria-invalid={errors.fullName ? "true" : "false"}
              aria-describedby={errors.fullName ? "signup-name-error" : undefined}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p id="signup-name-error" className={fieldErrorClass}>
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-lg font-semibold">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              className={inputClass}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "signup-email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="signup-email-error" className={fieldErrorClass}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-lg font-semibold">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "signup-password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="signup-password-error" className={fieldErrorClass}>
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="signup-confirm" className="block text-lg font-semibold">
              Confirm password
            </label>
            <input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              aria-invalid={errors.confirmPassword ? "true" : "false"}
              aria-describedby={errors.confirmPassword ? "signup-confirm-error" : undefined}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p id="signup-confirm-error" className={fieldErrorClass}>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className={buttonClass}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-lg">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-forest underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
