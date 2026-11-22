import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthContext";
import {
  createAppointment,
  listAppointments,
  listMembers,
  updateAppointmentStatus,
  type AppointmentView,
  type MemberView,
} from "../lib/demoStore";
import type { AppointmentStatus } from "../lib/types";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

const titleSchema = z.string().trim().min(3, "Title must be at least 3 characters.");
const scheduledAtSchema = z.string().min(1, "Enter a date and time.");

const appointmentSchema = z.object({
  title: titleSchema,
  provider: z.string(),
  location: z.string(),
  scheduledAt: scheduledAtSchema,
  assignedTo: z.string(),
  notes: z.string(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function memberLabel(m: MemberView): string {
  return m.full_name || m.email || "Unnamed member";
}

interface AppointmentItemProps {
  appointment: AppointmentView;
  attendeeName: string;
  canManage: boolean;
  onStatus: (appointmentId: string, status: Extract<AppointmentStatus, "cancelled" | "completed">) => void;
}

function AppointmentItem({ appointment, attendeeName, canManage, onStatus }: AppointmentItemProps) {
  const isScheduled = appointment.status === "scheduled";

  return (
    <li className="space-y-2 rounded-lg border border-sage bg-white p-4">
      <p className="text-lg font-semibold break-words">{appointment.title}</p>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-base sm:grid-cols-2">
        <div>
          <dt className="inline font-semibold">Provider: </dt>
          <dd className="inline">{appointment.provider ?? "Not recorded"}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Location: </dt>
          <dd className="inline">{appointment.location ?? "Not recorded"}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">When: </dt>
          <dd className="inline">{formatDateTime(appointment.scheduled_at)}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Attending: </dt>
          <dd className="inline">{attendeeName}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Status: </dt>
          <dd className="inline">{STATUS_LABELS[appointment.status]}</dd>
        </div>
      </dl>
      {appointment.notes && <p className="text-base break-words">{appointment.notes}</p>}
      {isScheduled && canManage && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onStatus(appointment.id, "completed")}
            aria-label={`Mark ${appointment.title} as completed`}
            className="min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal sm:w-auto"
          >
            Mark completed
          </button>
          <button
            type="button"
            onClick={() => onStatus(appointment.id, "cancelled")}
            aria-label={`Cancel appointment ${appointment.title}`}
            className="min-h-12 w-full rounded-lg border border-forest bg-white px-6 py-3 text-lg font-semibold text-forest hover:bg-sage hover:text-charcoal sm:w-auto"
          >
            Cancel appointment
          </button>
        </div>
      )}
    </li>
  );
}

export default function AppointmentsPage() {
  const { user, family, elder, membership, isDemo } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentView[]>([]);
  const [members, setMembers] = useState<MemberView[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const familyId = family?.id ?? null;
  const canManage = membership?.role === "owner" || membership?.role === "family_member";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    defaultValues: {
      title: "",
      provider: "",
      location: "",
      scheduledAt: "",
      assignedTo: "",
      notes: "",
    },
  });

  const reload = useCallback(() => {
    if (!familyId) return;
    setAppointments(listAppointments(familyId));
    setMembers(listMembers(familyId));
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!family || !user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Appointments</h1>
          <p className="mt-4 text-lg leading-relaxed">Create or join a family to see its appointments.</p>
        </div>
      </main>
    );
  }

  const nameById = new Map<string, string>();
  for (const m of members) nameById.set(m.user_id, memberLabel(m));

  const attendeeNameFor = (assignedTo: string | null): string => {
    if (!assignedTo) return "Unassigned";
    return nameById.get(assignedTo) ?? "Unknown member";
  };

  const upcoming = appointments.filter((a) => !a.is_past);
  const past = appointments.filter((a) => a.is_past);

  const onCreate = (values: AppointmentFormValues) => {
    setCreateError(null);
    try {
      if (!elder) {
        throw new Error("Add the elder's profile before adding appointments.");
      }
      createAppointment({
        familyId: family.id,
        elderId: elder.id,
        actorId: user.id,
        title: values.title,
        provider: values.provider,
        location: values.location,
        scheduledAt: values.scheduledAt,
        assignedTo: values.assignedTo || null,
        notes: values.notes,
      });
      reset();
      reload();
    } catch (err) {
      setCreateError(errorMessage(err));
    }
  };

  const onStatus = (appointmentId: string, status: Extract<AppointmentStatus, "cancelled" | "completed">) => {
    setActionError(null);
    try {
      updateAppointmentStatus(appointmentId, user.id, status);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const inputClass =
    "mt-2 block min-h-12 w-full rounded-lg border border-sage bg-white px-4 py-3 text-lg text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest";

  const sectionClass = "space-y-4";
  const emptyClass = "rounded-lg border border-sage bg-white p-4 text-base";

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Appointments</h1>
          <p className="mt-2 text-lg leading-relaxed">{family.name}</p>
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode: appointments are stored only in this browser.
            </p>
          )}
        </header>

        {actionError && (
          <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
            {actionError}
          </p>
        )}

        {appointments.length === 0 && <p className={emptyClass}>No appointments yet.</p>}

        <section aria-labelledby="upcoming-heading" className={sectionClass}>
          <h2 id="upcoming-heading" className="text-2xl font-semibold text-forest">
            Upcoming
          </h2>
          {upcoming.length === 0 ? (
            <p className={emptyClass}>No upcoming appointments.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((appointment) => (
                <AppointmentItem
                  key={appointment.id}
                  appointment={appointment}
                  attendeeName={attendeeNameFor(appointment.assigned_to)}
                  canManage={canManage}
                  onStatus={onStatus}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="past-heading" className={sectionClass}>
          <h2 id="past-heading" className="text-2xl font-semibold text-forest">
            Past
          </h2>
          {past.length === 0 ? (
            <p className={emptyClass}>No past appointments.</p>
          ) : (
            <ul className="space-y-3">
              {past.map((appointment) => (
                <AppointmentItem
                  key={appointment.id}
                  appointment={appointment}
                  attendeeName={attendeeNameFor(appointment.assigned_to)}
                  canManage={canManage}
                  onStatus={onStatus}
                />
              ))}
            </ul>
          )}
        </section>

        {canManage ? (
          <section aria-labelledby="create-heading" className={sectionClass}>
            <h2 id="create-heading" className="text-2xl font-semibold text-forest">
              Add an appointment
            </h2>
            <form
              onSubmit={handleSubmit(onCreate)}
              noValidate
              className="space-y-4 rounded-lg border border-sage bg-white p-4"
            >
              <div>
                <label htmlFor="appointment-title" className="text-lg font-semibold">
                  Title
                </label>
                <input
                  id="appointment-title"
                  type="text"
                  autoComplete="off"
                  className={inputClass}
                  aria-invalid={errors.title ? "true" : "false"}
                  aria-describedby={errors.title ? "appointment-title-error" : undefined}
                  {...register("title", {
                    validate: (value) => {
                      const result = titleSchema.safeParse(value);
                      return result.success || result.error.issues[0]?.message || "Enter an appointment title.";
                    },
                  })}
                />
                {errors.title && (
                  <p id="appointment-title-error" role="alert" className="mt-2 text-base text-forest">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="appointment-provider" className="text-lg font-semibold">
                  Provider (optional)
                </label>
                <input
                  id="appointment-provider"
                  type="text"
                  autoComplete="off"
                  className={inputClass}
                  {...register("provider")}
                />
              </div>

              <div>
                <label htmlFor="appointment-location" className="text-lg font-semibold">
                  Location (optional)
                </label>
                <input
                  id="appointment-location"
                  type="text"
                  autoComplete="off"
                  className={inputClass}
                  {...register("location")}
                />
              </div>

              <div>
                <label htmlFor="appointment-when" className="text-lg font-semibold">
                  Date and time
                </label>
                <input
                  id="appointment-when"
                  type="datetime-local"
                  className={inputClass}
                  aria-invalid={errors.scheduledAt ? "true" : "false"}
                  aria-describedby={errors.scheduledAt ? "appointment-when-error" : undefined}
                  {...register("scheduledAt", {
                    validate: (value) => {
                      const result = scheduledAtSchema.safeParse(value);
                      return result.success || result.error.issues[0]?.message || "Enter a date and time.";
                    },
                  })}
                />
                {errors.scheduledAt && (
                  <p id="appointment-when-error" role="alert" className="mt-2 text-base text-forest">
                    {errors.scheduledAt.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="appointment-attendee" className="text-lg font-semibold">
                  Attending (optional)
                </label>
                <select id="appointment-attendee" className={inputClass} {...register("assignedTo")}>
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.user_id}>
                      {memberLabel(m)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="appointment-notes" className="text-lg font-semibold">
                  Notes (optional)
                </label>
                <textarea id="appointment-notes" rows={3} className={inputClass} {...register("notes")} />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal disabled:opacity-60"
              >
                Add appointment
              </button>

              {createError && (
                <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
                  {createError}
                </p>
              )}
            </form>
          </section>
        ) : (
          <p className={emptyClass}>Only the family owner or a family member can add appointments.</p>
        )}
      </div>
    </main>
  );
}
