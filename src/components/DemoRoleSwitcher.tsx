import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import {
  DEMO_PERSONAS,
  switchDemoPersona,
  type DemoPersonaKey,
  ensureSharmaDemoSeeded,
} from "../lib/demoStore";

export default function DemoRoleSwitcher() {
  const { user, isDemo, refresh } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!isDemo) return null;

  const currentEmail = user?.email ?? "";
  const currentPersona = DEMO_PERSONAS.find((p) => p.email === currentEmail) ?? {
    key: "ananya" as DemoPersonaKey,
    name: user?.full_name || "Demo User",
    role: "owner",
    location: "Active Session",
    relationship: "Current User",
    email: currentEmail,
    avatar: "DU",
  };

  const handleSwitch = async (key: DemoPersonaKey) => {
    try {
      switchDemoPersona(key);
      await refresh();
      setIsOpen(false);

      if (key === "rajesh") {
        navigate("/app/elder");
      } else if (key === "ramesh") {
        navigate("/app/caregiver");
      } else {
        navigate("/app/family");
      }
    } catch (err) {
      console.error("Failed to switch persona:", err);
    }
  };

  const handleResetData = async () => {
    if (confirm("Reset synthetic demonstration data to default state?")) {
      localStorage.removeItem("nanus-demo-v1");
      ensureSharmaDemoSeeded();
      await refresh();
      navigate("/app/family");
    }
  };

  return (
    <div className="sticky top-0 z-50 border-b border-sage/60 bg-forest text-ivory text-xs sm:text-sm shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        {/* Left: Active Persona Banner */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/20 px-2.5 py-0.5 font-medium text-coral border border-coral/30">
            <span className="h-1.5 w-1.5 rounded-full bg-coral animate-pulse" />
            SYNTHETIC DEMO
          </span>
          <span className="hidden md:inline text-ivory/80">Role:</span>
          <span className="font-semibold text-ivory">
            {currentPersona.name} ({currentPersona.relationship})
          </span>
        </div>

        {/* Right: Quick Persona Switcher */}
        <div className="flex items-center gap-1.5">
          <div className="hidden lg:flex items-center gap-1">
            {DEMO_PERSONAS.map((p) => {
              const isActive = p.email === currentEmail;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSwitch(p.key)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-sage text-charcoal font-semibold shadow-inner"
                      : "text-ivory/80 hover:bg-white/10 hover:text-ivory"
                  }`}
                  title={`${p.name} — ${p.relationship} (${p.location})`}
                >
                  {p.name.split(" ")[0]} ({p.role === "owner" ? "Owner" : p.role === "family_member" ? "Child" : p.role === "caregiver" ? "Caregiver" : "Parent"})
                </button>
              );
            })}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="rounded bg-sage/20 border border-sage/40 px-2.5 py-1 text-xs font-medium text-ivory hover:bg-sage/30 flex items-center gap-1"
              aria-expanded={isOpen}
            >
              <span>Switch Role</span>
              <span className="text-[10px]">▼</span>
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg border border-sage bg-white p-2 text-charcoal shadow-xl z-50">
                <div className="border-b border-sage/40 pb-1.5 px-2 mb-1.5">
                  <p className="text-xs font-semibold text-forest">Sharma Family Demo Personas</p>
                  <p className="text-[11px] text-charcoal/70">Test all three role-based experiences</p>
                </div>
                <div className="space-y-1">
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleSwitch(p.key)}
                      className={`w-full text-left rounded-md p-2 transition-colors flex items-start gap-2.5 ${
                        p.email === currentEmail
                          ? "bg-forest/10 border border-forest/20 font-semibold"
                          : "hover:bg-ivory"
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest text-ivory text-xs font-bold">
                        {p.avatar}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-charcoal truncate">{p.name}</p>
                        <p className="text-[11px] text-forest/80 truncate">{p.relationship}</p>
                        <p className="text-[10px] text-charcoal/60">{p.location}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="border-t border-sage/40 mt-2 pt-1.5 px-2 flex justify-between items-center text-[11px]">
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="text-coral hover:underline"
                  >
                    Reset Demo State
                  </button>
                  <span className="text-charcoal/50 text-[10px]">Synthetic Data Only</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
