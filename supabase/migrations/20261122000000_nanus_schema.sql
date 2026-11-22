-- ============================================================================
-- NANU'S AI — Core PostgreSQL Schema Migration
-- Migration: 20261122000000_nanus_schema.sql
-- "Care is love, made visible."
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. FAMILIES
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. FAMILY_MEMBERS
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL CHECK (role IN ('owner', 'family_member', 'caregiver', 'elder')),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'revoked')),
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_family_user UNIQUE (family_id, user_id)
);

-- 4. ELDER_PROFILES
CREATE TABLE IF NOT EXISTS public.elder_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    date_of_birth DATE,
    emergency_contact TEXT,
    medical_notes TEXT,
    accessibility_preferences JSONB NOT NULL DEFAULT '{"large_text": true, "high_contrast": false, "voice_input": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. CAREGIVER_PROFILES
CREATE TABLE IF NOT EXISTS public.caregiver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    experience TEXT,
    qualifications TEXT,
    contact_phone TEXT,
    emergency_contact TEXT,
    identity_status VARCHAR(32) NOT NULL DEFAULT 'not_submitted' 
        CHECK (identity_status IN ('not_submitted', 'submitted', 'pending_review', 'verified', 'rejected', 'expired')),
    reference_status VARCHAR(32) NOT NULL DEFAULT 'not_submitted'
        CHECK (reference_status IN ('not_submitted', 'submitted', 'pending_review', 'verified', 'rejected', 'expired')),
    background_status VARCHAR(32) NOT NULL DEFAULT 'not_submitted'
        CHECK (background_status IN ('not_submitted', 'submitted', 'pending_review', 'verified', 'rejected', 'expired')),
    family_approval VARCHAR(32) NOT NULL DEFAULT 'pending'
        CHECK (family_approval IN ('pending', 'approved', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_caregiver_family UNIQUE (user_id, family_id)
);

-- 6. CAREGIVER_ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.caregiver_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
    caregiver_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'terminated')),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. MEDICATION_RECORDS
CREATE TABLE IF NOT EXISTS public.medication_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    prescribed_instructions TEXT NOT NULL,
    frequency TEXT NOT NULL,
    scheduled_times TEXT[] NOT NULL DEFAULT '{}',
    start_date DATE NOT NULL,
    end_date DATE,
    prescribing_clinician TEXT,
    refill_date DATE,
    refill_responsible UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stopped', 'completed')),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. MEDICATION_EVENTS (Dual Confirmation: Parent Confirmation + Caregiver Assistance)
CREATE TABLE IF NOT EXISTS public.medication_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_id UUID NOT NULL REFERENCES public.medication_records(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    parent_confirmation VARCHAR(32) CHECK (parent_confirmation IN ('taken', 'skipped', 'unable_to_confirm')),
    parent_confirmed_at TIMESTAMPTZ,
    caregiver_assistance_status VARCHAR(32) CHECK (caregiver_assistance_status IN ('assisted', 'not_assisted')),
    caregiver_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    caregiver_recorded_at TIMESTAMPTZ,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. CARE_TASKS
CREATE TABLE IF NOT EXISTS public.care_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR(32) NOT NULL DEFAULT 'other' CHECK (category IN ('medication', 'appointment', 'household', 'health', 'other')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    backup_assignee UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ,
    priority VARCHAR(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    status VARCHAR(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
    completed_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. CAREGIVER_SHIFTS
CREATE TABLE IF NOT EXISTS public.caregiver_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
    caregiver_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    check_in_at TIMESTAMPTZ,
    check_out_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'checked_in', 'completed', 'missed')),
    shift_notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. CAREGIVER_ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS public.caregiver_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.care_tasks(id) ON DELETE SET NULL,
    activity_type VARCHAR(32) NOT NULL CHECK (activity_type IN ('task_completed', 'medication_assistance', 'check_in', 'check_out', 'report', 'handover')),
    description TEXT NOT NULL,
    evidence_path TEXT,
    disputed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. WELLNESS_CHECKINS
CREATE TABLE IF NOT EXISTS public.wellness_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL CHECK (status IN ('ok', 'need_assistance', 'contact_family')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    provider TEXT,
    location TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. DOCUMENTS
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    storage_path TEXT NOT NULL,
    document_type VARCHAR(32) NOT NULL CHECK (document_type IN ('prescription', 'report', 'other')),
    title TEXT NOT NULL,
    document_date DATE,
    file_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. CARE_HANDOVERS
CREATE TABLE IF NOT EXISTS public.care_handovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
    from_user UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'acknowledged')),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 16. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    dedupe_key TEXT NOT NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'sms')),
    delivery_status VARCHAR(32) NOT NULL DEFAULT 'delivered' CHECK (delivery_status IN ('pending', 'delivered', 'failed')),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 17. FAMILY_JOURNAL
CREATE TABLE IF NOT EXISTS public.family_journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'daily_note' 
        CHECK (category IN ('visit_summary', 'daily_note', 'milestone', 'photo_memory', 'health_observation')),
    attachment_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 18. FAMILY_JOURNAL_COMMENTS
CREATE TABLE IF NOT EXISTS public.family_journal_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES public.family_journal(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 19. CAREGIVER_EXPENSES
CREATE TABLE IF NOT EXISTS public.caregiver_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
    caregiver_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category VARCHAR(32) NOT NULL CHECK (category IN ('medication_purchase', 'groceries_supplies', 'medical_transport', 'clinic_copay', 'other')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    description TEXT NOT NULL,
    receipt_path TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'pending_reimbursement' CHECK (status IN ('pending_reimbursement', 'reimbursed', 'disputed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 20. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 21. NOTIFICATION_PREFERENCES
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'in_app',
    enabled BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT uq_user_pref UNIQUE (user_id, event_type, channel)
);

-- 22. INVITATIONS
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    assigned_role VARCHAR(32) NOT NULL CHECK (assigned_role IN ('family_member', 'caregiver')),
    token_hash TEXT NOT NULL,
    code TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    accepted_at TIMESTAMPTZ
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_members_family ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_family ON public.care_tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.care_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.care_tasks(status, due_at);
CREATE INDEX IF NOT EXISTS idx_meds_elder ON public.medication_records(elder_id);
CREATE INDEX IF NOT EXISTS idx_med_events_med ON public.medication_events(medication_id);
CREATE INDEX IF NOT EXISTS idx_shifts_caregiver ON public.caregiver_shifts(caregiver_user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_time ON public.caregiver_shifts(scheduled_start, status);
CREATE INDEX IF NOT EXISTS idx_journal_family ON public.family_journal(family_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_dedupe ON public.notifications(dedupe_key);
