/**
 * billingPeriod.ts
 *
 * Computes the current billing period based on account creation date.
 * Billing periods are anchored to the day-of-month the user signed up,
 * not calendar months. This means a user who signed up on March 21
 * has a billing period of March 21 → April 20, NOT April 1 → April 30.
 *
 * Returns the month_year strings (YYYY-MM format) that overlap with the
 * current billing period, so we can sum usage_tracking rows correctly
 * even when the period spans two calendar months.
 */

export interface BillingPeriod {
  start: Date;
  end: Date;
  /** All YYYY-MM strings that overlap this billing period */
  monthYears: string[];
  daysInPeriod: number;
  daysElapsed: number;
  daysRemaining: number;
  /** Human-readable label e.g. "Mar 21 – Apr 20, 2026" */
  label: string;
}

/**
 * Compute the current billing period from the account's created_at date.
 * If created_at is null/undefined, falls back to calendar month.
 */
export function getBillingPeriod(createdAt: string | null | undefined): BillingPeriod {
  const now = new Date();

  if (!createdAt) {
    // Fallback: calendar month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return {
      start,
      end,
      monthYears: [now.toISOString().slice(0, 7)],
      daysInPeriod: end.getDate(),
      daysElapsed: now.getDate(),
      daysRemaining: end.getDate() - now.getDate(),
      label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
             ' – ' +
             end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  }

  const created = new Date(createdAt);
  const anchorDay = created.getDate(); // e.g. 21

  // Find the most recent billing period start on or before today
  // Try: same year/month with anchorDay
  let periodStart = new Date(now.getFullYear(), now.getMonth(), anchorDay);

  // If that start is in the future, go back one month
  if (periodStart > now) {
    periodStart = new Date(now.getFullYear(), now.getMonth() - 1, anchorDay);
  }

  // Period end = one month after start, minus one day
  const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, anchorDay - 1, 23, 59, 59);

  // Collect all YYYY-MM strings that overlap this period
  const monthYears: string[] = [];
  const cursor = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);
  const endMonth = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
  while (cursor <= endMonth) {
    monthYears.push(cursor.toISOString().slice(0, 7));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysInPeriod = Math.round((periodEnd.getTime() - periodStart.getTime()) / msPerDay) + 1;
  const daysElapsed = Math.max(1, Math.round((now.getTime() - periodStart.getTime()) / msPerDay) + 1);
  const daysRemaining = Math.max(0, daysInPeriod - daysElapsed);

  const label =
    periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' – ' +
    periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return { start: periodStart, end: periodEnd, monthYears, daysInPeriod, daysElapsed, daysRemaining, label };
}
