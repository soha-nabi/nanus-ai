// Convenience entry point. The provider and hook live in AuthContext.tsx (single source of truth).
export { AuthProvider, useAuth } from "./AuthContext";
export type { AuthContextValue, SignUpResult } from "./AuthContext";
