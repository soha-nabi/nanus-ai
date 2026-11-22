-- ============================================================================
-- NANU'S AI — Synthetic Demonstration Seed Data
-- File: supabase/seed.sql
-- Sharma Family: Rajesh Sharma (75), Ananya (Bengaluru), Arjun (Hyderabad), Ramesh (Caregiver)
-- Strictly Synthetic Demonstration Data — Never Real Patient Data
-- ============================================================================

-- Fixed UUIDs for repeatable testing
DO $$
DECLARE
    v_ananya_id UUID := '00000000-0000-0000-0000-000000000001';
    v_arjun_id UUID := '00000000-0000-0000-0000-000000000002';
    v_ramesh_id UUID := '00000000-0000-0000-0000-000000000003';
    v_rajesh_id UUID := '00000000-0000-0000-0000-000000000004';
    v_family_id UUID := '11111111-1111-1111-1111-111111111111';
    v_elder_id UUID := '22222222-2222-2222-2222-222222222222';
    v_med1_id UUID := '33333333-3333-3333-3333-333333333331';
    v_med2_id UUID := '33333333-3333-3333-3333-333333333332';
    v_med3_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- Profiles
    INSERT INTO public.profiles (id, full_name, email, phone, preferred_language, timezone)
    VALUES
      (v_ananya_id, 'Ananya Sharma (Bengaluru)', 'ananya@sharma.demo', '+91 98860 11223', 'en', 'Asia/Kolkata'),
      (v_arjun_id, 'Arjun Sharma (Hyderabad)', 'arjun@sharma.demo', '+91 98490 33445', 'en', 'Asia/Kolkata'),
      (v_ramesh_id, 'Ramesh Kumar (Caregiver)', 'ramesh@caregiver.demo', '+91 98765 43210', 'en', 'Asia/Kolkata'),
      (v_rajesh_id, 'Rajesh Sharma (Age 75)', 'rajesh@elder.demo', '+91 98480 55667', 'hi', 'Asia/Kolkata')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Family Workspace
    INSERT INTO public.families (id, name, created_by, timezone)
    VALUES (v_family_id, 'Sharma Family (Synthetic Demo)', v_ananya_id, 'Asia/Kolkata')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    -- Elder Profile
    INSERT INTO public.elder_profiles (id, family_id, user_id, display_name, date_of_birth, emergency_contact, medical_notes)
    VALUES (
      v_elder_id,
      v_family_id,
      v_rajesh_id,
      'Rajesh Sharma (Age 75)',
      '1951-04-12',
      'Ananya Sharma (+91 98860 11223) / Arjun Sharma (+91 98490 33445)',
      'Hypertension, Type-2 Glycemic Care, Mild Knee Osteoarthritis'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Family Members
    INSERT INTO public.family_members (family_id, user_id, role, status)
    VALUES
      (v_family_id, v_ananya_id, 'owner', 'active'),
      (v_family_id, v_arjun_id, 'family_member', 'active'),
      (v_family_id, v_ramesh_id, 'caregiver', 'active'),
      (v_family_id, v_rajesh_id, 'elder', 'active')
    ON CONFLICT (family_id, user_id) DO UPDATE SET status = 'active';

    -- Caregiver Profile
    INSERT INTO public.caregiver_profiles (
      user_id, family_id, experience, qualifications, contact_phone, emergency_contact,
      identity_status, reference_status, background_status, family_approval
    ) VALUES (
      v_ramesh_id, v_family_id,
      '7 years geriatric home-care experience in Hyderabad. Certified nursing assistant.',
      'CNA, Senior First-Aid & CPR Certified (Red Cross India)',
      '+91 98765 43210', '+91 98765 43211',
      'verified', 'verified', 'pending_review', 'approved'
    )
    ON CONFLICT (user_id, family_id) DO NOTHING;

    -- Caregiver Assignment
    INSERT INTO public.caregiver_assignments (family_id, elder_id, caregiver_user_id, assigned_by, status, start_date)
    VALUES (v_family_id, v_elder_id, v_ramesh_id, v_ananya_id, 'active', CURRENT_DATE - 30)
    ON CONFLICT DO NOTHING;

    -- Caregiver Shift (Today)
    INSERT INTO public.caregiver_shifts (family_id, elder_id, caregiver_user_id, scheduled_start, scheduled_end, check_in_at, status, shift_notes, created_by)
    VALUES (
      v_family_id, v_elder_id, v_ramesh_id,
      CURRENT_DATE + TIME '09:00:00', CURRENT_DATE + TIME '17:00:00',
      CURRENT_DATE + TIME '09:05:00', 'checked_in',
      'Checked in punctually at residence. Courtyard walk completed.', v_ananya_id
    )
    ON CONFLICT DO NOTHING;

    -- Medications
    INSERT INTO public.medication_records (
      id, family_id, elder_id, medicine_name, prescribed_instructions, frequency,
      scheduled_times, start_date, prescribing_clinician, refill_date, refill_responsible, notes, created_by
    ) VALUES
      (v_med1_id, v_family_id, v_elder_id, 'Telmisartan 40mg (BP Management)', '1 tablet once daily morning after breakfast', 'Once daily', ARRAY['08:30'], CURRENT_DATE - 60, 'Dr. K. Radhakrishnan (Apollo Clinics)', CURRENT_DATE + 5, v_ananya_id, 'Monitor BP regularly', v_ananya_id),
      (v_med2_id, v_family_id, v_elder_id, 'Metformin 500mg (Glycemic Care)', '1 tablet with lunch', 'Once daily', ARRAY['13:00'], CURRENT_DATE - 45, 'Dr. K. Radhakrishnan (Apollo Clinics)', CURRENT_DATE + 12, v_arjun_id, 'Take strictly after meals', v_ananya_id),
      (v_med3_id, v_family_id, v_elder_id, 'Atorvastatin 10mg (Lipid Support)', '1 tablet at bedtime', 'Once daily', ARRAY['21:00'], CURRENT_DATE - 60, 'Dr. K. Radhakrishnan (Apollo Clinics)', CURRENT_DATE - 2, v_ananya_id, 'Refill overdue by 2 days', v_ananya_id)
    ON CONFLICT (id) DO NOTHING;

    -- Medication Events
    INSERT INTO public.medication_events (
      medication_id, family_id, scheduled_at, parent_confirmation, parent_confirmed_at,
      caregiver_assistance_status, caregiver_user_id, caregiver_recorded_at, notes
    ) VALUES
      (v_med1_id, v_family_id, CURRENT_DATE + TIME '08:30:00', 'taken', CURRENT_DATE + TIME '08:36:00', 'assisted', v_ramesh_id, CURRENT_DATE + TIME '08:40:00', 'Taken with warm water after breakfast'),
      (v_med2_id, v_family_id, CURRENT_DATE + TIME '13:00:00', NULL, NULL, NULL, NULL, NULL, 'Unconfirmed dose alert generated at 13:30')
    ON CONFLICT DO NOTHING;

    -- Care Tasks
    INSERT INTO public.care_tasks (family_id, elder_id, title, description, category, assigned_to, due_at, priority, status, completed_at, created_by)
    VALUES
      (v_family_id, v_elder_id, 'Morning blood pressure check (Target: < 135/85)', 'Measure resting BP and note in daily log.', 'health', v_ramesh_id, CURRENT_DATE + TIME '10:00:00', 'high', 'completed', CURRENT_DATE + TIME '09:45:00', v_ananya_id),
      (v_family_id, v_elder_id, 'Arrange replacement AA batteries for BP monitor', 'Pick up pack from pharmacy on way home.', 'household', v_arjun_id, CURRENT_DATE + TIME '19:00:00', 'normal', 'open', NULL, v_ananya_id),
      (v_family_id, v_elder_id, 'Refill Atorvastatin 10mg (Overdue by 2 days)', 'Order 30-day strip from Apollo 24/7 or MediBuddy.', 'medication', v_ananya_id, CURRENT_DATE - INTERVAL '1 day', 'high', 'open', NULL, v_ananya_id)
    ON CONFLICT DO NOTHING;

    -- Upcoming Appointment
    INSERT INTO public.appointments (family_id, elder_id, title, provider, location, scheduled_at, assigned_to, status, notes, created_by)
    VALUES (
      v_family_id, v_elder_id,
      'Cardiology Follow-Up & ECG Review',
      'Dr. K. Radhakrishnan, Senior Cardiologist',
      'Apollo Clinics, Rd No 36, Jubilee Hills, Hyderabad',
      CURRENT_DATE + INTERVAL '3 days' + TIME '11:00:00',
      v_arjun_id, 'scheduled',
      'Arjun will accompany father. Carry recent BP log and echocardiogram report.',
      v_ananya_id
    )
    ON CONFLICT DO NOTHING;

    -- Family Journal
    INSERT INTO public.family_journal (family_id, elder_id, author_id, author_name, title, content, category)
    VALUES (
      v_family_id, v_elder_id, v_ananya_id, 'Ananya Sharma (Bengaluru)',
      'Sunday Chai & Video Call with Nana',
      'We had a wonderful 40-minute video call today! Papa showed me the flowering jasmine in the balcony. He looked cheerful and is practicing his knee flexion exercises every morning with Ramesh.',
      'visit_summary'
    )
    ON CONFLICT DO NOTHING;
END $$;
