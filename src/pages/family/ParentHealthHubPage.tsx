import { useState } from "react";
import FamilyNav from "../../components/FamilyNav";
import DemoRoleSwitcher from "../../components/DemoRoleSwitcher";
import MedicationPage from "../MedicationPage";
import AppointmentsPage from "../AppointmentsPage";
import DocumentVaultPage from "../DocumentVaultPage";
import { Pill, Calendar, FolderHeart } from "lucide-react";

type HealthTab = "medications" | "appointments" | "documents";

export default function ParentHealthHubPage() {
  const [activeTab, setActiveTab] = useState<HealthTab>("medications");

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DemoRoleSwitcher />
      <FamilyNav />

      {/* Sub-navigation Tabs: Medications, Appointments, Document Vault */}
      <div className="border-b border-sage/60 bg-white/80 sticky top-[97px] z-30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2 sm:px-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("medications")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "medications"
                  ? "bg-forest text-ivory shadow-xs"
                  : "text-charcoal/70 hover:bg-sage/30 hover:text-forest"
              }`}
            >
              <Pill size={15} />
              <span>Medications</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("appointments")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "appointments"
                  ? "bg-forest text-ivory shadow-xs"
                  : "text-charcoal/70 hover:bg-sage/30 hover:text-forest"
              }`}
            >
              <Calendar size={15} />
              <span>Appointments</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("documents")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "documents"
                  ? "bg-forest text-ivory shadow-xs"
                  : "text-charcoal/70 hover:bg-sage/30 hover:text-forest"
              }`}
            >
              <FolderHeart size={15} />
              <span>Document Vault</span>
            </button>
          </div>

          <span className="hidden sm:inline text-xs text-charcoal/60">
            Parent&apos;s Health Hub
          </span>
        </div>
      </div>

      {/* Render selected view */}
      <div className="health-hub-content">
        {activeTab === "medications" && <MedicationPage />}
        {activeTab === "appointments" && <AppointmentsPage />}
        {activeTab === "documents" && <DocumentVaultPage />}
      </div>
    </div>
  );
}
