import { useState } from "react";
import FamilyNav from "../../components/FamilyNav";
import DemoRoleSwitcher from "../../components/DemoRoleSwitcher";
import FamilyJournalPage from "../FamilyJournalPage";
import HandoverPage from "../HandoverPage";
import ActivityTimelinePage from "../ActivityTimelinePage";
import { BookOpen, Repeat, History } from "lucide-react";

type UpdatesTab = "journal" | "handover" | "timeline";

export default function FamilyUpdatesHubPage() {
  const [activeTab, setActiveTab] = useState<UpdatesTab>("journal");

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DemoRoleSwitcher />
      <FamilyNav />

      {/* Sub-navigation Tabs: Journal, Handovers, Timeline */}
      <div className="border-b border-sage/60 bg-white/80 sticky top-[97px] z-30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2 sm:px-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("journal")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "journal"
                  ? "bg-forest text-ivory shadow-xs"
                  : "text-charcoal/70 hover:bg-sage/30 hover:text-forest"
              }`}
            >
              <BookOpen size={15} />
              <span>Family Journal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("handover")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "handover"
                  ? "bg-forest text-ivory shadow-xs"
                  : "text-charcoal/70 hover:bg-sage/30 hover:text-forest"
              }`}
            >
              <Repeat size={15} />
              <span>Care Handovers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "timeline"
                  ? "bg-forest text-ivory shadow-xs"
                  : "text-charcoal/70 hover:bg-sage/30 hover:text-forest"
              }`}
            >
              <History size={15} />
              <span>Activity Timeline</span>
            </button>
          </div>

          <span className="hidden sm:inline text-xs text-charcoal/60">
            Family Updates
          </span>
        </div>
      </div>

      <div>
        {activeTab === "journal" && <FamilyJournalPage />}
        {activeTab === "handover" && <HandoverPage />}
        {activeTab === "timeline" && <ActivityTimelinePage />}
      </div>
    </div>
  );
}
