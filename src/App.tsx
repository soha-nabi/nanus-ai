import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import FeaturesPage from "./pages/FeaturesPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import InvitePage from "./pages/InvitePage";
import SetupPage from "./pages/SetupPage";
import AreaPlaceholder from "./pages/AreaPlaceholder";
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
          element={
            <AreaPlaceholder
              title="Family area"
              description="Family members will coordinate their elder's care here."
            />
          }
        />
      </Route>

      <Route element={<RequireAuth roles={["caregiver"]} />}>
        <Route
          path="/app/caregiver"
          element={
            <AreaPlaceholder
              title="Caregiver area"
              description="Appointed caregivers will see their assignments and shifts here."
            />
          }
        />
      </Route>

      <Route element={<RequireAuth roles={["elder"]} />}>
        <Route
          path="/app/elder"
          element={
            <AreaPlaceholder
              title="Elder area"
              description="A simple, large-text space for the elder's day, reminders and calls."
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
