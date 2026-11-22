import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import type { Role } from "../lib/types";
import { homeForRole } from "./homeForRole";

interface RequireAuthProps {
  /** When set, only members with one of these roles may see the children/outlet. */
  roles?: Role[];
  /** When false, a signed-in user without a family is allowed through (used by /app/setup). */
  requireMembership?: boolean;
  children?: ReactNode;
}

export default function RequireAuth({ roles, requireMembership = true, children }: RequireAuthProps) {
  const { loading, user, membership } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory px-4 text-center text-lg text-charcoal">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireMembership && !membership) {
    return <Navigate to="/app/setup" replace />;
  }

  if (roles && membership && !roles.includes(membership.role)) {
    return <Navigate to={homeForRole(membership.role)} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
