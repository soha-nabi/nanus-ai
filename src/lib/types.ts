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
