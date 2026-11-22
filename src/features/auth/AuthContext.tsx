import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import * as demo from "../../lib/demoStore";
import type { ElderProfile, Family, FamilyMember, Profile, SessionContext } from "../../lib/types";

type SupabaseSource = NonNullable<typeof supabase>;

interface AuthSnapshot {
  user: SessionContext["user"] | null;
  family: Family | null;
  membership: FamilyMember | null;
  elder: ElderProfile | null;
}

type MembershipRow = FamilyMember & { families: Family | null };

export interface SignUpResult {
  /** True when Supabase created the account but needs email confirmation before sign-in. */
  needsConfirmation: boolean;
}

export interface AuthContextValue extends AuthSnapshot {
  loading: boolean;
  isDemo: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createFamily: (familyName: string, elderName: string) => Promise<Family>;
  refresh: () => Promise<void>;
}

const EMPTY_SNAPSHOT: AuthSnapshot = { user: null, family: null, membership: null, elder: null };

const AuthContext = createContext<AuthContextValue | null>(null);

function toError(err: unknown, fallback: string): Error {
  if (err instanceof Error && err.message) return err;
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string" && err.message) {
    return new Error(err.message);
  }
  return new Error(fallback);
}

function loadDemoSnapshot(): AuthSnapshot {
  const user = demo.getCurrentUser();
  if (!user) return EMPTY_SNAPSHOT;
  const membership = demo.getMembershipFor(user.id);
  const family = membership ? demo.getFamily(membership.family_id) : null;
  const elder = family ? demo.getElderForFamily(family.id) : null;
  return { user, family, membership, elder };
}

// Returns the profile row, creating it from auth data if it is missing (e.g. first sign-in after signup).
async function ensureProfile(client: SupabaseSource, authUser: User): Promise<Profile> {
  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", authUser.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data as Profile;

  const rawName = authUser.user_metadata["full_name"];
  const profile: Profile = {
    id: authUser.id,
    full_name: typeof rawName === "string" ? rawName : "",
    email: authUser.email ?? "",
  };
  const { error: upsertError } = await client.from("profiles").upsert(profile);
  if (upsertError) throw new Error(upsertError.message);
  return profile;
}

async function loadSupabaseSnapshot(client: SupabaseSource): Promise<AuthSnapshot> {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  const authUser = sessionData.session?.user;
  if (!authUser) return EMPTY_SNAPSHOT;

  const user = await ensureProfile(client, authUser);

  const { data: memberData, error: memberError } = await client
    .from("family_members")
    .select("id, family_id, user_id, role, status, joined_at, families(id, name, created_by, created_at)")
    .eq("user_id", authUser.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (memberError) throw new Error(memberError.message);

  const row = memberData as MembershipRow | null;
  if (!row) return { user, family: null, membership: null, elder: null };

  const { families, ...membership } = row;
  const family = families ?? null;

  let elder: ElderProfile | null = null;
  if (family) {
    const { data: elderData, error: elderError } = await client
      .from("elder_profiles")
      .select("id, family_id, display_name, created_at")
      .eq("family_id", family.id)
      .limit(1)
      .maybeSingle();
    if (elderError) throw new Error(elderError.message);
    elder = (elderData as ElderProfile | null) ?? null;
  }

  return { user, family, membership, elder };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AuthSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async (): Promise<void> => {
    if (!supabase) {
      setSnapshot(loadDemoSnapshot());
      return;
    }
    setSnapshot(await loadSupabaseSnapshot(supabase));
  }, []);

  useEffect(() => {
    let active = true;

    refresh()
      .catch((err: unknown) => {
        console.error("Could not load session:", toError(err, "Unknown error"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    let unsubscribe: (() => void) | undefined;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(() => {
        // Defer so Supabase's auth lock is released before we query tables.
        setTimeout(() => {
          refresh().catch((err: unknown) => {
            console.error("Could not refresh session:", toError(err, "Unknown error"));
          });
        }, 0);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [refresh]);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string): Promise<SignUpResult> => {
      if (!supabase) {
        demo.signUp(email, password, fullName);
        await refresh();
        return { needsConfirmation: false };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) throw toError(error, "Could not create your account.");
      if (!data.user) throw new Error("Could not create your account. Please try again.");
      // Supabase returns a user with no identities when the email is already registered.
      if (data.user.identities && data.user.identities.length === 0) {
        throw new Error("An account with this email already exists.");
      }
      if (!data.session) {
        // Account exists but is unconfirmed; the profile is created on first sign-in.
        return { needsConfirmation: true };
      }

      await refresh();
      return { needsConfirmation: false };
    },
    [refresh],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      if (!supabase) {
        demo.signIn(email, password);
        await refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        const message = toError(error, "Could not sign you in.").message;
        throw new Error(
          message.includes("Invalid login credentials") ? "Email or password is incorrect." : message,
        );
      }
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async (): Promise<void> => {
    if (!supabase) {
      demo.signOut();
    } else {
      const { error } = await supabase.auth.signOut();
      if (error) throw toError(error, "Could not sign you out.");
    }
    await refresh();
  }, [refresh]);

  const createFamily = useCallback(
    async (familyName: string, elderName: string): Promise<Family> => {
      if (!supabase) {
        const current = demo.getCurrentUser();
        if (!current) throw new Error("Please sign in before creating a family.");
        const family = demo.createFamily({ userId: current.id, familyName, elderName });
        await refresh();
        return family;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw toError(sessionError, "Could not read your session.");
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("Please sign in before creating a family.");

      const cleanFamily = familyName.trim();
      const cleanElder = elderName.trim();
      if (!cleanFamily || !cleanElder) {
        throw new Error("Please enter a family name and the elder's name.");
      }

      const { data: familyRow, error: familyError } = await supabase
        .from("families")
        .insert({ name: cleanFamily, created_by: userId })
        .select("id, name, created_by, created_at")
        .single();
      if (familyError) throw new Error(familyError.message);
      const family = familyRow as Family;

      // Best-effort cleanup so a failed step does not leave a half-built family behind.
      const rollback = async (): Promise<void> => {
        await supabase!.from("families").delete().eq("id", family.id);
      };

      const { error: memberError } = await supabase
        .from("family_members")
        .insert({ family_id: family.id, user_id: userId, role: "owner", status: "active" });
      if (memberError) {
        await rollback();
        throw new Error(memberError.message);
      }

      const { error: elderError } = await supabase
        .from("elder_profiles")
        .insert({ family_id: family.id, display_name: cleanElder });
      if (elderError) {
        await rollback();
        throw new Error(elderError.message);
      }

      await refresh();
      return family;
    },
    [refresh],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ...snapshot,
      loading,
      isDemo: !isSupabaseConfigured,
      signUp,
      signIn,
      signOut,
      createFamily,
      refresh,
    }),
    [snapshot, loading, signUp, signIn, signOut, createFamily, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return ctx;
}
