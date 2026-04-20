/**
 * LOGIC-04: Shared getSeverityStyles utility — previously duplicated in
 * AnomalyFeed.jsx and History.jsx (with slightly different return shapes).
 *
 * Returns an object with both shapes so either component can use it:
 *   { dot, badgeStr }  — used by AnomalyFeed (dot color + badge string)
 *   { badge }          — alias for badgeStr, used by History
 */
export function getSeverityStyles(severity) {
  switch (severity) {
    case 'HIGH':
      return { dot: 'bg-red-600', badgeStr: 'bg-red-100 text-red-700', badge: 'bg-red-100 text-red-700' };
    case 'MEDIUM':
      return { dot: 'bg-orange-600', badgeStr: 'bg-orange-100 text-orange-700', badge: 'bg-orange-100 text-orange-700' };
    case 'LOW':
      return { dot: 'bg-yellow-600', badgeStr: 'bg-yellow-100 text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' };
    default:
      return { dot: 'bg-slate-600', badgeStr: 'bg-slate-100 text-slate-700', badge: 'bg-slate-100 text-slate-700' };
  }
}
