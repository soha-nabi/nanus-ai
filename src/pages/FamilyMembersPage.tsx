import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthContext";
import {
  createInvitation,
  listInvitations,
  listMembers,
  revokeInvitation,
  type MemberView,
} from "../lib/demoStore";
import type { Invitation, Role } from "../lib/types";

const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  family_member: "Family member",
  caregiver: "Caregiver",
  elder: "Elder",
};

const INVITABLE_ROLES = ["family_member", "caregiver"] as const;

const emailSchema = z.string().trim().email("Enter a valid email address.");

const inviteSchema = z.object({
  email: emailSchema,
  role: z.enum(INVITABLE_ROLES),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString();
}

export default function FamilyMembersPage() {
  const { user, family, membership, isDemo } = useAuth();
  const [members, setMembers] = useState<MemberView[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const familyId = family?.id ?? null;
  const isOwner = membership?.role === "owner";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    defaultValues: { email: "", role: "family_member" },
  });

  const reload = useCallback(() => {
    if (!familyId) return;
    setMembers(listMembers(familyId));
    setInvitations(listInvitations(familyId));
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!family || !user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Family members</h1>
          <p className="mt-4 text-lg leading-relaxed">Create or join a family to see its members.</p>
        </div>
      </main>
    );
  }

  const onInvite = (values: InviteFormValues) => {
    setInviteError(null);
    setCreatedCode(null);
    try {
      const invitation = createInvitation({
        familyId: family.id,
        actorId: user.id,
        invitedEmail: values.email,
        assignedRole: values.role,
      });
      setCreatedCode(invitation.code);
      reset({ email: "", role: values.role });
      reload();
    } catch (err) {
      setInviteError(errorMessage(err));
    }
  };

  const onRevoke = (invitationId: string) => {
    setRevokeError(null);
    try {
      revokeInvitation(invitationId, user.id);
      reload();
    } catch (err) {
      setRevokeError(errorMessage(err));
    }
  };

  const inputClass =
    "mt-2 block min-h-12 w-full rounded-lg border border-sage bg-white px-4 py-3 text-lg text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest";

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Family members</h1>
          <p className="mt-2 text-lg leading-relaxed">{family.name}</p>
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode: members and invitations are stored only in this browser.
            </p>
          )}
        </header>

        <section aria-labelledby="members-heading" className="space-y-4">
          <h2 id="members-heading" className="text-2xl font-semibold text-forest">
            Members
          </h2>
          {members.length === 0 ? (
            <p className="rounded-lg border border-sage bg-white p-4 text-base">No members yet.</p>
          ) : (
            <ul className="space-y-3">
              {members.map((m) => (
                <li key={m.id} className="rounded-lg border border-sage bg-white p-4">
                  <p className="text-lg font-semibold">{m.full_name || "Unnamed member"}</p>
                  <p className="text-base break-all">{m.email}</p>
                  <p className="mt-1 text-base">
                    {ROLE_LABELS[m.role]} · {m.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isOwner ? (
          <section aria-labelledby="invite-heading" className="space-y-4">
            <h2 id="invite-heading" className="text-2xl font-semibold text-forest">
              Invite someone
            </h2>
            <form
              onSubmit={handleSubmit(onInvite)}
              noValidate
              className="space-y-4 rounded-lg border border-sage bg-white p-4"
            >
              <div>
                <label htmlFor="invite-email" className="text-lg font-semibold">
                  Email address
                </label>
                <input
                  id="invite-email"
                  type="email"
                  autoComplete="off"
                  className={inputClass}
                  aria-invalid={errors.email ? "true" : "false"}
                  {...register("email", {
                    validate: (value) => {
                      const result = emailSchema.safeParse(value);
                      return result.success || result.error.issues[0]?.message || "Enter a valid email address.";
                    },
                  })}
                />
                {errors.email && (
                  <p role="alert" className="mt-2 text-base text-forest">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="invite-role" className="text-lg font-semibold">
                  Role
                </label>
                <select id="invite-role" className={inputClass} {...register("role")}>
                  <option value="family_member">Family member</option>
                  <option value="caregiver">Caregiver</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal disabled:opacity-60"
              >
                Create invitation code
              </button>

              {inviteError && (
                <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
                  {inviteError}
                </p>
              )}
            </form>

            {createdCode && (
              <div
                role="status"
                aria-label="New invitation code"
                className="rounded-lg border-2 border-forest bg-white p-4 space-y-2"
              >
                <p className="text-lg font-semibold text-forest">Invitation code</p>
                <p className="font-mono text-2xl font-bold tracking-widest break-all">{createdCode}</p>
                <p className="text-base">
                  Share this code with them. In demo mode codes are stored only in this browser.
                </p>
              </div>
            )}
          </section>
        ) : (
          <p className="rounded-lg border border-sage bg-white p-4 text-base">
            Only the family owner can invite or revoke members.
          </p>
        )}

        <section aria-labelledby="invitations-heading" className="space-y-4">
          <h2 id="invitations-heading" className="text-2xl font-semibold text-forest">
            Invitations
          </h2>
          {revokeError && (
            <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
              {revokeError}
            </p>
          )}
          {invitations.length === 0 ? (
            <p className="rounded-lg border border-sage bg-white p-4 text-base">No invitations yet.</p>
          ) : (
            <ul className="space-y-3">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-col gap-3 rounded-lg border border-sage bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-lg font-semibold break-all">{inv.invited_email}</p>
                    <p className="text-base">
                      {ROLE_LABELS[inv.assigned_role]} · {inv.status} · expires {formatDate(inv.expires_at)}
                    </p>
                  </div>
                  {isOwner && inv.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => onRevoke(inv.id)}
                      className="min-h-12 rounded-lg border border-forest px-6 py-3 text-lg font-semibold text-forest hover:bg-sage hover:text-charcoal"
                    >
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
