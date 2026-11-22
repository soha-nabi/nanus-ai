import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { ensureSharmaDemoSeeded, switchDemoPersona } from "../lib/demoStore";
import { useAuth } from "../features/auth/AuthContext";

export default function SiteHeader() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const handleLaunchDemo = async (role: "ananya" | "rajesh" | "ramesh") => {
    try {
      ensureSharmaDemoSeeded();
      switchDemoPersona(role);
      await refresh();
      if (role === "rajesh") navigate("/app/elder");
      else if (role === "ramesh") navigate("/app/caregiver");
      else navigate("/app/family");
    } catch (e) {
      navigate("/login");
    }
  };

  return (
    <header className="border-b border-sage/60 bg-ivory/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded"
        >
          <BrandLogo size="md" />
        </Link>

        <nav aria-label="Primary" className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-charcoal">
          <Link to="/features" className="px-3 py-2 rounded-md hover:bg-sage/30 hover:text-forest transition-colors font-medium">
            Features
          </Link>
          <Link to="/about" className="px-3 py-2 rounded-md hover:bg-sage/30 hover:text-forest transition-colors font-medium">
            About
          </Link>

          {/* Quick Demo Launcher */}
          <button
            type="button"
            onClick={() => handleLaunchDemo("ananya")}
            className="rounded-md border border-forest/40 bg-white px-3 py-1.5 font-semibold text-forest hover:bg-forest hover:text-ivory transition-all shadow-xs"
          >
            Explore Live Demo
          </button>

          <Link to="/login" className="px-3 py-2 rounded-md hover:bg-sage/30 hover:text-forest transition-colors font-medium">
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-md bg-forest px-4 py-2 font-medium text-ivory hover:bg-forest/90 transition-colors shadow-sm"
          >
            Start Family Space
          </Link>
        </nav>
      </div>
    </header>
  );
}
