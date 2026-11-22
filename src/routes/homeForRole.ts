import type { Role } from "../lib/types";

/** Returns the area home path for a signed-in member's role. */
export function homeForRole(role: Role | undefined): string {
  if (role === "caregiver") return "/app/caregiver";
  if (role === "elder") return "/app/elder";
  return "/app/family";
}
