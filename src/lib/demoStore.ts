import type {
  ActivityEvent,
  Appointment,
  AppointmentStatus,
  CareHandover,
  CareTask,
  CareTaskCategory,
  CareTaskPriority,
  CaregiverActivityLog,
  CaregiverActivityType,
  CaregiverAssistance,
  CaregiverProfile,
  CaregiverShift,
  DocumentRecord,
  DocumentType,
  ElderPreferences,
  ElderProfile,
  EmergencyRequest,
  Family,
  FamilyMember,
  HandoverSummary,
  Invitation,
  LanguageCode,
  Medication,
  MedicationEvent,
  Notification,
  NotificationPreference,
  ParentConfirmation,
  Profile,
  ReminderKind,
  ReminderRule,
  Role,
  VerificationStatus,
  WellnessCheckin,
  WellnessStatus,
} from "./types";

// DEMO MODE ONLY. Passwords in this store are kept in plain text in this browser's
// localStorage. They stay on this device and are NOT secure. Real accounts use Supabase Auth.
// Invitation codes in this store are also local and NOT secure: anyone with access to this
// browser's localStorage can read them. Real invitations must be issued by the backend.
// Medication, appointment and document data is also stored unencrypted in this browser's
// localStorage in demo mode. Do not enter real health information into demo mode.

export const DEMO_STORE_VERSION = 7;
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
  medications: Medication[];
  medication_events: MedicationEvent[];
  appointments: Appointment[];
  document_records: DocumentRecord[];
  caregiver_profiles: CaregiverProfile[];
  caregiver_shifts: CaregiverShift[];
  caregiver_activity: CaregiverActivityLog[];
  notifications: Notification[];
  notification_preferences: NotificationPreference[];
  reminder_rules: ReminderRule[];
  care_handovers: CareHandover[];
  wellness_checkins: WellnessCheckin[];
  emergency_requests: EmergencyRequest[];
  elder_preferences: ElderPreferences[];
  session_user_id: string | null;
}

/** A care task plus its derived overdue flag (never stored). */
export interface TaskView extends CareTask {
  is_overdue: boolean;
}

/** An appointment plus its derived past flag (never stored). */
export type AppointmentView = Appointment & { is_past: boolean };

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
    medications: [],
    medication_events: [],
    appointments: [],
    document_records: [],
    caregiver_profiles: [],
    caregiver_shifts: [],
    caregiver_activity: [],
    notifications: [],
    notification_preferences: [],
    reminder_rules: [],
    care_handovers: [],
    wellness_checkins: [],
    emergency_requests: [],
    elder_preferences: [],
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
    if (![1, 2, 3, 4, 5, 6, DEMO_STORE_VERSION].includes(parsed.version ?? -1)) return emptyStore();
    return {
      version: DEMO_STORE_VERSION,
      users: parsed.users ?? [],
      families: parsed.families ?? [],
      family_members: parsed.family_members ?? [],
      elder_profiles: parsed.elder_profiles ?? [],
      care_tasks: parsed.care_tasks ?? [],
      invitations: parsed.invitations ?? [],
      activity_events: parsed.activity_events ?? [],
      medications: parsed.medications ?? [],
      medication_events: parsed.medication_events ?? [],
      appointments: parsed.appointments ?? [],
      document_records: parsed.document_records ?? [],
      caregiver_profiles: parsed.caregiver_profiles ?? [],
      caregiver_shifts: parsed.caregiver_shifts ?? [],
      caregiver_activity: parsed.caregiver_activity ?? [],
      notifications: parsed.notifications ?? [],
      notification_preferences: parsed.notification_preferences ?? [],
      reminder_rules: parsed.reminder_rules ?? [],
      care_handovers: parsed.care_handovers ?? [],
      wellness_checkins: parsed.wellness_checkins ?? [],
      emergency_requests: parsed.emergency_requests ?? [],
      elder_preferences: parsed.elder_preferences ?? [],
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

// ---- Shared helpers (Phase 3) ----

const HH_MM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Trims text and turns empty input into null. */
function textOrNull(value: string | null | undefined): string | null {
  const clean = value?.trim();
  return clean ? clean : null;
}

/** Parses a date/time input to ISO, or returns null when it is not a valid date. */
function toIsoOrNull(value: string): string | null {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

// ---- Medications ----

export function createMedication({
  familyId,
  elderId,
  actorId,
  name,
  instructions,
  frequency,
  scheduledTimes,
  startDate,
  endDate = null,
  prescriber = null,
  refillDate = null,
  refillResponsible = null,
  notes = null,
}: {
  familyId: string;
  elderId: string;
  actorId: string;
  name: string;
  instructions: string;
  frequency: string;
  scheduledTimes: string[];
  startDate: string;
  endDate?: string | null;
  prescriber?: string | null;
  refillDate?: string | null;
  refillResponsible?: string | null;
  notes?: string | null;
}): Medication {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Medicine name is required.");
  }
  const times = scheduledTimes.map((t) => t.trim()).filter((t) => t !== "");
  if (times.length === 0) {
    throw new Error("Enter at least one scheduled time.");
  }
  if (!times.every((t) => HH_MM_PATTERN.test(t))) {
    throw new Error("Enter times as HH:MM.");
  }
  const cleanEnd = textOrNull(endDate);
  // YYYY-MM-DD strings compare correctly as plain text.
  if (cleanEnd && cleanEnd < startDate) {
    throw new Error("End date must be on or after the start date.");
  }

  const store = readStore();
  const medication: Medication = {
    id: crypto.randomUUID(),
    family_id: familyId,
    elder_id: elderId,
    name: cleanName,
    instructions: instructions.trim(),
    frequency: frequency.trim(),
    scheduled_times: Array.from(new Set(times)).sort(),
    start_date: startDate,
    end_date: cleanEnd,
    prescriber: textOrNull(prescriber),
    refill_date: textOrNull(refillDate),
    refill_responsible: refillResponsible || null,
    notes: textOrNull(notes),
    status: "active",
    created_by: actorId,
    created_at: new Date().toISOString(),
  };
  store.medications.push(medication);
  writeStore(store);

  addActivity({
    familyId,
    actorId,
    action: "medication.created",
    entityType: "medication",
    entityId: medication.id,
    message: `Added medicine "${cleanName}".`,
  });
  return medication;
}

/** Lists a family's medications sorted by name. */
export function listMedications(familyId: string): Medication[] {
  const store = readStore();
  return store.medications
    .filter((m) => m.family_id === familyId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function stopMedication(medicationId: string, actorId: string): Medication {
  const store = readStore();
  const medication = store.medications.find((m) => m.id === medicationId);
  if (!medication) {
    throw new Error("Medication not found.");
  }
  if (medication.status === "stopped") {
    return medication; // already stopped: nothing to change, no duplicate activity
  }

  medication.status = "stopped";
  writeStore(store);

  addActivity({
    familyId: medication.family_id,
    actorId,
    action: "medication.stopped",
    entityType: "medication",
    entityId: medication.id,
    message: `Stopped medicine "${medication.name}".`,
  });
  return medication;
}

/** Finds the event for one dose (medication + scheduled time), or creates it with empty fields. */
function findOrCreateMedicationEvent(
  store: DemoStore,
  medicationId: string,
  familyId: string,
  scheduledAt: string,
): MedicationEvent {
  let event = store.medication_events.find(
    (e) => e.medication_id === medicationId && e.scheduled_at === scheduledAt,
  );
  if (!event) {
    event = {
      id: crypto.randomUUID(),
      medication_id: medicationId,
      family_id: familyId,
      scheduled_at: scheduledAt,
      parent_confirmation: null,
      parent_confirmed_at: null,
      caregiver_assistance: null,
      caregiver_user_id: null,
      caregiver_recorded_at: null,
      notes: null,
    };
    store.medication_events.push(event);
  }
  return event;
}

function requireMedication(store: DemoStore, medicationId: string, familyId: string): Medication {
  const medication = store.medications.find((m) => m.id === medicationId && m.family_id === familyId);
  if (!medication) {
    throw new Error("Medication not found.");
  }
  return medication;
}

/**
 * Records what the parent confirmed for one dose. Writes only parent_confirmation and
 * parent_confirmed_at; caregiver fields are never touched.
 */
export function recordParentConfirmation({
  medicationId,
  familyId,
  scheduledAt,
  actorId,
  status,
}: {
  medicationId: string;
  familyId: string;
  scheduledAt: string;
  actorId: string;
  status: ParentConfirmation;
}): MedicationEvent {
  const store = readStore();
  const medication = requireMedication(store, medicationId, familyId);
  const iso = toIsoOrNull(scheduledAt);
  if (!iso) {
    throw new Error("Enter a valid date and time.");
  }

  const event = findOrCreateMedicationEvent(store, medicationId, familyId, iso);
  event.parent_confirmation = status;
  event.parent_confirmed_at = new Date().toISOString();
  writeStore(store);

  addActivity({
    familyId,
    actorId,
    action: "medication.parent_confirmed",
    entityType: "medication_event",
    entityId: event.id,
    message: `Parent confirmed "${medication.name}" as ${status.replace("_", " ")}.`,
  });
  return event;
}

/**
 * Records caregiver assistance for one dose. Writes only caregiver_assistance,
 * caregiver_user_id, caregiver_recorded_at and notes; parent_confirmation is never set.
 */
export function recordCaregiverAssistance({
  medicationId,
  familyId,
  scheduledAt,
  actorId,
  assistance,
  notes = null,
}: {
  medicationId: string;
  familyId: string;
  scheduledAt: string;
  actorId: string;
  assistance: CaregiverAssistance;
  notes?: string | null;
}): MedicationEvent {
  const store = readStore();
  const medication = requireMedication(store, medicationId, familyId);
  const iso = toIsoOrNull(scheduledAt);
  if (!iso) {
    throw new Error("Enter a valid date and time.");
  }

  const event = findOrCreateMedicationEvent(store, medicationId, familyId, iso);
  event.caregiver_assistance = assistance;
  event.caregiver_user_id = actorId;
  event.caregiver_recorded_at = new Date().toISOString();
  event.notes = textOrNull(notes);
  writeStore(store);

  addActivity({
    familyId,
    actorId,
    action: "medication.caregiver_assisted",
    entityType: "medication_event",
    entityId: event.id,
    message: `Caregiver recorded "${medication.name}" as ${assistance.replace("_", " ")}.`,
  });
  return event;
}

/** Newest scheduled dose first. */
export function listMedicationEvents(familyId: string): MedicationEvent[] {
  const store = readStore();
  return store.medication_events
    .filter((e) => e.family_id === familyId)
    .sort((a, b) => Date.parse(b.scheduled_at) - Date.parse(a.scheduled_at));
}

// ---- Appointments ----

export function createAppointment({
  familyId,
  elderId,
  actorId,
  title,
  provider = null,
  location = null,
  scheduledAt,
  assignedTo = null,
  notes = null,
}: {
  familyId: string;
  elderId: string;
  actorId: string;
  title: string;
  provider?: string | null;
  location?: string | null;
  scheduledAt: string;
  assignedTo?: string | null;
  notes?: string | null;
}): Appointment {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    throw new Error("Appointment title is required.");
  }
  const iso = toIsoOrNull(scheduledAt);
  if (!iso) {
    throw new Error("Enter a valid date and time.");
  }

  const store = readStore();
  const appointment: Appointment = {
    id: crypto.randomUUID(),
    family_id: familyId,
    elder_id: elderId,
    title: cleanTitle,
    provider: textOrNull(provider),
    location: textOrNull(location),
    scheduled_at: iso,
    assigned_to: assignedTo || null,
    status: "scheduled",
    notes: textOrNull(notes),
    created_by: actorId,
    created_at: new Date().toISOString(),
  };
  store.appointments.push(appointment);
  writeStore(store);

  addActivity({
    familyId,
    actorId,
    action: "appointment.created",
    entityType: "appointment",
    entityId: appointment.id,
    message: `Created appointment "${cleanTitle}".`,
  });
  return appointment;
}

/** Lists a family's appointments by scheduled time (earliest first). is_past is derived at read time. */
export function listAppointments(familyId: string): AppointmentView[] {
  const store = readStore();
  const now = Date.now();
  return store.appointments
    .filter((a) => a.family_id === familyId)
    .map((a) => ({ ...a, is_past: Date.parse(a.scheduled_at) < now }))
    .sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at));
}

export function updateAppointmentStatus(
  appointmentId: string,
  actorId: string,
  status: Extract<AppointmentStatus, "cancelled" | "completed">,
): Appointment {
  const store = readStore();
  const appointment = store.appointments.find((a) => a.id === appointmentId);
  if (!appointment) {
    throw new Error("Appointment not found.");
  }
  if (appointment.status === status) {
    return appointment;
  }

  appointment.status = status;
  writeStore(store);

  addActivity({
    familyId: appointment.family_id,
    actorId,
    action: `appointment.${status}`,
    entityType: "appointment",
    entityId: appointment.id,
    message: `Marked appointment "${appointment.title}" as ${status}.`,
  });
  return appointment;
}

// ---- Document metadata (no file bytes in demo mode) ----

export function createDocumentRecord({
  familyId,
  elderId,
  actorId,
  title,
  documentType,
  documentDate = null,
  fileName,
}: {
  familyId: string;
  elderId: string;
  actorId: string;
  title: string;
  documentType: DocumentType;
  documentDate?: string | null;
  fileName: string;
}): DocumentRecord {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    throw new Error("Document title is required.");
  }
  const cleanFile = fileName.trim();
  if (!cleanFile) {
    throw new Error("Choose a file name.");
  }

  const store = readStore();
  const record: DocumentRecord = {
    id: crypto.randomUUID(),
    family_id: familyId,
    elder_id: elderId,
    title: cleanTitle,
    document_type: documentType,
    document_date: textOrNull(documentDate),
    file_name: cleanFile,
    uploaded_by: actorId,
    created_at: new Date().toISOString(),
  };
  store.document_records.push(record);
  writeStore(store);

  addActivity({
    familyId,
    actorId,
    action: "document.created",
    entityType: "document",
    entityId: record.id,
    message: `Added document "${cleanTitle}".`,
  });
  return record;
}

/** Newest first. Stored in insertion order, so reversing gives exact recency. */
export function listDocumentRecords(familyId: string): DocumentRecord[] {
  const store = readStore();
  return store.document_records.filter((d) => d.family_id === familyId).reverse();
}

// ---- Caregivers (Phase 4) ----
// DEMO MODE ONLY. Verification statuses are set by the family owner in this browser.
// Real identity and background checks require an authorised external verification process
// and must not be marked verified in code paths without one.

const CAREGIVER_PHONE_MIN_DIGITS = 7;

function isFamilyOwner(store: DemoStore, familyId: string, userId: string): boolean {
  return store.family_members.some(
    (m) => m.family_id === familyId && m.user_id === userId && m.role === "owner" && m.status === "active",
  );
}

function requireFamilyOwner(store: DemoStore, familyId: string, userId: string, message: string): void {
  if (!isFamilyOwner(store, familyId, userId)) {
    throw new Error(message);
  }
}

function requireShift(store: DemoStore, shiftId: string): CaregiverShift {
  const shift = store.caregiver_shifts.find((s) => s.id === shiftId);
  if (!shift) {
    throw new Error("Shift not found.");
  }
  return shift;
}

function requireAssignedShift(store: DemoStore, shiftId: string, actorId: string): CaregiverShift {
  const shift = requireShift(store, shiftId);
  if (shift.caregiver_user_id !== actorId) {
    throw new Error("This shift is not assigned to you.");
  }
  return shift;
}

/** Appends a caregiver activity entry to the store. The caller is responsible for writeStore. */
function appendCaregiverActivity(
  store: DemoStore,
  entry: {
    familyId: string;
    caregiverUserId: string;
    taskId: string | null;
    activityType: CaregiverActivityType;
    description: string;
    evidenceName: string | null;
  },
): CaregiverActivityLog {
  const log: CaregiverActivityLog = {
    id: crypto.randomUUID(),
    family_id: entry.familyId,
    caregiver_user_id: entry.caregiverUserId,
    task_id: entry.taskId,
    activity_type: entry.activityType,
    description: entry.description,
    evidence_name: entry.evidenceName,
    disputed: false,
    created_at: new Date().toISOString(),
  };
  store.caregiver_activity.push(log);
  return log;
}

// ---- Caregiver profiles ----

export function getCaregiverProfile(familyId: string, userId: string): CaregiverProfile | null {
  const store = readStore();
  return store.caregiver_profiles.find((p) => p.family_id === familyId && p.user_id === userId) ?? null;
}

/** Creates or updates a caregiver profile. Never changes verification statuses or family_approval. */
export function upsertCaregiverProfile({
  familyId,
  userId,
  experience = null,
  qualifications = null,
  contactPhone = null,
  emergencyContact = null,
}: {
  familyId: string;
  userId: string;
  experience?: string | null;
  qualifications?: string | null;
  contactPhone?: string | null;
  emergencyContact?: string | null;
}): CaregiverProfile {
  const cleanPhone = textOrNull(contactPhone);
  if (cleanPhone !== null && cleanPhone.replace(/\D/g, "").length < CAREGIVER_PHONE_MIN_DIGITS) {
    throw new Error("Enter a valid phone number.");
  }

  const store = readStore();
  const now = new Date().toISOString();
  let profile = store.caregiver_profiles.find((p) => p.family_id === familyId && p.user_id === userId);
  if (!profile) {
    profile = {
      id: crypto.randomUUID(),
      user_id: userId,
      family_id: familyId,
      experience: null,
      qualifications: null,
      contact_phone: null,
      emergency_contact: null,
      identity_status: "not_submitted",
      reference_status: "not_submitted",
      background_status: "not_submitted",
      family_approval: "pending",
      created_at: now,
      updated_at: now,
    };
    store.caregiver_profiles.push(profile);
  }
  profile.experience = textOrNull(experience);
  profile.qualifications = textOrNull(qualifications);
  profile.contact_phone = cleanPhone;
  profile.emergency_contact = textOrNull(emergencyContact);
  profile.updated_at = now;
  writeStore(store);

  addActivity({
    familyId,
    actorId: userId,
    action: "caregiver.profile_updated",
    entityType: "caregiver_profile",
    entityId: profile.id,
    message: "Updated the caregiver profile.",
  });
  return profile;
}

const VERIFICATION_FIELD = {
  identity: "identity_status",
  reference: "reference_status",
  background: "background_status",
} as const;

/**
 * DEMO MODE ONLY. Real identity and background checks require an authorised external
 * verification process and must not be marked verified in code paths without one.
 */
export function setVerificationStatus({
  familyId,
  caregiverUserId,
  actorId,
  kind,
  status,
}: {
  familyId: string;
  caregiverUserId: string;
  actorId: string;
  kind: "identity" | "reference" | "background";
  status: VerificationStatus;
}): CaregiverProfile {
  const store = readStore();
  requireFamilyOwner(store, familyId, actorId, "Only the family owner can change verification status.");
  const profile = store.caregiver_profiles.find((p) => p.family_id === familyId && p.user_id === caregiverUserId);
  if (!profile) {
    throw new Error("Caregiver profile not found.");
  }
  profile[VERIFICATION_FIELD[kind]] = status;
  profile.updated_at = new Date().toISOString();
  writeStore(store);

  addActivity({
    familyId,
    actorId,
    action: "caregiver.verification_updated",
    entityType: "caregiver_profile",
    entityId: profile.id,
    message: `Set the ${kind} check to ${status.replace("_", " ")}.`,
  });
  return profile;
}

export function setFamilyApproval({
  familyId,
  caregiverUserId,
  actorId,
  decision,
}: {
  familyId: string;
  caregiverUserId: string;
  actorId: string;
  decision: "approved" | "declined";
}): CaregiverProfile {
  const store = readStore();
  requireFamilyOwner(store, familyId, actorId, "Only the family owner can approve or decline a caregiver.");
  const profile = store.caregiver_profiles.find((p) => p.family_id === familyId && p.user_id === caregiverUserId);
  if (!profile) {
    throw new Error("Caregiver profile not found.");
  }
  profile.family_approval = decision;
  profile.updated_at = new Date().toISOString();
  writeStore(store);

  addActivity({
    familyId,
    actorId,
    action: "caregiver.approval_updated",
    entityType: "caregiver_profile",
    entityId: profile.id,
    message: `Marked the caregiver as ${decision}.`,
  });
  return profile;
}

export function listCaregiverProfiles(familyId: string): CaregiverProfile[] {
  const store = readStore();
  return store.caregiver_profiles.filter((p) => p.family_id === familyId);
}

// ---- Shifts ----

/** Owner-only. Creates a shift with status "scheduled". */
export function createShift({
  familyId,
  elderId,
  caregiverUserId,
  actorId,
  scheduledStart,
  scheduledEnd,
}: {
  familyId: string;
  elderId: string;
  caregiverUserId: string;
  actorId: string;
  scheduledStart: string;
  scheduledEnd: string;
}): CaregiverShift {
  const store = readStore();
  requireFamilyOwner(store, familyId, actorId, "Only the family owner can schedule shifts.");

  const startIso = toIsoOrNull(scheduledStart);
  const endIso = toIsoOrNull(scheduledEnd);
  if (!startIso || !endIso) {
    throw new Error("Enter valid start and end times.");
  }
  if (Date.parse(endIso) <= Date.parse(startIso)) {
    throw new Error("Shift must end after it starts.");
  }

  const shift: CaregiverShift = {
    id: crypto.randomUUID(),
    family_id: familyId,
    elder_id: elderId,
    caregiver_user_id: caregiverUserId,
    scheduled_start: startIso,
    scheduled_end: endIso,
    check_in_at: null,
    check_out_at: null,
    status: "scheduled",
    shift_notes: null,
    created_by: actorId,
    created_at: new Date().toISOString(),
  };
  store.caregiver_shifts.push(shift);
  writeStore(store);

  addActivity({
    familyId,
    actorId,
    action: "caregiver.shift_created",
    entityType: "caregiver_shift",
    entityId: shift.id,
    message: "Scheduled a caregiver shift.",
  });
  return shift;
}

/** Lists a family's shifts by scheduled start (earliest first). */
export function listShifts(familyId: string): CaregiverShift[] {
  const store = readStore();
  return store.caregiver_shifts
    .filter((s) => s.family_id === familyId)
    .sort((a, b) => Date.parse(a.scheduled_start) - Date.parse(b.scheduled_start));
}

/** Only the assigned caregiver may check in. Check-in time is not treated as proof of care. */
export function checkInShift(shiftId: string, actorId: string): CaregiverShift {
  const store = readStore();
  const shift = requireAssignedShift(store, shiftId, actorId);
  if (shift.check_in_at !== null || shift.status === "checked_in") {
    throw new Error("This shift is already checked in.");
  }
  if (shift.status !== "scheduled") {
    throw new Error("This shift can no longer be checked in.");
  }

  shift.check_in_at = new Date().toISOString();
  shift.status = "checked_in";
  appendCaregiverActivity(store, {
    familyId: shift.family_id,
    caregiverUserId: actorId,
    taskId: null,
    activityType: "check_in",
    description: "Checked in to shift.",
    evidenceName: null,
  });
  writeStore(store);
  return shift;
}

/** Only the assigned caregiver may check out, and only after checking in. */
export function checkOutShift(shiftId: string, actorId: string, shiftNotes: string): CaregiverShift {
  const store = readStore();
  const shift = requireAssignedShift(store, shiftId, actorId);
  if (shift.check_in_at === null) {
    throw new Error("Check in before checking out.");
  }
  if (shift.status !== "checked_in") {
    throw new Error("This shift is already checked out.");
  }

  shift.check_out_at = new Date().toISOString();
  shift.status = "completed";
  shift.shift_notes = textOrNull(shiftNotes);
  appendCaregiverActivity(store, {
    familyId: shift.family_id,
    caregiverUserId: actorId,
    taskId: null,
    activityType: "check_out",
    description: "Checked out of shift.",
    evidenceName: null,
  });
  writeStore(store);
  return shift;
}

/** Owner-only. Never runs automatically on read. */
export function markShiftMissed(shiftId: string, actorId: string): CaregiverShift {
  const store = readStore();
  const shift = requireShift(store, shiftId);
  requireFamilyOwner(store, shift.family_id, actorId, "Only the family owner can mark a shift missed.");
  if (shift.status !== "scheduled" || Date.parse(shift.scheduled_end) >= Date.now()) {
    throw new Error("Only a scheduled shift that has ended can be marked missed.");
  }

  shift.status = "missed";
  writeStore(store);

  addActivity({
    familyId: shift.family_id,
    actorId,
    action: "caregiver.shift_missed",
    entityType: "caregiver_shift",
    entityId: shift.id,
    message: "Marked a caregiver shift as missed.",
  });
  return shift;
}

/** Shifts across all families for one caregiver, earliest first. */
export function listShiftsForCaregiver(userId: string): CaregiverShift[] {
  const store = readStore();
  return store.caregiver_shifts
    .filter((s) => s.caregiver_user_id === userId)
    .sort((a, b) => Date.parse(a.scheduled_start) - Date.parse(b.scheduled_start));
}

// ---- Caregiver activity ----

/** Only the caregiver can write their own activity. Never sets disputed. */
export function addCaregiverActivity({
  familyId,
  caregiverUserId,
  actorId,
  taskId = null,
  activityType,
  description,
  evidenceName = null,
}: {
  familyId: string;
  caregiverUserId: string;
  actorId: string;
  taskId?: string | null;
  activityType: CaregiverActivityType;
  description: string;
  evidenceName?: string | null;
}): CaregiverActivityLog {
  if (actorId !== caregiverUserId) {
    throw new Error("Only the caregiver can record their own activity.");
  }
  const cleanDescription = description.trim();
  if (!cleanDescription) {
    throw new Error("Describe the activity.");
  }

  const store = readStore();
  const log = appendCaregiverActivity(store, {
    familyId,
    caregiverUserId,
    taskId: taskId || null,
    activityType,
    description: cleanDescription,
    evidenceName: textOrNull(evidenceName),
  });
  writeStore(store);
  return log;
}

/** Only a family owner or family member may mark an activity as disputed. */
export function setActivityDisputed(activityId: string, actorId: string, disputed: boolean): CaregiverActivityLog {
  const store = readStore();
  const log = store.caregiver_activity.find((a) => a.id === activityId);
  if (!log) {
    throw new Error("Activity not found.");
  }
  const canDispute = store.family_members.some(
    (m) =>
      m.family_id === log.family_id &&
      m.user_id === actorId &&
      m.status === "active" &&
      (m.role === "owner" || m.role === "family_member"),
  );
  if (!canDispute) {
    throw new Error("Only a family owner or family member can dispute an activity.");
  }

  log.disputed = disputed;
  writeStore(store);
  return log;
}

/** Newest first. Stored in insertion order, so reversing gives exact recency. */
export function listCaregiverActivity(familyId: string): CaregiverActivityLog[] {
  const store = readStore();
  return store.caregiver_activity.filter((a) => a.family_id === familyId).reverse();
}

// ---- Caregiver access to elders ----

/**
 * Elders the caregiver may see: only families where the caregiver's profile is approved
 * AND they hold an active "caregiver" membership. Both are required.
 */
export function listAssignedElders(userId: string): ElderProfile[] {
  const store = readStore();
  const approvedFamilyIds = new Set(
    store.caregiver_profiles
      .filter((p) => p.user_id === userId && p.family_approval === "approved")
      .map((p) => p.family_id),
  );
  const assignedFamilyIds = new Set(
    store.family_members
      .filter(
        (m) =>
          m.user_id === userId &&
          m.role === "caregiver" &&
          m.status === "active" &&
          approvedFamilyIds.has(m.family_id),
      )
      .map((m) => m.family_id),
  );
  return store.elder_profiles.filter((e) => assignedFamilyIds.has(e.family_id));
}

// ---- Notifications, reminder rules (Phase 5) ----
// Demo mode only. A missed check-in is never treated as a medical emergency.

/**
 * Creates an in-app notification. Returns the existing one if (user, dedupe key) already exists,
 * and null if the user has turned this event type off.
 */
export function createNotification({
  familyId,
  userId,
  eventType,
  title,
  message,
  dedupeKey,
}: {
  familyId: string;
  userId: string;
  eventType: string;
  title: string;
  message: string;
  dedupeKey: string;
}): Notification | null {
  const store = readStore();
  const existing = store.notifications.find((n) => n.user_id === userId && n.dedupe_key === dedupeKey);
  if (existing) {
    return existing;
  }
  const preference = store.notification_preferences.find(
    (p) => p.user_id === userId && p.event_type === eventType,
  );
  if (preference && preference.enabled === false) {
    return null;
  }

  const notification: Notification = {
    id: crypto.randomUUID(),
    family_id: familyId,
    user_id: userId,
    event_type: eventType,
    title,
    message,
    dedupe_key: dedupeKey,
    channel: "in_app",
    delivery_status: "delivered",
    read_at: null,
    created_at: new Date().toISOString(),
  };
  store.notifications.push(notification);
  writeStore(store);
  return notification;
}

/** Newest first. */
export function listNotifications(userId: string): Notification[] {
  const store = readStore();
  return store.notifications
    .filter((n) => n.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function markNotificationRead(notificationId: string, userId: string): Notification {
  const store = readStore();
  const notification = store.notifications.find((n) => n.id === notificationId);
  if (!notification || notification.user_id !== userId) {
    throw new Error("Notification not found.");
  }
  notification.read_at = new Date().toISOString();
  writeStore(store);
  return notification;
}

/** Turns one event type on or off for a user. Creates the preference row if it does not exist. */
export function setNotificationPreference(
  userId: string,
  eventType: string,
  enabled: boolean,
): NotificationPreference {
  const store = readStore();
  let preference = store.notification_preferences.find(
    (p) => p.user_id === userId && p.event_type === eventType,
  );
  if (preference) {
    preference.enabled = enabled;
  } else {
    preference = { id: crypto.randomUUID(), user_id: userId, event_type: eventType, enabled };
    store.notification_preferences.push(preference);
  }
  writeStore(store);
  return preference;
}

export function listNotificationPreferences(userId: string): NotificationPreference[] {
  const store = readStore();
  return store.notification_preferences.filter((p) => p.user_id === userId);
}

export function listReminderRules(familyId: string): ReminderRule[] {
  const store = readStore();
  return store.reminder_rules.filter((r) => r.family_id === familyId);
}

/** Owner only. Creates or updates the rule for (family, kind). */
export function upsertReminderRule({
  familyId,
  actorId,
  kind,
  minutesBeforeOrAfter,
  escalateToUserId,
  enabled,
}: {
  familyId: string;
  actorId: string;
  kind: ReminderKind;
  minutesBeforeOrAfter: number;
  escalateToUserId: string | null;
  enabled: boolean;
}): ReminderRule {
  const store = readStore();
  requireFamilyOwner(store, familyId, actorId, "Only the family owner can change reminder rules.");

  let rule = store.reminder_rules.find((r) => r.family_id === familyId && r.kind === kind);
  if (rule) {
    rule.minutes_before_or_after = minutesBeforeOrAfter;
    rule.escalate_to_user_id = escalateToUserId;
    rule.enabled = enabled;
  } else {
    rule = {
      id: crypto.randomUUID(),
      family_id: familyId,
      kind,
      minutes_before_or_after: minutesBeforeOrAfter,
      escalate_to_user_id: escalateToUserId,
      enabled,
    };
    store.reminder_rules.push(rule);
  }
  writeStore(store);

  addActivity({
    familyId,
    actorId,
    action: "reminder_rule.updated",
    entityType: "reminder_rule",
    entityId: rule.id,
    message: `Updated the ${kind} reminder rule.`,
  });
  return rule;
}

// Demo mode: runs only when the app calls it, not on a server schedule. A missed check-in is never treated as a medical emergency.
export function runAutomationPass(
  familyId: string,
  now: Date,
): { created: number; skipped_duplicates: number; rules_applied: string[] } {
  const nowMs = now.getTime();
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const pad = (n: number): string => String(n).padStart(2, "0");
  const todayLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const ownerId =
    listMembers(familyId).find((m) => m.role === "owner" && m.status === "active")?.user_id ?? null;

  let created = 0;
  let skipped = 0;

  // Skips when (user, dedupe key) already exists; otherwise asks createNotification.
  const notifyOnce = (
    userId: string | null,
    eventType: string,
    title: string,
    message: string,
    dedupeKey: string,
  ): void => {
    if (!userId) return;
    const exists = readStore().notifications.some((n) => n.user_id === userId && n.dedupe_key === dedupeKey);
    if (exists) {
      skipped += 1;
      return;
    }
    const result = createNotification({ familyId, userId, eventType, title, message, dedupeKey });
    if (result !== null) created += 1;
  };

  // Rule A: overdue open tasks.
  for (const task of listTasks(familyId)) {
    if (task.status !== "open" || task.due_at === null || Date.parse(task.due_at) >= nowMs) continue;
    notifyOnce(
      task.assigned_to ?? ownerId,
      "task_overdue",
      "Task overdue",
      `${task.title} is past its due time.`,
      `task_overdue:${task.id}:${task.due_at.slice(0, 10)}`,
    );
  }

  // Rule B: scheduled shifts with no check-in after their scheduled end.
  for (const shift of listShifts(familyId)) {
    if (shift.status !== "scheduled" || shift.check_in_at !== null) continue;
    if (Date.parse(shift.scheduled_end) >= nowMs) continue;
    const title = "Shift check-in not recorded";
    const message = "No check-in was recorded for a scheduled shift.";
    notifyOnce(shift.caregiver_user_id, "shift_missed", title, message, `shift_missed:${shift.id}`);
    if (nowMs - Date.parse(shift.scheduled_start) > HOUR) {
      notifyOnce(ownerId, "shift_missed", title, message, `shift_missed_owner:${shift.id}`);
    }
  }

  // Rule C: active medicine doses from today that are more than 30 minutes past with no parent confirmation.
  const medicationEvents = listMedicationEvents(familyId);
  for (const medication of listMedications(familyId)) {
    if (medication.status !== "active") continue;
    if (medication.start_date > todayLocal) continue;
    if (medication.end_date !== null && medication.end_date < todayLocal) continue;
    const recipient = medication.refill_responsible ?? ownerId;
    for (const time of medication.scheduled_times) {
      const [hours, minutes] = time.split(":").map(Number);
      const slot = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      const slotMs = slot.getTime();
      if (nowMs - slotMs <= 30 * MINUTE) continue;
      const slotIso = slot.toISOString();
      const event = medicationEvents.find((e) => e.medication_id === medication.id && e.scheduled_at === slotIso);
      if (event?.parent_confirmation) continue;
      const title = "Medicine confirmation pending";
      const message = "No confirmation has been recorded yet. This is not a record that the medicine was missed or taken.";
      notifyOnce(recipient, "medication_unconfirmed", title, message, `medication_unconfirmed:${medication.id}:${slotIso}:parent`);
      if (nowMs - slotMs > 120 * MINUTE) {
        notifyOnce(ownerId, "medication_unconfirmed", title, message, `medication_unconfirmed:${medication.id}:${slotIso}:escalated`);
      }
    }
  }

  // Rule D: scheduled appointments within the next 24 hours.
  for (const appointment of listAppointments(familyId)) {
    if (appointment.status !== "scheduled") continue;
    const at = Date.parse(appointment.scheduled_at);
    if (at < nowMs || at > nowMs + DAY) continue;
    notifyOnce(
      appointment.assigned_to ?? ownerId,
      "appointment_upcoming",
      "Appointment in the next 24 hours",
      `${appointment.title} is coming up.`,
      `appointment_upcoming:${appointment.id}:${appointment.scheduled_at.slice(0, 10)}`,
    );
  }

  return {
    created,
    skipped_duplicates: skipped,
    rules_applied: [
      "task_overdue",
      "shift_missed",
      "medication_unconfirmed",
      "appointment_upcoming",
      "wellness_missed: not implemented in demo data",
    ],
  };
}

// ---- Care handover (Phase 5) ----
// The handover summary is built only from stored records. Nothing is invented or inferred.

function isFamilyOwnerOrMember(store: DemoStore, familyId: string, userId: string): boolean {
  return store.family_members.some(
    (m) =>
      m.family_id === familyId &&
      m.user_id === userId &&
      (m.role === "owner" || m.role === "family_member") &&
      m.status === "active",
  );
}

/**
 * Builds a handover summary from stored records only. Only a family owner or family member,
 * or a caregiver with an active assignment for this elder, may generate one.
 */
export function generateCareHandover({
  familyId,
  elderId,
  fromUserId,
  toUserId,
}: {
  familyId: string;
  elderId: string;
  fromUserId: string;
  toUserId: string | null;
}): CareHandover {
  const store = readStore();
  const elder = store.elder_profiles.find((e) => e.id === elderId && e.family_id === familyId);
  if (!elder) {
    throw new Error("Elder profile not found.");
  }
  const allowed =
    isFamilyOwnerOrMember(store, familyId, fromUserId) ||
    listAssignedElders(fromUserId).some((e) => e.id === elderId);
  if (!allowed) {
    throw new Error("Only a family member or an assigned caregiver can create a handover.");
  }

  const nowMs = Date.now();
  const generatedAt = new Date(nowMs).toISOString();

  const openTasks = store.care_tasks.filter((t) => t.family_id === familyId && t.status === "open");
  const pendingTasks = openTasks.map((t) => ({
    id: t.id,
    title: t.title,
    overdue: t.due_at !== null && Date.parse(t.due_at) < nowMs,
  }));

  const medicationConfirmations = store.medication_events
    .filter((e) => e.family_id === familyId)
    .map((e) => ({
      medicine: store.medications.find((m) => m.id === e.medication_id)?.name ?? "",
      scheduled_at: e.scheduled_at,
      parent_confirmation: e.parent_confirmation,
      caregiver_assistance: e.caregiver_assistance,
    }));

  const summary: HandoverSummary = {
    generated_at: generatedAt,
    completed_tasks: store.care_tasks
      .filter((t) => t.family_id === familyId && t.status === "completed")
      .map((t) => ({ id: t.id, title: t.title })),
    medication_confirmations: medicationConfirmations,
    pending_tasks: pendingTasks,
    upcoming_appointments: store.appointments
      .filter((a) => a.family_id === familyId && a.status === "scheduled" && Date.parse(a.scheduled_at) > nowMs)
      .map((a) => ({ id: a.id, title: a.title, scheduled_at: a.scheduled_at })),
    caregiver_notes: store.caregiver_activity
      .filter((a) => a.family_id === familyId)
      .map((a) => a.description),
    unresolved_issues: [
      ...pendingTasks.filter((t) => t.overdue).map((t) => `Overdue task: ${t.title}`),
      ...medicationConfirmations
        .filter((c) => c.parent_confirmation === null)
        .map((c) => `No parent confirmation for ${c.medicine} at ${c.scheduled_at}`),
      ...store.caregiver_shifts
        .filter((s) => s.family_id === familyId && s.status === "missed")
        .map((s) => `Missed shift scheduled to start at ${s.scheduled_start}`),
    ],
  };

  const handover: CareHandover = {
    id: crypto.randomUUID(),
    family_id: familyId,
    elder_id: elderId,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    summary_json: summary,
    status: "sent",
    acknowledged_by: null,
    acknowledged_at: null,
    created_at: generatedAt,
  };
  store.care_handovers.push(handover);
  writeStore(store);

  addActivity({
    familyId,
    actorId: fromUserId,
    action: "handover.created",
    entityType: "handover",
    entityId: handover.id,
    message: "Created a care handover.",
  });
  return handover;
}

/** Acknowledges a handover. Allowed for the next caregiver or a family owner/member. */
export function acknowledgeHandover(handoverId: string, actorId: string): CareHandover {
  const store = readStore();
  const handover = store.care_handovers.find((h) => h.id === handoverId);
  if (!handover) {
    throw new Error("Handover not found.");
  }
  const allowed =
    actorId === handover.to_user_id || isFamilyOwnerOrMember(store, handover.family_id, actorId);
  if (!allowed) {
    throw new Error("Only a family member or the next caregiver can acknowledge this handover.");
  }
  if (handover.status === "acknowledged") {
    return handover; // already acknowledged: nothing to change, no duplicate activity
  }

  handover.status = "acknowledged";
  handover.acknowledged_by = actorId;
  handover.acknowledged_at = new Date().toISOString();
  writeStore(store);

  addActivity({
    familyId: handover.family_id,
    actorId,
    action: "handover.acknowledged",
    entityType: "handover",
    entityId: handover.id,
    message: "Acknowledged a care handover.",
  });
  return handover;
}

/** Lists a family's handovers, newest created first. */
export function listHandovers(familyId: string): CareHandover[] {
  const store = readStore();
  // Reverse first so equal timestamps keep newest-inserted first (stable sort).
  return store.care_handovers
    .filter((h) => h.family_id === familyId)
    .reverse()
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}


// ---- Phase 6: wellness check-ins, emergency requests, elder language ----
// Demo mode only. Emergency requests here are recorded in the app only; they do not contact anyone outside the app. Nanu's AI never treats a missed check-in as a medical emergency.

const WELLNESS_STATUSES: WellnessStatus[] = ["ok", "need_assistance", "contact_family"];
const LANGUAGE_CODES: LanguageCode[] = ["en", "hi"];
const ELDER_ONLY_MESSAGE = "Only the elder can submit their own check-in.";
const EMERGENCY_RECIPIENT_ROLES: Role[] = ["owner", "family_member"];

/** True when this user holds the elder role in this family. */
function isElderMember(store: DemoStore, familyId: string, userId: string): boolean {
  return store.family_members.some(
    (m) => m.family_id === familyId && m.user_id === userId && m.role === "elder",
  );
}

export function submitWellnessCheckin({
  familyId,
  elderId,
  submittedBy,
  status,
  notes = null,
}: {
  familyId: string;
  elderId: string;
  submittedBy: string;
  status: WellnessStatus;
  notes?: string | null;
}): WellnessCheckin {
  if (!WELLNESS_STATUSES.includes(status)) {
    throw new Error("Choose how you are feeling.");
  }
  const store = readStore();
  if (!isElderMember(store, familyId, submittedBy)) {
    throw new Error(ELDER_ONLY_MESSAGE);
  }

  const checkin: WellnessCheckin = {
    id: crypto.randomUUID(),
    family_id: familyId,
    elder_id: elderId,
    submitted_by: submittedBy,
    status,
    notes: textOrNull(notes),
    created_at: new Date().toISOString(),
  };
  store.wellness_checkins.push(checkin);
  writeStore(store);

  addActivity({
    familyId,
    actorId: submittedBy,
    action: "wellness.checkin",
    entityType: "wellness_checkin",
    entityId: checkin.id,
    message: `Submitted a wellness check-in (${status}).`,
  });
  return checkin;
}

/** Newest first. */
export function listWellnessCheckins(familyId: string): WellnessCheckin[] {
  const store = readStore();
  // Reverse first so equal timestamps keep newest-inserted first (stable sort).
  return store.wellness_checkins
    .filter((c) => c.family_id === familyId)
    .reverse()
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * Opens an emergency request raised by the elder. Owners and family members are notified in the app.
 * Nothing is sent outside the app and no emergency service is contacted.
 */
export function requestEmergency({
  familyId,
  elderId,
  requestedBy,
  message = null,
}: {
  familyId: string;
  elderId: string;
  requestedBy: string;
  message?: string | null;
}): EmergencyRequest {
  const store = readStore();
  if (!isElderMember(store, familyId, requestedBy)) {
    throw new Error(ELDER_ONLY_MESSAGE);
  }

  const cleanMessage = textOrNull(message);
  const request: EmergencyRequest = {
    id: crypto.randomUUID(),
    family_id: familyId,
    elder_id: elderId,
    requested_by: requestedBy,
    message: cleanMessage,
    status: "open",
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
  };
  store.emergency_requests.push(request);
  writeStore(store);

  const elder =
    store.elder_profiles.find((e) => e.id === elderId) ??
    store.elder_profiles.find((e) => e.family_id === familyId);
  const elderName = elder?.display_name ?? "the elder";
  const body =
    "Open Nanu's AI and check the request. The app does not contact emergency services." +
    (cleanMessage ? ` ${cleanMessage}` : "");

  const recipients = store.family_members.filter(
    (m) => m.family_id === familyId && EMERGENCY_RECIPIENT_ROLES.includes(m.role),
  );
  for (const recipient of recipients) {
    createNotification({
      familyId,
      userId: recipient.user_id,
      eventType: "emergency_request",
      title: `Emergency request from ${elderName}`,
      message: body,
      dedupeKey: `emergency:${request.id}:${recipient.user_id}`,
    });
  }

  addActivity({
    familyId,
    actorId: requestedBy,
    action: "emergency.requested",
    entityType: "emergency_request",
    entityId: request.id,
    message: `Raised an emergency request for ${elderName}.`,
  });
  return request;
}

/** Records that a family member has seen an emergency request. Never resolves it automatically. */
export function acknowledgeEmergency(requestId: string, actorId: string): EmergencyRequest {
  const store = readStore();
  const request = store.emergency_requests.find((r) => r.id === requestId);
  if (!request) {
    throw new Error("Emergency request not found.");
  }
  if (!isFamilyOwnerOrMember(store, request.family_id, actorId)) {
    throw new Error("Only a family member can acknowledge an emergency request.");
  }
  if (request.status === "resolved") {
    throw new Error("This emergency request is already resolved.");
  }
  if (request.status === "acknowledged") {
    return request; // already acknowledged: nothing to change, no duplicate activity
  }

  request.status = "acknowledged";
  request.acknowledged_by = actorId;
  request.acknowledged_at = new Date().toISOString();
  writeStore(store);

  addActivity({
    familyId: request.family_id,
    actorId,
    action: "emergency.acknowledged",
    entityType: "emergency_request",
    entityId: request.id,
    message: "Acknowledged an emergency request.",
  });
  return request;
}

/** Marks an open or acknowledged emergency request as resolved. */
export function resolveEmergency(requestId: string, actorId: string): EmergencyRequest {
  const store = readStore();
  const request = store.emergency_requests.find((r) => r.id === requestId);
  if (!request) {
    throw new Error("Emergency request not found.");
  }
  if (!isFamilyOwnerOrMember(store, request.family_id, actorId)) {
    throw new Error("Only a family member can acknowledge an emergency request.");
  }
  if (request.status !== "open" && request.status !== "acknowledged") {
    throw new Error("This emergency request is already resolved.");
  }

  request.status = "resolved";
  request.resolved_at = new Date().toISOString();
  writeStore(store);

  addActivity({
    familyId: request.family_id,
    actorId,
    action: "emergency.resolved",
    entityType: "emergency_request",
    entityId: request.id,
    message: "Resolved an emergency request.",
  });
  return request;
}

/** Newest first. */
export function listEmergencyRequests(familyId: string): EmergencyRequest[] {
  const store = readStore();
  // Reverse first so equal timestamps keep newest-inserted first (stable sort).
  return store.emergency_requests
    .filter((r) => r.family_id === familyId)
    .reverse()
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getElderPreferences(userId: string): ElderPreferences | null {
  const store = readStore();
  return store.elder_preferences.find((p) => p.user_id === userId) ?? null;
}

/** Saves the elder's display language, creating the preference record on first use. */
export function setElderLanguage(userId: string, language: LanguageCode): ElderPreferences {
  if (!LANGUAGE_CODES.includes(language)) {
    throw new Error("Unsupported language.");
  }
  const store = readStore();
  const now = new Date().toISOString();
  const existing = store.elder_preferences.find((p) => p.user_id === userId);
  if (existing) {
    existing.language = language;
    existing.updated_at = now;
    writeStore(store);
    return existing;
  }

  const preferences: ElderPreferences = { user_id: userId, language, updated_at: now };
  store.elder_preferences.push(preferences);
  writeStore(store);
  return preferences;
}

/**
 * The elder's own confirmation. Caregiver assistance is recorded separately and never sets this.
 * Only the elder member of the family may call it.
 */
export function recordElderMedicineConfirmation({
  medicationId,
  familyId,
  scheduledAt,
  actorId,
  status,
}: {
  medicationId: string;
  familyId: string;
  scheduledAt: string;
  actorId: string;
  status: ParentConfirmation;
}): MedicationEvent {
  const store = readStore();
  if (!isElderMember(store, familyId, actorId)) {
    throw new Error("Only the elder can confirm their own medicines.");
  }
  return recordParentConfirmation({ medicationId, familyId, scheduledAt, actorId, status });
}


