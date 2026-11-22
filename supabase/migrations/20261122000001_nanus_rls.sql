-- ============================================================================
-- NANU'S AI — PostgreSQL Row Level Security (RLS) Policies
-- Migration: 20261122000001_nanus_rls.sql
-- Zero cross-family leakage. Strict role authorization.
-- ============================================================================

-- HELPER SECURITY DEFINER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_family_member(f_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = f_id AND user_id = u_id AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_family_owner(f_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = f_id AND user_id = u_id AND role = 'owner' AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_caregiver(f_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.caregiver_assignments
        WHERE family_id = f_id AND caregiver_user_id = u_id AND status = 'active'
    );
$$;

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_journal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in shared family"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members m1
            JOIN public.family_members m2 ON m1.family_id = m2.family_id
            WHERE m1.user_id = auth.uid() AND m2.user_id = public.profiles.id
            AND m1.status = 'active' AND m2.status = 'active'
        )
    );

-- 2. FAMILIES POLICIES
CREATE POLICY "Active family members can view family"
    ON public.families FOR SELECT
    USING (public.is_family_member(id, auth.uid()));

CREATE POLICY "Family owners can update family"
    ON public.families FOR UPDATE
    USING (public.is_family_owner(id, auth.uid()));

-- 3. FAMILY_MEMBERS POLICIES
CREATE POLICY "Members can view membership of their family"
    ON public.family_members FOR SELECT
    USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Family owners can insert and manage members"
    ON public.family_members FOR ALL
    USING (public.is_family_owner(family_id, auth.uid()));

-- 4. ELDER_PROFILES POLICIES
CREATE POLICY "Family members and assigned caregivers view elder profiles"
    ON public.elder_profiles FOR SELECT
    USING (
        public.is_family_member(family_id, auth.uid()) OR
        public.is_assigned_caregiver(family_id, auth.uid()) OR
        user_id = auth.uid()
    );

CREATE POLICY "Family members can manage elder profiles"
    ON public.elder_profiles FOR ALL
    USING (public.is_family_member(family_id, auth.uid()));

-- 5. CAREGIVER_PROFILES POLICIES
CREATE POLICY "Caregivers can view and update own profile"
    ON public.caregiver_profiles FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Family members can view caregiver profile in their family"
    ON public.caregiver_profiles FOR SELECT
    USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Family owners can update caregiver approval status"
    ON public.caregiver_profiles FOR UPDATE
    USING (public.is_family_owner(family_id, auth.uid()));

-- 6. CAREGIVER_ASSIGNMENTS POLICIES
CREATE POLICY "Caregivers view own assignments; Family views all assignments"
    ON public.caregiver_assignments FOR SELECT
    USING (
        caregiver_user_id = auth.uid() OR
        public.is_family_member(family_id, auth.uid())
    );

CREATE POLICY "Family owners manage caregiver assignments"
    ON public.caregiver_assignments FOR ALL
    USING (public.is_family_owner(family_id, auth.uid()));

-- 7. MEDICATION_RECORDS POLICIES
CREATE POLICY "Family members manage medication records"
    ON public.medication_records FOR ALL
    USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Assigned caregivers view medication records"
    ON public.medication_records FOR SELECT
    USING (public.is_assigned_caregiver(family_id, auth.uid()));

-- 8. MEDICATION_EVENTS POLICIES
CREATE POLICY "Family and caregivers view medication events"
    ON public.medication_events FOR SELECT
    USING (
        public.is_family_member(family_id, auth.uid()) OR
        public.is_assigned_caregiver(family_id, auth.uid())
    );

CREATE POLICY "Authorized stakeholders insert/update medication events"
    ON public.medication_events FOR ALL
    USING (
        public.is_family_member(family_id, auth.uid()) OR
        public.is_assigned_caregiver(family_id, auth.uid())
    );

-- 9. CARE_TASKS POLICIES
CREATE POLICY "Family members manage care tasks"
    ON public.care_tasks FOR ALL
    USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Assigned caregivers view and update assigned tasks"
    ON public.care_tasks FOR ALL
    USING (
        public.is_assigned_caregiver(family_id, auth.uid()) AND
        (assigned_to = auth.uid() OR backup_assignee = auth.uid())
    );

-- 10. CAREGIVER_SHIFTS POLICIES
CREATE POLICY "Caregivers view and check-in/out own shifts; Family views shifts"
    ON public.caregiver_shifts FOR SELECT
    USING (
        caregiver_user_id = auth.uid() OR
        public.is_family_member(family_id, auth.uid())
    );

CREATE POLICY "Caregivers update own shift status (check in / out)"
    ON public.caregiver_shifts FOR UPDATE
    USING (caregiver_user_id = auth.uid());

CREATE POLICY "Family owners manage caregiver shifts"
    ON public.caregiver_shifts FOR ALL
    USING (public.is_family_owner(family_id, auth.uid()));

-- 11. CAREGIVER_ACTIVITY_LOGS POLICIES
CREATE POLICY "Caregivers record own logs; Family views all logs"
    ON public.caregiver_activity_logs FOR SELECT
    USING (
        caregiver_id = auth.uid() OR
        public.is_family_member(family_id, auth.uid())
    );

CREATE POLICY "Caregivers insert own activity logs"
    ON public.caregiver_activity_logs FOR INSERT
    WITH CHECK (caregiver_id = auth.uid());

CREATE POLICY "Family members can dispute activity logs"
    ON public.caregiver_activity_logs FOR UPDATE
    USING (public.is_family_member(family_id, auth.uid()));

-- 12. WELLNESS_CHECKINS POLICIES
CREATE POLICY "Family members view wellness checkins"
    ON public.wellness_checkins FOR SELECT
    USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Elder or proxy inserts wellness checkin"
    ON public.wellness_checkins FOR INSERT
    WITH CHECK (
        submitted_by = auth.uid() OR
        public.is_family_member(family_id, auth.uid())
    );

-- 13. APPOINTMENTS POLICIES
CREATE POLICY "Family members manage appointments"
    ON public.appointments FOR ALL
    USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Assigned caregivers view assigned appointments"
    ON public.appointments FOR SELECT
    USING (
        public.is_assigned_caregiver(family_id, auth.uid()) AND
        assigned_to = auth.uid()
    );

-- 14. DOCUMENTS POLICIES (Private Vault)
CREATE POLICY "Family members manage documents"
    ON public.documents FOR ALL
    USING (public.is_family_member(family_id, auth.uid()));

-- 15. CARE_HANDOVERS POLICIES
CREATE POLICY "Family and caregivers view and acknowledge handovers"
    ON public.care_handovers FOR ALL
    USING (
        public.is_family_member(family_id, auth.uid()) OR
        public.is_assigned_caregiver(family_id, auth.uid())
    );

-- 16. NOTIFICATIONS POLICIES
CREATE POLICY "Users access own notifications only"
    ON public.notifications FOR ALL
    USING (user_id = auth.uid());

-- 17. FAMILY_JOURNAL POLICIES (Strictly Private to Family Members)
CREATE POLICY "Family members view and manage private journal"
    ON public.family_journal FOR ALL
    USING (public.is_family_member(family_id, auth.uid()));

-- 18. FAMILY_JOURNAL_COMMENTS POLICIES
CREATE POLICY "Family members view and comment on journal entries"
    ON public.family_journal_comments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_journal j
            WHERE j.id = entry_id AND public.is_family_member(j.family_id, auth.uid())
        )
    );

-- 19. CAREGIVER_EXPENSES POLICIES
CREATE POLICY "Caregivers insert and view own expenses"
    ON public.caregiver_expenses FOR ALL
    USING (caregiver_user_id = auth.uid());

CREATE POLICY "Family owners review and reimburse expenses"
    ON public.caregiver_expenses FOR ALL
    USING (public.is_family_owner(family_id, auth.uid()));

-- 20. AUDIT_LOGS POLICIES (Immutable)
CREATE POLICY "Family members view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_family_member(family_id, auth.uid()));

-- 21. NOTIFICATION_PREFERENCES POLICIES
CREATE POLICY "Users manage own notification preferences"
    ON public.notification_preferences FOR ALL
    USING (user_id = auth.uid());

-- 22. INVITATIONS POLICIES
CREATE POLICY "Family owners manage invitations"
    ON public.invitations FOR ALL
    USING (public.is_family_owner(family_id, auth.uid()));
