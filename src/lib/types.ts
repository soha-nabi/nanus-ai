// Shared data types for the NANU'S AI data and auth layer.
// These mirror the Supabase tables (profiles, families, family_members, elder_profiles)
// and the local demo store, so both modes return the same shapes.

export type Role = "owner" | "family_member" | "caregiver" | "elder";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
}

export interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: Role;
  status: string;
  joined_at: string;
}

export interface ElderProfile {
  id: string;
  family_id: string;
  display_name: string;
  created_at: string;
}

/** The signed-in context: who is logged in and which family/elder they are attached to. */
export interface SessionContext {
  user: Profile;
  family: Family | null;
  membership: FamilyMember | null;
  elder: ElderProfile | null;
}

export type CareTaskCategory = "medication" | "appointment" | "household" | "health" | "other";
export type CareTaskPriority = "low" | "normal" | "high";
export type CareTaskStatus = "open" | "completed";

export interface CareTask {
  id: string;
  family_id: string;
  elder_id: string;
  title: string;
  description: string;
  category: CareTaskCategory;
  assigned_to: string | null;
  due_at: string | null;
  priority: CareTaskPriority;
  status: CareTaskStatus;
  completed_at: string | null;
  created_by: string;
  created_at: string;
}

export type InvitationStatus = "pending" | "accepted" | "revoked";

export interface Invitation {
  id: string;
  family_id: string;
  invited_email: string;
  assigned_role: Role;
  code: string;
  status: InvitationStatus;
  expires_at: string;
  created_by: string;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  family_id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  message: string;
  created_at: string;
}


// ---- Phase 3: medications, appointments, document metadata ----

export type MedicationStatus = "active" | "stopped";

export interface Medication {
  id: string;
  family_id: string;
  elder_id: string;
  name: string;
  instructions: string; // text as entered from the prescription
  frequency: string;
  scheduled_times: string[]; // "HH:MM"
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  prescriber: string | null;
  refill_date: string | null; // YYYY-MM-DD
  refill_responsible: string | null; // user id
  notes: string | null;
  status: MedicationStatus;
  created_by: string;
  created_at: string;
}

export type ParentConfirmation = "taken" | "skipped" | "unable_to_confirm";
export type CaregiverAssistance = "assisted" | "not_assisted";

/** One scheduled dose. Parent confirmation and caregiver assistance are stored separately. */
export interface MedicationEvent {
  id: string;
  medication_id: string;
  family_id: string;
  scheduled_at: string; // ISO
  parent_confirmation: ParentConfirmation | null;
  parent_confirmed_at: string | null; // ISO
  caregiver_assistance: CaregiverAssistance | null;
  caregiver_user_id: string | null;
  caregiver_recorded_at: string | null; // ISO
  notes: string | null;
}

export type AppointmentStatus = "scheduled" | "cancelled" | "completed";

export interface Appointment {
  id: string;
  family_id: string;
  elder_id: string;
  title: string;
  provider: string | null;
  location: string | null;
  scheduled_at: string; // ISO
  assigned_to: string | null; // user id
  status: AppointmentStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export type DocumentType = "prescription" | "report" | "other";

/** Document metadata only. No file bytes are stored in demo mode. */
export interface DocumentRecord {
  id: string;
  family_id: string;
  elder_id: string;
  title: string;
  document_type: DocumentType;
  document_date: string | null; // YYYY-MM-DD
  file_name: string;
  uploaded_by: string;
  created_at: string;
}

// ---- Phase 4: caregiver profiles, verification, shifts, activity ----

export type VerificationStatus = "not_submitted" | "submitted" | "pending_review" | "verified" | "rejected" | "expired";

/** One caregiver's profile within one family. Verification statuses are set by the family owner (demo only). */
export interface CaregiverProfile {
  id: string;
  user_id: string;
  family_id: string;
  experience: string | null;
  qualifications: string | null;
  contact_phone: string | null;
  emergency_contact: string | null;
  identity_status: VerificationStatus;
  reference_status: VerificationStatus;
  background_status: VerificationStatus;
  family_approval: "pending" | "approved" | "declined";
  created_at: string;
  updated_at: string;
}

export type CaregiverShiftStatus = "scheduled" | "checked_in" | "completed" | "missed";

export interface CaregiverShift {
  id: string;
  family_id: string;
  elder_id: string;
  caregiver_user_id: string;
  scheduled_start: string; // ISO
  scheduled_end: string; // ISO
  check_in_at: string | null; // ISO
  check_out_at: string | null; // ISO
  status: CaregiverShiftStatus;
  shift_notes: string | null;
  created_by: string;
  created_at: string;
}

export type CaregiverActivityType =
  | "task_completed"
  | "medication_assistance"
  | "check_in"
  | "check_out"
  | "report"
  | "handover";

/** A caregiver's own record of work. Check-in time alone is not treated as proof of care. */
export interface CaregiverActivityLog {
  id: string;
  family_id: string;
  caregiver_user_id: string;
  task_id: string | null;
  activity_type: CaregiverActivityType;
  description: string;
  evidence_name: string | null;
  disputed: boolean;
  created_at: string;
}


export type NotificationDeliveryStatus = "delivered" | "failed" | "pending";
export type ReminderKind = "medication_unconfirmed" | "shift_missed" | "task_overdue" | "appointment_upcoming" | "wellness_missed";
export type CareHandoverStatus = "draft" | "sent" | "acknowledged";

export interface Notification {
  id: string;
  family_id: string;
  user_id: string;
  event_type: string;
  title: string;
  message: string;
  dedupe_key: string;
  channel: "in_app";
  delivery_status: NotificationDeliveryStatus;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  event_type: string;
  enabled: boolean;
}

export interface HandoverSummary {
  generated_at: string;
  completed_tasks: { id: string; title: string }[];
  medication_confirmations: {
    medicine: string;
    scheduled_at: string;
    parent_confirmation: string | null;
    caregiver_assistance: string | null;
  }[];
  pending_tasks: { id: string; title: string; overdue: boolean }[];
  upcoming_appointments: { id: string; title: string; scheduled_at: string }[];
  caregiver_notes: string[];
  unresolved_issues: string[];
}

export interface CareHandover {
  id: string;
  family_id: string;
  elder_id: string;
  from_user_id: string;
  to_user_id: string | null;
  summary_json: HandoverSummary;
  status: CareHandoverStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface ReminderRule {
  id: string;
  family_id: string;
  kind: ReminderKind;
  minutes_before_or_after: number;
  escalate_to_user_id: string | null;
  enabled: boolean;
}

