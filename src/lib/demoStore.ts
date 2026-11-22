import type { ElderProfile, Family, FamilyMember, Profile } from "./types";

// DEMO MODE ONLY. Passwords in this store are kept in plain text in this browser's
// localStorage. They stay on this device and are NOT secure. Real accounts use Supabase Auth.

export const DEMO_STORE_VERSION = 1;
const STORAGE_KEY = "nanus-demo-v1";
const MIN_PASSWORD_LENGTH = 6;

export interface DemoUser {
  id: string;
  email: string;
  password: string; // demo only, see note above
  full_name: string;
}

interface DemoStore {
  version: number;
  users: DemoUser[];
  families: Family[];
  family_members: FamilyMember[];
  elder_profiles: ElderProfile[];
  session_user_id: string | null;
}

function emptyStore(): DemoStore {
  return {
    version: DEMO_STORE_VERSION,
    users: [],
    families: [],
    family_members: [],
    elder_profiles: [],
    session_user_id: null,
  };
}

function readStore(): DemoStore {
  if (typeof window === "undefined" || !window.localStorage) return emptyStore();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStore();
  try {
    const parsed = JSON.parse(raw) as Partial<DemoStore>;
    // A different version means the stored shape is unknown, so start clean.
    if (parsed.version !== DEMO_STORE_VERSION) return emptyStore();
    return {
      version: DEMO_STORE_VERSION,
      users: parsed.users ?? [],
      families: parsed.families ?? [],
      family_members: parsed.family_members ?? [],
      elder_profiles: parsed.elder_profiles ?? [],
      session_user_id: parsed.session_user_id ?? null,
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: DemoStore): void {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("Demo storage is not available in this browser.");
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toProfile(user: DemoUser): Profile {
  return { id: user.id, full_name: user.full_name, email: user.email };
}

export function signUp(email: string, password: string, fullName: string): Profile {
  const cleanEmail = normalizeEmail(email);
  const cleanName = fullName.trim();
  if (!cleanEmail || !password || !cleanName) {
    throw new Error("Please fill in your name, email and password.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const store = readStore();
  if (store.users.some((u) => u.email === cleanEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const user: DemoUser = {
    id: crypto.randomUUID(),
    email: cleanEmail,
    password,
    full_name: cleanName,
  };
  store.users.push(user);
  store.session_user_id = user.id;
  writeStore(store);
  return toProfile(user);
}

export function signIn(email: string, password: string): Profile {
  const cleanEmail = normalizeEmail(email);
  const store = readStore();
  const user = store.users.find((u) => u.email === cleanEmail && u.password === password);
  if (!user) {
    throw new Error("Email or password is incorrect.");
  }
  store.session_user_id = user.id;
  writeStore(store);
  return toProfile(user);
}

export function signOut(): void {
  const store = readStore();
  store.session_user_id = null;
  writeStore(store);
}

export function getCurrentUser(): Profile | null {
  const store = readStore();
  if (!store.session_user_id) return null;
  const user = store.users.find((u) => u.id === store.session_user_id);
  return user ? toProfile(user) : null;
}

export function createFamily({
  userId,
  familyName,
  elderName,
}: {
  userId: string;
  familyName: string;
  elderName: string;
}): Family {
  const cleanFamily = familyName.trim();
  const cleanElder = elderName.trim();
  if (!cleanFamily || !cleanElder) {
    throw new Error("Please enter a family name and the elder's name.");
  }

  const store = readStore();
  if (!store.users.some((u) => u.id === userId)) {
    throw new Error("You need to be signed in to create a family.");
  }

  const now = new Date().toISOString();
  const family: Family = {
    id: crypto.randomUUID(),
    name: cleanFamily,
    created_by: userId,
    created_at: now,
  };
  const membership: FamilyMember = {
    id: crypto.randomUUID(),
    family_id: family.id,
    user_id: userId,
    role: "owner",
    status: "active",
    joined_at: now,
  };
  const elder: ElderProfile = {
    id: crypto.randomUUID(),
    family_id: family.id,
    display_name: cleanElder,
    created_at: now,
  };

  store.families.push(family);
  store.family_members.push(membership);
  store.elder_profiles.push(elder);
  writeStore(store);
  return family;
}

export function getMembershipFor(userId: string): FamilyMember | null {
  const store = readStore();
  return store.family_members.find((m) => m.user_id === userId && m.status === "active") ?? null;
}

export function getFamily(familyId: string): Family | null {
  const store = readStore();
  return store.families.find((f) => f.id === familyId) ?? null;
}

export function getElderForFamily(familyId: string): ElderProfile | null {
  const store = readStore();
  return store.elder_profiles.find((e) => e.family_id === familyId) ?? null;
}
