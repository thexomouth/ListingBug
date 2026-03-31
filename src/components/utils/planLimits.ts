/**
 * PLAN LIMITS UTILITY
 * 
 * Centralized logic for plan-based feature limits
 * Ensures consistent enforcement across all components
 */

export type PlanType = 'trial' | 'starter' | 'pro' | 'enterprise';

export interface PlanLimits {
  name: string;
  automationSlots: number;
  listingsCap: number;
  price: number | null;
  features: {
    crmIntegrations: boolean;
    automationPlatforms: boolean;
    customAPI: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
  };
}

/**
 * Plan configuration
 */
export const PLAN_CONFIG: Record<PlanType, PlanLimits> = {
  trial: {
    name: 'Trial',
    automationSlots: 3,
    listingsCap: 1000,
    price: 0,
    features: {
      crmIntegrations: false,
      automationPlatforms: false,
      customAPI: false,
      whiteLabel: false,
      prioritySupport: false
    }
  },
  starter: {
    name: 'Starter',
    automationSlots: 3,
    listingsCap: 4000,
    price: 19,
    features: {
      crmIntegrations: false,
      automationPlatforms: false,
      customAPI: false,
      whiteLabel: false,
      prioritySupport: false
    }
  },
  pro: {
    name: 'Professional',
    automationSlots: 9,
    listingsCap: 10000,
    price: 49,
    features: {
      crmIntegrations: true,
      automationPlatforms: true,
      customAPI: false,
      whiteLabel: false,
      prioritySupport: true
    }
  },
  enterprise: {
    name: 'Enterprise',
    automationSlots: Infinity,
    listingsCap: Infinity,
    price: null,
    features: {
      crmIntegrations: true,
      automationPlatforms: true,
      customAPI: true,
      whiteLabel: true,
      prioritySupport: true
    }
  }
};

/**
 * Get user's current plan from localStorage
 */
export function getCurrentPlan(): PlanType {
  const storedPlan = localStorage.getItem('listingbug_user_plan');
  if (storedPlan && ['trial', 'starter', 'pro', 'enterprise'].includes(storedPlan)) {
    return storedPlan as PlanType;
  }
  
  // Check if user has sandbox data (returning user) - default to Pro
  const hasAutomations = localStorage.getItem('listingbug_automations');
  if (hasAutomations) {
    try {
      const automations = JSON.parse(hasAutomations);
      if (Array.isArray(automations) && automations.length > 0) {
        localStorage.setItem('listingbug_user_plan', 'pro');
        return 'pro';
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // First-time user - default to Starter
  return 'starter';
}

/**
 * Set user's plan
 */
export function setUserPlan(plan: PlanType): void {
  localStorage.setItem('listingbug_user_plan', plan);
  
  // Dispatch custom event to notify components of plan change
  window.dispatchEvent(new CustomEvent('userPlanChanged', { detail: { plan } }));
}

/**
 * Get plan limits for a specific plan
 */
export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_CONFIG[plan];
}

/**
 * Check if user can create a new automation
 */
export function canCreateAutomation(plan?: PlanType, actualCount?: number): {
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  maxSlots?: number;
} {
  const currentPlan = plan || getCurrentPlan();
  const limits = getPlanLimits(currentPlan);

  // Use provided count, or fall back to localStorage (legacy)
  let currentCount = actualCount;
  if (currentCount === undefined) {
    const stored = localStorage.getItem('listingbug_automations');
    currentCount = 0;
    if (stored) {
      try {
        const automations = JSON.parse(stored);
        currentCount = Array.isArray(automations) ? automations.length : 0;
      } catch (e) {
        currentCount = 0;
      }
    }
  }

  // Check if limit is reached
  const allowed = limits.automationSlots === Infinity || currentCount < limits.automationSlots;

  return {
    allowed,
    reason: allowed ? undefined : `You've reached your plan limit of ${limits.automationSlots} automation${limits.automationSlots !== 1 ? 's' : ''}`,
    currentCount,
    maxSlots: limits.automationSlots === Infinity ? Infinity : limits.automationSlots
  };
}

/**
 * Check if user is approaching automation limit
 */
export function isApproachingAutomationLimit(plan?: PlanType): boolean {
  const currentPlan = plan || getCurrentPlan();
  const limits = getPlanLimits(currentPlan);
  
  if (limits.automationSlots === Infinity) {
    return false;
  }
  
  const { currentCount } = canCreateAutomation(currentPlan);
  const threshold = limits.automationSlots - 1; // One slot remaining
  
  return (currentCount || 0) >= threshold;
}

/**
 * Get automation usage info
 */
export function getAutomationUsage(plan?: PlanType): {
  current: number;
  max: number;
  percentage: number;
  remaining: number;
  isAtLimit: boolean;
} {
  const currentPlan = plan || getCurrentPlan();
  const limits = getPlanLimits(currentPlan);
  const { currentCount = 0, maxSlots = 0 } = canCreateAutomation(currentPlan);
  
  const max = limits.automationSlots === Infinity ? Infinity : limits.automationSlots;
  const percentage = max === Infinity ? 0 : (currentCount / max) * 100;
  const remaining = max === Infinity ? Infinity : Math.max(0, max - currentCount);
  const isAtLimit = currentCount >= max;
  
  return {
    current: currentCount,
    max,
    percentage,
    remaining,
    isAtLimit
  };
}

/**
 * Check if user can access a feature based on plan
 */
export function hasFeatureAccess(
  feature: keyof PlanLimits['features'],
  plan?: PlanType
): boolean {
  const currentPlan = plan || getCurrentPlan();
  const limits = getPlanLimits(currentPlan);
  return limits.features[feature];
}

/**
 * Get next plan recommendation
 */
export function getNextPlan(currentPlan: PlanType): {
  plan: PlanType | null;
  name: string | null;
  automationSlots: number | null;
  price: string | null;
} {
  if (currentPlan === 'starter') {
    return {
      plan: 'pro',
      name: 'Professional',
      automationSlots: 9,
      price: '$49/mo'
    };
  }
  
  if (currentPlan === 'pro') {
    return {
      plan: 'enterprise',
      name: 'Enterprise',
      automationSlots: Infinity,
      price: 'Custom pricing'
    };
  }
  
  return {
    plan: null,
    name: null,
    automationSlots: null,
    price: null
  };
}