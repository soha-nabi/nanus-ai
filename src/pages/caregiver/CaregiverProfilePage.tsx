import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../features/auth/AuthContext";
import DemoRoleSwitcher from "../../components/DemoRoleSwitcher";
import CaregiverNav from "../../components/CaregiverNav";
import {
  getCaregiverProfile,
  getFamily,
  listAssignedElders,
  upsertCaregiverProfile,
} from "../../lib/demoStore";
import type { CaregiverProfile, VerificationStatus } from "../../lib/types";

const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  not_submitted: "Not submitted",
  submitted: "Submitted",
  pending_review: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
  expired: "Expired",
};

const APPROVAL_LABELS: Record<CaregiverProfile["family_approval"], string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
};

const VERIFICATION_NOTE =
  "Identity and background checks are completed only through an authorised verification process. Nanu's AI does not mark them complete.";

interface FamilyOption {
  id: string;
  name: string;
}

interface ProfileFormValues {
  familyId: string;
  experience: string;
  qualifications: string;
  contactPhone: string;
  emergencyContact: string;
}

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

/** Families this caregiver is assigned to (approved and active). */
function loadFamilies(userId: string | null): FamilyOption[] {
  if (!userId) return [];
  const familyIds = Array.from(new Set(listAssignedElders(userId).map((e) => e.family_id)));
  return familyIds.map((id) => ({ id, name: getFamily(id)?.name ?? "Family" }));
}

function valuesFor(familyId: string, profile: CaregiverProfile | null): ProfileFormValues {
  return {
    familyId,
    experience: profile?.experience ?? "",
    qualifications: profile?.qualifications ?? "",
    contactPhone: profile?.contact_phone ?? "",
    emergencyContact: profile?.emergency_contact ?? "",
  };
}

export default function CaregiverProfilePage() {
  const { user, isDemo } = useAuth();
  const [families] = useState<FamilyOption[]>(() => loadFamilies(user?.id ?? null));
  const [profile, setProfile] = useState<CaregiverProfile | null>(() => {
    const first = families[0]?.id;
    return first && user ? getCaregiverProfile(first, user.id) : null;
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: valuesFor(families[0]?.id ?? "", profile),
  });

  if (!user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">My profile</h1>
          <p className="mt-4 text-lg leading-relaxed">Sign in to see your caregiver profile.</p>
        </div>
      </main>
    );
  }

  const onFamilyChange = (familyId: string) => {
    setSaveError(null);
    setSavedMessage(null);
    const next = getCaregiverProfile(familyId, user.id);
    setProfile(next);
    reset(valuesFor(familyId, next));
  };

  const onSubmit = (values: ProfileFormValues) => {
    setSaveError(null);
    setSavedMessage(null);
    try {
      const saved = upsertCaregiverProfile({
        familyId: values.familyId,
        userId: user.id,
        experience: values.experience,
        qualifications: values.qualifications,
        contactPhone: values.contactPhone,
        emergencyContact: values.emergencyContact,
      });
      setProfile(saved);
      setSavedMessage("Profile saved.");
    } catch (err) {
      setSaveError(errorMessage(err));
    }
  };

  const inputClass =
    "mt-2 block min-h-12 w-full rounded-lg border border-sage bg-white px-4 py-3 text-lg text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest";
  const emptyClass = "rounded-lg border border-sage bg-white p-4 text-base";
  const buttonClass =
    "min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal disabled:opacity-60 sm:w-auto";

  const identityStatus = profile?.identity_status ?? "not_submitted";
  const referenceStatus = profile?.reference_status ?? "not_submitted";
  const backgroundStatus = profile?.background_status ?? "not_submitted";
  const approvalStatus = profile?.family_approval ?? "pending";

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DemoRoleSwitcher />
      <CaregiverNav />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest/70">
            Caregiver Profile & Credentials
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-forest">My Profile</h1>
          {isDemo && (
            <p className="mt-2 text-xs text-charcoal/60">
              Demo mode — credentials and contact details stored for this simulation.
            </p>
          )}
        </header>

        <section aria-labelledby="checks-heading" className="space-y-4">
          <h2 id="checks-heading" className="text-2xl font-semibold text-forest">
            Verification and family approval
          </h2>
          <dl className="space-y-2 rounded-lg border border-sage bg-white p-4 text-base">
            <div>
              <dt className="inline font-semibold">Identity: </dt>
              <dd className="inline">{VERIFICATION_LABELS[identityStatus]}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Reference: </dt>
              <dd className="inline">{VERIFICATION_LABELS[referenceStatus]}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Background: </dt>
              <dd className="inline">{VERIFICATION_LABELS[backgroundStatus]}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Family approval: </dt>
              <dd className="inline">{APPROVAL_LABELS[approvalStatus]}</dd>
            </div>
          </dl>
          <p className="rounded-lg border border-sage bg-white p-4 text-base">{VERIFICATION_NOTE}</p>
        </section>

        <section aria-labelledby="profile-heading" className="space-y-4">
          <h2 id="profile-heading" className="text-2xl font-semibold text-forest">
            Your details
          </h2>

          {families.length === 0 ? (
            <p className={emptyClass}>
              You are not assigned to any family yet. Assignments appear once the family approves you.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4 rounded-lg border border-sage bg-white p-4"
            >
              <div>
                <label htmlFor="profile-family" className="text-lg font-semibold">
                  Family
                </label>
                <select
                  id="profile-family"
                  className={inputClass}
                  {...register("familyId", { onChange: (e) => onFamilyChange(e.target.value) })}
                >
                  {families.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="profile-experience" className="text-lg font-semibold">
                  Experience
                </label>
                <textarea id="profile-experience" rows={3} className={inputClass} {...register("experience")} />
              </div>

              <div>
                <label htmlFor="profile-qualifications" className="text-lg font-semibold">
                  Qualifications
                </label>
                <textarea
                  id="profile-qualifications"
                  rows={3}
                  className={inputClass}
                  {...register("qualifications")}
                />
              </div>

              <div>
                <label htmlFor="profile-phone" className="text-lg font-semibold">
                  Contact phone
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  className={inputClass}
                  {...register("contactPhone")}
                />
              </div>

              <div>
                <label htmlFor="profile-emergency" className="text-lg font-semibold">
                  Emergency contact
                </label>
                <textarea
                  id="profile-emergency"
                  rows={2}
                  className={inputClass}
                  {...register("emergencyContact")}
                />
              </div>

              <button type="submit" disabled={isSubmitting} className={buttonClass}>
                Save profile
              </button>

              {saveError && (
                <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
                  {saveError}
                </p>
              )}
              {savedMessage && <p className="text-base">{savedMessage}</p>}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
