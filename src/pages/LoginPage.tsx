import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { homeForRole } from "../routes/homeForRole";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

const inputClass =
  "mt-2 block w-full min-h-12 rounded-lg border border-sage bg-white px-4 text-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-forest";
const buttonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-forest px-6 text-lg font-semibold text-ivory hover:bg-charcoal focus:outline-none focus:ring-2 focus:ring-coral disabled:cursor-not-allowed disabled:opacity-60";
const fieldErrorClass = "mt-2 text-base font-semibold text-charcoal";

export default function LoginPage() {
  const { user, membership, loading, isDemo, signIn } = useAuth();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from;
    let target = "/app/setup";
    if (membership) {
      target = from && from.startsWith("/app/") ? from : homeForRole(membership.role);
    }
    return <Navigate to={target} replace />;
  }

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not sign you in. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold text-forest sm:text-4xl">Sign in</h1>
        <p className="mt-2 text-lg">Welcome back to NANU&apos;S AI.</p>

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
            <label htmlFor="login-email" className="block text-lg font-semibold">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className={inputClass}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="login-email-error" className={fieldErrorClass}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="login-password" className="block text-lg font-semibold">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className={inputClass}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="login-password-error" className={fieldErrorClass}>
                {errors.password.message}
              </p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className={buttonClass}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-lg">
          New to NANU&apos;S AI?{" "}
          <Link to="/signup" className="font-semibold text-forest underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
