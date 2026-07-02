export type ThreatLevel = "low" | "medium" | "high" | "critical";

export function threatBadgeClasses(level: ThreatLevel | string | undefined): string {
  switch ((level ?? "").toLowerCase()) {
    case "critical":
      return "bg-red-600 hover:bg-red-600 text-white border-transparent";
    case "high":
      return "bg-orange-500 hover:bg-orange-500 text-white border-transparent";
    case "medium":
      return "bg-yellow-500 hover:bg-yellow-500 text-black border-transparent";
    case "low":
    default:
      return "bg-emerald-600 hover:bg-emerald-600 text-white border-transparent";
  }
}

export function threatLabel(level: ThreatLevel | string | undefined): string {
  const v = (level ?? "low").toLowerCase();
  return v.charAt(0).toUpperCase() + v.slice(1);
}
