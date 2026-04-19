export type PlanType = 'trial' | 'city' | 'market' | 'region';

export interface PlanLimits {
  name: string;
  messagesPerMonth: number;
  citiesAllowed: number;
  price: number | null;
}

export const PLAN_CONFIG: Record<PlanType, PlanLimits> = {
  trial: {
    name: 'Trial',
    messagesPerMonth: 100,
    citiesAllowed: 1,
    price: 0,
  },
  city: {
    name: 'City',
    messagesPerMonth: 2500,
    citiesAllowed: 1,
    price: 19,
  },
  market: {
    name: 'Market',
    messagesPerMonth: 5000,
    citiesAllowed: 3,
    price: 49,
  },
  region: {
    name: 'Region',
    messagesPerMonth: 10000,
    citiesAllowed: 10,
    price: 99,
  },
};

export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_CONFIG[plan];
}

export function normalizePlan(raw: string | null | undefined): PlanType {
  if (!raw) return 'trial';
  const lower = raw.toLowerCase();
  // Accept legacy plan names from old product
  if (lower === 'city' || lower === 'home') return 'city';
  if (lower === 'market' || lower === 'pro' || lower === 'professional') return 'market';
  if (lower === 'region' || lower === 'enterprise') return 'region';
  if (lower === 'starter') return 'city';
  return 'trial';
}

export function getNextPlan(plan: PlanType): { plan: PlanType | null; name: string | null; price: string | null } {
  if (plan === 'trial' || plan === 'city') return { plan: 'market', name: 'Market', price: '$49/mo' };
  if (plan === 'market') return { plan: 'region', name: 'Region', price: '$99/mo' };
  return { plan: null, name: null, price: null };
}

export function canAddCity(plan: PlanType, activeCityCount: number): { allowed: boolean; reason?: string } {
  const { citiesAllowed, name } = PLAN_CONFIG[plan];
  if (activeCityCount < citiesAllowed) return { allowed: true };
  return {
    allowed: false,
    reason: `Your ${name} plan includes ${citiesAllowed} ${citiesAllowed === 1 ? 'city' : 'cities'}. Upgrade to add more.`,
  };
}

// ---------------------------------------------------------------------------
// V1 compat shims — used by AutomationsManagementPage (legacy)
// These map old automation-slot concepts to no-ops so V1 keeps building.
// ---------------------------------------------------------------------------
export function getCurrentPlan(): PlanType {
  return normalizePlan(localStorage.getItem('listingbug_user_plan'));
}

export function setUserPlan(plan: PlanType): void {
  localStorage.setItem('listingbug_user_plan', plan);
  window.dispatchEvent(new CustomEvent('userPlanChanged', { detail: { plan } }));
}

export function canCreateAutomation(_plan?: PlanType, _count?: number): {
  allowed: boolean; reason?: string; currentCount?: number; maxSlots?: number;
} {
  return { allowed: true, currentCount: 0, maxSlots: Infinity };
}

export function isApproachingAutomationLimit(_plan?: PlanType): boolean {
  return false;
}

export function getAutomationUsage(_plan?: PlanType): {
  current: number; max: number; percentage: number; remaining: number; isAtLimit: boolean;
} {
  return { current: 0, max: Infinity, percentage: 0, remaining: Infinity, isAtLimit: false };
}

export function hasFeatureAccess(_feature: string, _plan?: PlanType): boolean {
  return true;
}
// ---------------------------------------------------------------------------

export function getMessageUsage(plan: PlanType, usedThisPeriod: number): {
  used: number;
  limit: number;
  remaining: number;
  pct: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
} {
  const limit = PLAN_CONFIG[plan].messagesPerMonth;
  const remaining = Math.max(0, limit - usedThisPeriod);
  const pct = Math.min(Math.round((usedThisPeriod / limit) * 100), 100);
  return {
    used: usedThisPeriod,
    limit,
    remaining,
    pct,
    isNearLimit: pct >= 80,
    isOverLimit: usedThisPeriod > limit,
  };
}
