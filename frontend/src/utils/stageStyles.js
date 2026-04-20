/**
 * LOGIC-05: Shared getStageStyles utility — previously duplicated in
 * BudgetStatus.jsx and BudgetAlertHistory.jsx.
 *
 * BudgetStatus needs the full set: { badge, text, bar, alert }
 * BudgetAlertHistory only needs: { badge, text }
 * Both shapes are returned so each component can pick what it needs.
 */
export function getStageStyles(stage) {
  switch (stage) {
    case 0:
      return {
        badge: 'bg-green-100 text-green-700',
        text: 'Within Budget',
        bar: 'bg-green-600',
        alert: 'bg-green-50 border-green-200 text-green-700',
      };
    case 1:
      return {
        badge: 'bg-yellow-100 text-yellow-700',
        text: 'Warning',
        bar: 'bg-yellow-600',
        alert: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      };
    case 2:
      return {
        badge: 'bg-orange-100 text-orange-700',
        text: 'Critical',
        bar: 'bg-orange-600',
        alert: 'bg-orange-50 border-orange-200 text-orange-700',
      };
    case 3:
      return {
        badge: 'bg-red-100 text-red-700',
        text: 'Budget Exceeded',
        bar: 'bg-red-600',
        alert: 'bg-red-50 border-red-200 text-red-700',
      };
    default:
      return {
        badge: 'bg-slate-100 text-slate-700',
        text: 'Unknown',
        bar: 'bg-slate-600',
        alert: 'bg-slate-50 border-slate-200 text-slate-700',
      };
  }
}
