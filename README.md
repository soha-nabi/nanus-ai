# NANU'S AI — Full-Stack Care Coordination Platform

> **"Care is love, made visible."**  
> *Distance shouldn't mean uncertainty.*

NANU'S AI connects elderly parents, children living in different cities, and appointed external caregivers through one trusted care coordination platform. It reduces manual phone calls, chaotic WhatsApp follow-ups, forgotten responsibilities, and uncertainty about elderly care.

This is **not** a generic healthcare dashboard, AI chatbot, or simple medicine reminder app. It is a shared family-care accountability ecosystem built with transparency, consent, and mutual trust.

---

## 1. Technology Stack

- **Frontend:** React 19 + TypeScript + Vite 8
- **Styling & Design System:** Tailwind CSS + custom Indian editorial palette (Warm ivory `#F7F5EF`, Deep forest green `#193D32`, Sage `#B9C9B5`, Muted coral `#E58D78`, Charcoal `#202722`)
- **Animation & Motion:** Framer Motion with full `useReducedMotion` accessibility support
- **Data Visualizations:** Recharts (Care Pulse coordination trends, dual-confirmation tracking, category distributions)
- **Forms & Validation:** React Hook Form + Zod
- **Icons:** Lucide React + custom animated brand mark
- **Backend & Database:** Supabase PostgreSQL with UUIDs, UTC timestamps, and strict Row Level Security (RLS) on all 22 tables
- **Storage:** Private encrypted Supabase Storage buckets (`documents`, `journal-media`)
- **Automation & Scheduling:** Supabase Database Functions + Supabase Edge Functions + Cron triggers
- **Speech & Accessibility:** Web Speech API (Speech Recognition + SpeechSynthesis read-aloud) supporting English and Hindi (हिन्दी)
- **PWA Capabilities:** Web App Manifest + Service Worker install prompt for mobile access

---

## 2. Three Distinct User Experiences

### Role A: Elderly Parent
- High-contrast, large touch targets (min 48–64px) with simplified layout
- Today's medication schedule with one-tap confirmation: **Taken**, **Skipped**, or **Unable to Confirm**
- Bilingual wellness check-in: *"I am okay (ठीक हूँ)"*, *"I need help (मदद चाहिए)"*, *"Contact my family"*
- Speech recognition and speech synthesis audio read-aloud
- Single-tap Emergency Help SOS

### Role B: Remote Child / Family Member
- **The 10-Second Family View**:
  1. *What happened today?*
  2. *Is anything pending?*
  3. *Who is responsible?*
  4. *What needs attention?*
  5. *When was the last confirmed update?*
- Independent dual medication confirmation tracking
- **Family Care Pulse:** Real-time visual coordination metrics and charts
- **Family Journal:** Private, encrypted family archive for visit summaries, daily notes, milestone photos, and sibling comments
- **Document Vault:** Secure storage with Document Intelligence extraction preview for human verification
- Caregiver attendance and shift verification with tamper-evident logs

### Role C: Appointed External Caregiver
- Restricted strictly to explicitly assigned families and elders
- Shift schedule with timestamped check-in and check-out
- Medication assistance logging (stored independently from parent ingestion confirmation)
- Care activity reports with evidence attachments
- Out-of-pocket care expense logging with receipt metadata
- Structured shift care handover submission

---

## 3. Core Modules Implemented

1. **Module 1 — Family Management:** Workspace creation, member roles (`owner`, `family_member`, `caregiver`, `elder`), invitation codes, role revocations.
2. **Module 2 — Medication Management:** Strict dual-confirmation architecture (parent ingestion confirmation separate from caregiver assistance); refill tasks; missed confirmation escalations.
3. **Module 3 — Caregiver Trust & Accountability:** Verification statuses (`not_submitted`, `submitted`, `pending_review`, `verified`, `rejected`, `expired`); consent-based attendance; audit logs; expense logging.
4. **Module 4 — Responsibility Automation Engine:** Event-driven escalation rules for missed check-ins, overdue tasks, and unattended appointments.
5. **Module 5 — Care Handover:** Structured shift and visit handovers carrying forward completed activities, medicine statuses, and unresolved issues.
6. **Module 6 — Parent Wellness Check-in:** Scheduled daily wellness pings with English/Hindi voice inputs.
7. **Module 7 — Appointments & Calendar:** Clinic visits, assigned attendees, and linked medical reports.
8. **Module 8 — Document Vault:** Encrypted prescriptions and lab reports with Document Intelligence extraction for human review.
9. **Module 9 — Family Care Pulse:** Operational coordination dashboards with Recharts (coordination volume, medication adherence, category distribution).
10. **Module 10 — Family Journal:** Private family updates, memories, visit reflections, and comments kept private from external staff.
11. **Module 11 — Voice-First Experience:** Browser speech recognition & synthesis with graceful fallback to large touch buttons.
12. **Module 12 — Notifications & Deduplication:** Multi-channel notification delivery with 1-hour deduplication keys and user preferences.

---

## 4. Database Architecture & Migrations

All migrations and functions are located in `supabase/`:

- `supabase/migrations/20261122000000_nanus_schema.sql`: Complete PostgreSQL schema for 22 tables.
- `supabase/migrations/20261122000001_nanus_rls.sql`: Row Level Security policies enforcing zero cross-family leakage.
- `supabase/migrations/20261122000002_nanus_functions.sql`: Database automation functions (`send_notification`, `check_overdue_tasks`, `check_missed_shifts`, `record_medication_event`, `caregiver_check_in`, `caregiver_check_out`, `generate_care_handover`, `process_emergency_request`).
- `supabase/storage_setup.sql`: Storage configuration and private RLS policies for `documents` and `journal-media`.
- `supabase/seed.sql`: Synthetic demo seed data for real Supabase instances.
- `supabase/functions/`: Deno Edge Functions for cron triggers and notifications.

---

## 5. Demonstration Data & Instant Testing

The platform includes a built-in synthetic scenario for the **Sharma Family**:

- **Rajesh Sharma (Age 75)** — Elderly Parent living in Hyderabad
- **Ananya Sharma** — Daughter & Family Owner living in Bengaluru
- **Arjun Sharma** — Son & Family Member living in Hyderabad
- **Ramesh Kumar** — Appointed Certified External Caregiver in Hyderabad

### Instant Testing with 1-Click Role Switcher
In demo mode (default when Supabase variables are not set), an interactive **Demo Role Switcher bar** appears across the application. You can switch between any of the 4 personas with a single click to immediately experience their role-specific view without logging out!

### Documented Demo Credentials
For testing via the standard sign-in screen:
- **Ananya Sharma (Owner):** `ananya@sharma.demo` / `password123`
- **Arjun Sharma (Child):** `arjun@sharma.demo` / `password123`
- **Ramesh Kumar (Caregiver):** `ramesh@caregiver.demo` / `password123`
- **Rajesh Sharma (Elder):** `rajesh@elder.demo` / `password123`

---

## 6. Local Setup and Deployment

### Development
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Typecheck and build production bundle
npm run build

# Preview production build locally
npm run preview
```

### Supabase Connection (Optional)
To connect the application to your real Supabase instance:
1. Create a project at [supabase.com](https://supabase.com).
2. Copy the migration SQL files in `supabase/migrations/` into the Supabase SQL Editor and run them in order.
3. Create `.env.local` based on `.env.example`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
   *(Never expose service-role keys in frontend code).*
4. The application will automatically detect the credentials and switch from local demonstration mode to live Supabase PostgreSQL and Authentication!

---

## 7. Product Principle

> *Nanu's AI must never make the elderly feel monitored, the children feel helpless, or the caregiver feel unfairly judged.*  
> *It builds a foundation of transparency, consent, responsibility, and trust.*
