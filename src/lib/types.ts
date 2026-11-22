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
