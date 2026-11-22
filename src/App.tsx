import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import FeaturesPage from "./pages/FeaturesPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import InvitePage from "./pages/InvitePage";
import SetupPage from "./pages/SetupPage";
import FamilyMembersPage from "./pages/FamilyMembersPage";
import CareTasksPage from "./pages/CareTasksPage";
import ParentProfilePage from "./pages/ParentProfilePage";
import ActivityTimelinePage from "./pages/ActivityTimelinePage";
import FamilyDashboardPage from "./pages/FamilyDashboardPage";
import FamilyCarePulsePage from "./pages/FamilyCarePulsePage";
import FamilyJournalPage from "./pages/FamilyJournalPage";
import MedicationPage from "./pages/MedicationPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import DocumentVaultPage from "./pages/DocumentVaultPage";
import CaregiverManagementPage from "./pages/CaregiverManagementPage";
import CaregiverDashboardPage from "./pages/caregiver/CaregiverDashboardPage";
import CaregiverShiftsPage from "./pages/caregiver/CaregiverShiftsPage";
import CaregiverTasksPage from "./pages/caregiver/CaregiverTasksPage";
import CaregiverActivityPage from "./pages/caregiver/CaregiverActivityPage";
import CaregiverProfilePage from "./pages/caregiver/CaregiverProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import HandoverPage from "./pages/HandoverPage";
import ReminderSettingsPage from "./pages/ReminderSettingsPage";
import ElderHomePage from "./pages/elder/ElderHomePage";
import ElderCheckinPage from "./pages/elder/ElderCheckinPage";
import ElderEmergencyPage from "./pages/elder/ElderEmergencyPage";
import ElderMedicinePage from "./pages/elder/ElderMedicinePage";
import RequireAuth from "./routes/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />

      <Route element={<RequireAuth requireMembership={false} />}>
        <Route path="/app/setup" element={<SetupPage />} />
      </Route>

      <Route element={<RequireAuth roles={["owner", "family_member"]} />}>
        <Route
          path="/app/family"
          element={<FamilyDashboardPage />}
        />
        <Route path="/app/family/pulse" element={<FamilyCarePulsePage />} />
        <Route path="/app/family/journal" element={<FamilyJournalPage />} />
        <Route path="/app/family/tasks" element={<CareTasksPage />} />
        <Route path="/app/family/members" element={<FamilyMembersPage />} />
        <Route path="/app/family/profile" element={<ParentProfilePage />} />
        <Route path="/app/family/timeline" element={<ActivityTimelinePage />} />
        <Route path="/app/family/medication" element={<MedicationPage />} />
        <Route path="/app/family/appointments" element={<AppointmentsPage />} />
        <Route path="/app/family/documents" element={<DocumentVaultPage />} />
        <Route path="/app/family/caregivers" element={<CaregiverManagementPage />} />
        <Route path="/app/family/notifications" element={<NotificationsPage />} />
        <Route path="/app/family/handover" element={<HandoverPage />} />
        <Route path="/app/family/reminders" element={<ReminderSettingsPage />} />
      </Route>

      <Route element={<RequireAuth roles={["caregiver"]} />}>
        <Route path="/app/caregiver" element={<CaregiverDashboardPage />} />
        <Route path="/app/caregiver/shifts" element={<CaregiverShiftsPage />} />
        <Route path="/app/caregiver/tasks" element={<CaregiverTasksPage />} />
        <Route path="/app/caregiver/activity" element={<CaregiverActivityPage />} />
        <Route path="/app/caregiver/profile" element={<CaregiverProfilePage />} />
        <Route path="/app/caregiver/notifications" element={<NotificationsPage />} />
        <Route path="/app/caregiver/handover" element={<HandoverPage />} />
      </Route>

      <Route element={<RequireAuth roles={["elder"]} />}>
        <Route path="/app/elder" element={<ElderHomePage />} />
        <Route path="/app/elder/checkin" element={<ElderCheckinPage />} />
        <Route path="/app/elder/emergency" element={<ElderEmergencyPage />} />
        <Route path="/app/elder/medicines" element={<ElderMedicinePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
