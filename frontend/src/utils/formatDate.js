/**
 * LOGIC-03: Shared formatDate utility — previously duplicated in
 * AnomalyFeed.jsx, BudgetAlertHistory.jsx, and History.jsx.
 *
 * Backend returns timestamps as 'YYYY-MM-DD HH:MM:SS'. We replace the
 * space with 'T' to produce valid ISO 8601, ensuring cross-browser
 * compatibility (Safari rejects the space-separated format).
 */
export function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '—';
  const normalized = dateStr.replace(' ', 'T');
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return dateStr; // fallback: return raw string
  const defaultOpts = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return d.toLocaleString('en-US', { ...defaultOpts, ...opts });
}
