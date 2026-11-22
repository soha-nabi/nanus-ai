import type {
  ActivityEvent,
  CareTask,
  CareTaskCategory,
  CareTaskPriority,
  ElderProfile,
  Family,
  FamilyMember,
  Invitation,
  Profile,
  Role,
} from "./types";

// DEMO MODE ONLY. Passwords in this store are kept in plain text in this browser's
// localStorage. They stay on this device and are NOT secure. Real accounts use Supabase Auth.
// Invitation codes in this store are also local and NOT secure: anyone with access to this
// browser's localStorage can read them. Real invitations must be issued by the backend.

export const DEMO_STORE_VERSION = 2;
const STORAGE_KEY = "nanus-demo-v1";
const MIN_PASSWORD_LENGTH = 6;
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Unambiguous alphabet: no 0/O, 1/I/L. 32 symbols divides 256 evenly, so bytes map without bias.
const INVITATION_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const INVITATION_CODE_LENGTH = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  care_tasks: CareTask[];
  invitations: Invitation[];
  activity_events: ActivityEvent[];
  session_user_id: string | null;
}

/** A care task plus its derived overdue flag (never stored). */
export interface TaskView extends CareTask {
  is_overdue: boolean;
}

/** A family member joined with the profile fields the members page needs. */
export type MemberView = FamilyMember & { full_name: string; email: string };

function emptyStore(): DemoStore {
  return {
    version: DEMO_STORE_VERSION,
    users: [],
    families: [],
    family_members: [],
    elder_profiles: [],
    care_tasks: [],
    invitations: [],
    activity_events: [],
    session_user_id: null,
  };
}

function readStore(): DemoStore {
  if (typeof window === "undefined" || !window.localStorage) return emptyStore();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStore();
  try {
    const parsed = JSON.parse(raw) as Partial<DemoStore>;
    // Version 1 data is migrated in place (new arrays default to []). Any other version is unknown, so start clean.
    if (parsed.version !== 1 && parsed.version !== DEMO_STORE_VERSION) return emptyStore();
    return {
      version: DEMO_STORE_VERSION,
      users: parsed.users ?? [],
      families: parsed.families ?? [],
      family_members: parsed.family_members ?? [],
      elder_profiles: parsed.elder_profiles ?? [],
      care_tasks: parsed.care_tasks ?? [],
      invitations: parsed.invitations ?? [],
      activity_events: parsed.activity_events ?? [],
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

/** Updates the elder's display name and records an "elder.updated" activity event. */
export function updateElderDisplayName(elderId: string, actorId: string, displayName: string): ElderProfile {
  const cleanName = displayName.trim();
  if (cleanName.length < 2) {
    throw new Error("Enter a display name of at least 2 characters.");
  }

  const store = readStore();
  const elder = store.elder_profiles.find((e) => e.id === elderId);
  if (!elder) {
    throw new Error("Elder profile not found.");
  }
  elder.display_name = cleanName;
  writeStore(store);

  addActivity({
    familyId: elder.family_id,
    actorId,
    action: "elder.updated",
    entityType: "elder",
    entityId: elder.id,
    message: `Updated the elder's display name to "${cleanName}".`,
  });
  return elder;
}


// ---- Care tasks ----

function compareDueAt(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1; // tasks without a due date sort last
  if (b === null) return -1;
  return Date.parse(a) - Date.parse(b);
}

export function createTask({
  familyId,
  elderId,
  actorId,
  title,
  description = "",
  category = "other",
  assignedTo = null,
  dueAt = null,
  priority = "normal",
}: {
  familyId: string;
  elderId: string;
  actorId: string;
  title: string;
  description?: string;
  category?: CareTaskCategory;
  assignedTo?: string | null;
  dueAt?: string | null;
  priority?: CareTaskPriority;
}): CareTask {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    throw new Error("Task title is required.");
  }

  let dueIso: string | null = null;
  if (dueAt && dueAt.trim()) {
    const parsed = Date.parse(dueAt);
    if (Number.isNaN(parsed)) {
      throw new Error("Enter a valid due date.");
    }
    dueIso = new Date(parsed).toISOString();
  }

  const store = readStore();
  const task: CareTask = {
    id: crypto.randomUUID(),
    family_id: familyId,
    elder_id: elderId,
    title: cleanTitle,
    description: description.trim(),
    category,
    assigned_to: assignedTo,
    due_at: dueIso,
    priority,
    status: "open",
    completed_at: null,
    created_by: actorId,
    created_at: new Date().toISOString(),
  };
  store.care_tasks.push(task);
  writeStore(store);

  addActivity({
    familyId,
    actorId,
    action: "task.created",
    entityType: "task",
    entityId: task.id,
    message: `Created task "${cleanTitle}".`,
  });
  return task;
}

/** Lists a family's tasks sorted by due date, then creation time. Overdue is derived at read time. */
export function listTasks(familyId: string): TaskView[] {
  const store = readStore();
  const now = Date.now();
  return store.care_tasks
    .filter((t) => t.family_id === familyId)
    .map((t) => ({
      ...t,
      is_overdue: t.status === "open" && t.due_at !== null && Date.parse(t.due_at) < now,
    }))
    .sort((a, b) => compareDueAt(a.due_at, b.due_at) || a.created_at.localeCompare(b.created_at));
}

export function completeTask(taskId: string, actorId: string): CareTask {
  const store = readStore();
  const task = store.care_tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new Error("Task not found.");
  }
  if (task.status === "completed") {
    return task; // already completed: nothing to change, no duplicate activity
  }

  task.status = "completed";
  task.completed_at = new Date().toISOString();
  writeStore(store);

  addActivity({
    familyId: task.family_id,
    actorId,
    action: "task.completed",
    entityType: "task",
    entityId: task.id,
    message: `Completed task "${task.title}".`,
  });
  return task;
}

// ---- Invitations ----
// DEMO MODE ONLY: invitation codes are generated and checked locally. They are not secure.

function generateInvitationCode(): string {
  const bytes = new Uint8Array(INVITATION_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) {
    code += INVITATION_ALPHABET[byte % INVITATION_ALPHABET.length];
  }
  return code;
}

export function createInvitation({
  familyId,
  actorId,
  invitedEmail,
  assignedRole,
}: {
  familyId: string;
  actorId: string;
  invitedEmail: string;
  assignedRole: Role;
}): Invitation {
  const cleanEmail = normalizeEmail(invitedEmail);
  if (!EMAIL_PATTERN.test(cleanEmail)) {
    throw new Error("Enter a valid email address.");
  }

  const store = readStore();
  const nowMs = Date.now();
  const invitation: Invitation = {
    id: crypto.randomUUID(),
    family_id: familyId,
    invited_email: cleanEmail,
    assigned_role: assignedRole,
    code: generateInvitationCode(),
    status: "pending",
    expires_at: new Date(nowMs + INVITATION_TTL_MS).toISOString(),
    created_by: actorId,
    created_at: new Date(nowMs).toISOString(),
  };
  store.invitations.push(invitation);
  writeStore(store);

  addActivity({
    familyId,
    actorId,
    action: "invitation.created",
    entityType: "invitation",
    entityId: invitation.id,
    message: `Invited ${cleanEmail} as ${assignedRole}.`,
  });
  return invitation;
}

export function listInvitations(familyId: string): Invitation[] {
  const store = readStore();
  return store.invitations.filter((i) => i.family_id === familyId);
}

/** Revokes a pending invitation. actorId is recorded in the activity log. */
export function revokeInvitation(invitationId: string, actorId: string): Invitation {
  const store = readStore();
  const invitation = store.invitations.find((i) => i.id === invitationId);
  if (!invitation) {
    throw new Error("Invitation not found.");
  }
  if (invitation.status === "accepted") {
    throw new Error("This invitation has already been accepted.");
  }
  if (invitation.status === "revoked") {
    return invitation;
  }

  invitation.status = "revoked";
  writeStore(store);

  addActivity({
    familyId: invitation.family_id,
    actorId,
    action: "invitation.revoked",
    entityType: "invitation",
    entityId: invitation.id,
    message: `Revoked the invitation for ${invitation.invited_email}.`,
  });
  return invitation;
}

export function acceptInvitation(code: string, userId: string): Family {
  const store = readStore();
  const cleanCode = code.trim().toUpperCase();
  const invitation = store.invitations.find((i) => i.code === cleanCode);
  if (!invitation) {
    throw new Error("This invitation code is not valid.");
  }
  if (invitation.status === "revoked") {
    throw new Error("This invitation has been revoked.");
  }
  if (invitation.status === "accepted") {
    throw new Error("This invitation has already been used.");
  }
  // Expiry is checked against the clock, not a stored status.
  if (Date.now() > Date.parse(invitation.expires_at)) {
    throw new Error("This invitation has expired.");
  }

  const family = store.families.find((f) => f.id === invitation.family_id);
  if (!family) {
    throw new Error("This invitation code is not valid.");
  }
  if (store.family_members.some((m) => m.family_id === family.id && m.user_id === userId)) {
    throw new Error("You are already a member of this family.");
  }

  const now = new Date().toISOString();
  store.family_members.push({
    id: crypto.randomUUID(),
    family_id: family.id,
    user_id: userId,
    role: invitation.assigned_role,
    status: "active",
    joined_at: now,
  });
  invitation.status = "accepted";
  writeStore(store);

  const user = store.users.find((u) => u.id === userId);
  addActivity({
    familyId: family.id,
    actorId: userId,
    action: "invitation.accepted",
    entityType: "invitation",
    entityId: invitation.id,
    message: `${user?.full_name || user?.email || "A new member"} joined the family.`,
  });
  return family;
}

// ---- Members ----

export function listMembers(familyId: string): MemberView[] {
  const store = readStore();
  return store.family_members
    .filter((m) => m.family_id === familyId)
    .map((m) => {
      const user = store.users.find((u) => u.id === m.user_id);
      return { ...m, full_name: user?.full_name ?? "", email: user?.email ?? "" };
    });
}

// ---- Activity ----

interface ActivityInput {
  familyId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  message: string;
}

export function addActivity({
  familyId,
  actorId,
  action,
  entityType,
  entityId,
  message,
}: ActivityInput): ActivityEvent {
  const store = readStore();
  const event: ActivityEvent = {
    id: crypto.randomUUID(),
    family_id: familyId,
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    message,
    created_at: new Date().toISOString(),
  };
  store.activity_events.push(event);
  writeStore(store);
  return event;
}

/** Newest first. The log is stored in insertion order, so reversing gives exact recency even for equal timestamps. */
export function listActivity(familyId: string): ActivityEvent[] {
  const store = readStore();
  return store.activity_events.filter((e) => e.family_id === familyId).reverse();
}
