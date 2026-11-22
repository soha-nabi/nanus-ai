-- ============================================================================
-- NANU'S AI — Database Functions & Transactional Automation
-- Migration: 20261122000002_nanus_functions.sql
-- Idempotent event processing, deduplicated alerts, and automated escalations
-- ============================================================================

-- 1. SEND_NOTIFICATION (Idempotent Notification Dispatcher)
CREATE OR REPLACE FUNCTION public.send_notification(
    p_user_id UUID,
    p_family_id UUID,
    p_event_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_dedupe_key TEXT,
    p_channel VARCHAR(32) DEFAULT 'in_app'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pref_enabled BOOLEAN;
    v_notification_id UUID;
BEGIN
    -- Check user notification preferences
    SELECT enabled INTO v_pref_enabled
    FROM public.notification_preferences
    WHERE user_id = p_user_id AND event_type = p_event_type AND channel = p_channel;

    IF v_pref_enabled IS NOT NULL AND v_pref_enabled = false THEN
        RETURN NULL; -- Notification muted by user preference
    END IF;

    -- Deduplication: Do not create duplicate notification within 1 hour
    SELECT id INTO v_notification_id
    FROM public.notifications
    WHERE dedupe_key = p_dedupe_key AND created_at > (now() - INTERVAL '1 hour');

    IF v_notification_id IS NOT NULL THEN
        RETURN v_notification_id; -- Already dispatched recently
    END IF;

    INSERT INTO public.notifications (
        user_id,
        family_id,
        event_type,
        title,
        message,
        dedupe_key,
        channel,
        delivery_status
    ) VALUES (
        p_user_id,
        p_family_id,
        p_event_type,
        p_title,
        p_message,
        p_dedupe_key,
        p_channel,
        'delivered'
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$;

-- 2. CHECK_OVERDUE_TASKS & ESCALATE_UNRESOLVED_TASKS
CREATE OR REPLACE FUNCTION public.check_overdue_tasks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r_task RECORD;
    v_owner_id UUID;
    v_count INTEGER := 0;
BEGIN
    FOR r_task IN
        SELECT t.id, t.family_id, t.title, t.assigned_to, t.backup_assignee, t.due_at
        FROM public.care_tasks t
        WHERE t.status = 'open'
          AND t.due_at IS NOT NULL
          AND t.due_at < now()
    LOOP
        -- Find family owner
        SELECT user_id INTO v_owner_id
        FROM public.family_members
        WHERE family_id = r_task.family_id AND role = 'owner'
        LIMIT 1;

        -- Notify assignee if assigned
        IF r_task.assigned_to IS NOT NULL THEN
            PERFORM public.send_notification(
                r_task.assigned_to,
                r_task.family_id,
                'task_overdue',
                'Overdue Care Task: ' || r_task.title,
                'The care responsibility "' || r_task.title || '" passed its scheduled deadline.',
                'overdue-task-' || r_task.id || '-' || to_char(now(), 'YYYYMMDD-HH24')
            );
        END IF;

        -- Escalate to backup assignee or family owner if overdue > 2 hours
        IF r_task.due_at < (now() - INTERVAL '2 hours') THEN
            IF r_task.backup_assignee IS NOT NULL THEN
                PERFORM public.send_notification(
                    r_task.backup_assignee,
                    r_task.family_id,
                    'task_escalated',
                    'Escalated Responsibility: ' || r_task.title,
                    'Care task "' || r_task.title || '" is unresolved. Reassigned to designated backup.',
                    'escalated-backup-' || r_task.id || '-' || to_char(now(), 'YYYYMMDD')
                );
            ELSIF v_owner_id IS NOT NULL THEN
                PERFORM public.send_notification(
                    v_owner_id,
                    r_task.family_id,
                    'task_escalated',
                    'Escalation: Unresolved Care Task',
                    'Task "' || r_task.title || '" has not been acknowledged.',
                    'escalated-owner-' || r_task.id || '-' || to_char(now(), 'YYYYMMDD')
                );
            END IF;
        END IF;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- 3. CHECK_MISSED_SHIFTS
CREATE OR REPLACE FUNCTION public.check_missed_shifts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r_shift RECORD;
    v_owner_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Shifts that should have started > 30 minutes ago and have not checked in
    FOR r_shift IN
        SELECT s.id, s.family_id, s.caregiver_user_id, s.scheduled_start
        FROM public.caregiver_shifts s
        WHERE s.status = 'scheduled'
          AND s.scheduled_start < (now() - INTERVAL '30 minutes')
    LOOP
        -- Mark as missed
        UPDATE public.caregiver_shifts
        SET status = 'missed'
        WHERE id = r_shift.id;

        -- Find family owner
        SELECT user_id INTO v_owner_id
        FROM public.family_members
        WHERE family_id = r_shift.family_id AND role = 'owner'
        LIMIT 1;

        -- Notify caregiver
        PERFORM public.send_notification(
            r_shift.caregiver_user_id,
            r_shift.family_id,
            'shift_missed',
            'Missed Shift Alert',
            'Your scheduled shift start has passed without check-in.',
            'missed-shift-caregiver-' || r_shift.id
        );

        -- Escalate to family owner
        IF v_owner_id IS NOT NULL THEN
            PERFORM public.send_notification(
                v_owner_id,
                r_shift.family_id,
                'shift_missed_escalated',
                'Caregiver Shift Attendance Alert',
                'Scheduled shift check-in was not recorded within the 30-minute grace period.',
                'missed-shift-family-' || r_shift.id
            );
        END IF;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- 4. RECORD_MEDICATION_EVENT (Enforces separate parent and caregiver confirmation)
CREATE OR REPLACE FUNCTION public.record_medication_event(
    p_medication_id UUID,
    p_status VARCHAR(32), -- 'taken', 'skipped', 'unable_to_confirm' OR 'assisted', 'not_assisted'
    p_actor_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_med RECORD;
    v_event_id UUID;
    v_is_caregiver BOOLEAN;
BEGIN
    SELECT * INTO v_med FROM public.medication_records WHERE id = p_medication_id;
    IF v_med IS NULL THEN
        RAISE EXCEPTION 'Medication record % not found', p_medication_id;
    END IF;

    -- Determine if actor is caregiver
    SELECT EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = v_med.family_id AND user_id = p_actor_id AND role = 'caregiver'
    ) INTO v_is_caregiver;

    -- Check if today's event already exists
    SELECT id INTO v_event_id
    FROM public.medication_events
    WHERE medication_id = p_medication_id
      AND scheduled_at::date = now()::date
    LIMIT 1;

    IF v_event_id IS NULL THEN
        INSERT INTO public.medication_events (
            medication_id,
            family_id,
            scheduled_at,
            parent_confirmation,
            parent_confirmed_at,
            caregiver_assistance_status,
            caregiver_user_id,
            caregiver_recorded_at,
            notes
        ) VALUES (
            p_medication_id,
            v_med.family_id,
            now(),
            CASE WHEN NOT v_is_caregiver THEN p_status ELSE NULL END,
            CASE WHEN NOT v_is_caregiver THEN now() ELSE NULL END,
            CASE WHEN v_is_caregiver THEN p_status ELSE NULL END,
            CASE WHEN v_is_caregiver THEN p_actor_id ELSE NULL END,
            CASE WHEN v_is_caregiver THEN now() ELSE NULL END,
            p_notes
        )
        RETURNING id INTO v_event_id;
    ELSE
        IF v_is_caregiver THEN
            UPDATE public.medication_events
            SET caregiver_assistance_status = p_status,
                caregiver_user_id = p_actor_id,
                caregiver_recorded_at = now(),
                notes = COALESCE(p_notes, notes)
            WHERE id = v_event_id;
        ELSE
            UPDATE public.medication_events
            SET parent_confirmation = p_status,
                parent_confirmed_at = now(),
                notes = COALESCE(p_notes, notes)
            WHERE id = v_event_id;
        END IF;
    END IF;

    -- Audit log
    INSERT INTO public.audit_logs (
        family_id,
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_med.family_id,
        p_actor_id,
        'medication_event_recorded',
        'medication_event',
        v_event_id::text,
        jsonb_build_object('status', p_status, 'is_caregiver', v_is_caregiver)
    );

    RETURN v_event_id;
END;
$$;

-- 5. CAREGIVER_CHECK_IN
CREATE OR REPLACE FUNCTION public.caregiver_check_in(
    p_shift_id UUID,
    p_caregiver_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_shift RECORD;
BEGIN
    SELECT * INTO v_shift FROM public.caregiver_shifts
    WHERE id = p_shift_id AND caregiver_user_id = p_caregiver_id;

    IF v_shift IS NULL THEN
        RAISE EXCEPTION 'Shift not found or unassigned for caregiver';
    END IF;

    UPDATE public.caregiver_shifts
    SET status = 'checked_in',
        check_in_at = now(),
        shift_notes = COALESCE(p_notes, shift_notes)
    WHERE id = p_shift_id;

    -- Record in activity logs
    INSERT INTO public.caregiver_activity_logs (
        family_id,
        caregiver_id,
        activity_type,
        description
    ) VALUES (
        v_shift.family_id,
        p_caregiver_id,
        'check_in',
        'Caregiver recorded shift check-in: ' || COALESCE(p_notes, 'Punctual arrival confirmed.')
    );
END;
$$;

-- 6. CAREGIVER_CHECK_OUT
CREATE OR REPLACE FUNCTION public.caregiver_check_out(
    p_shift_id UUID,
    p_caregiver_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_shift RECORD;
BEGIN
    SELECT * INTO v_shift FROM public.caregiver_shifts
    WHERE id = p_shift_id AND caregiver_user_id = p_caregiver_id;

    IF v_shift IS NULL THEN
        RAISE EXCEPTION 'Shift not found or unassigned for caregiver';
    END IF;

    UPDATE public.caregiver_shifts
    SET status = 'completed',
        check_out_at = now(),
        shift_notes = COALESCE(p_notes, shift_notes)
    WHERE id = p_shift_id;

    INSERT INTO public.caregiver_activity_logs (
        family_id,
        caregiver_id,
        activity_type,
        description
    ) VALUES (
        v_shift.family_id,
        p_caregiver_id,
        'check_out',
        'Shift concluded: ' || COALESCE(p_notes, 'Care handover submitted.')
    );
END;
$$;

-- 7. GENERATE_CARE_HANDOVER
CREATE OR REPLACE FUNCTION public.generate_care_handover(
    p_family_id UUID,
    p_elder_id UUID,
    p_from_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_handover_id UUID;
    v_completed_tasks JSONB;
    v_pending_tasks JSONB;
    v_summary JSONB;
BEGIN
    -- Aggregate completed tasks from past 24 hours
    SELECT jsonb_agg(jsonb_build_object('id', id, 'title', title))
    INTO v_completed_tasks
    FROM public.care_tasks
    WHERE family_id = p_family_id AND status = 'completed' AND completed_at > (now() - INTERVAL '24 hours');

    -- Aggregate pending and overdue tasks
    SELECT jsonb_agg(jsonb_build_object('id', id, 'title', title, 'overdue', (due_at < now())))
    INTO v_pending_tasks
    FROM public.care_tasks
    WHERE family_id = p_family_id AND status = 'open';

    v_summary := jsonb_build_object(
        'generated_at', now(),
        'completed_tasks', COALESCE(v_completed_tasks, '[]'::jsonb),
        'pending_tasks', COALESCE(v_pending_tasks, '[]'::jsonb),
        'notes', 'Shift care handover generated for family review.'
    );

    INSERT INTO public.care_handovers (
        family_id,
        elder_id,
        from_user,
        summary,
        status
    ) VALUES (
        p_family_id,
        p_elder_id,
        p_from_user_id,
        v_summary,
        'sent'
    )
    RETURNING id INTO v_handover_id;

    RETURN v_handover_id;
END;
$$;

-- 8. PROCESS_EMERGENCY_REQUEST
CREATE OR REPLACE FUNCTION public.process_emergency_request(
    p_elder_id UUID,
    p_message TEXT DEFAULT 'Elder parent initiated Emergency SOS help request.'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_elder RECORD;
    r_member RECORD;
BEGIN
    SELECT * INTO v_elder FROM public.elder_profiles WHERE id = p_elder_id;
    IF v_elder IS NULL THEN
        RAISE EXCEPTION 'Elder profile not found';
    END IF;

    -- Alert all active family members immediately
    FOR r_member IN
        SELECT user_id FROM public.family_members
        WHERE family_id = v_elder.family_id AND status = 'active'
    LOOP
        PERFORM public.send_notification(
            r_member.user_id,
            v_elder.family_id,
            'emergency_sos',
            '🚨 EMERGENCY ALERT: ' || v_elder.display_name,
            p_message,
            'emergency-' || v_elder.id || '-' || to_char(now(), 'YYYYMMDD-HH24MI'),
            'in_app'
        );
    END LOOP;
END;
$$;
