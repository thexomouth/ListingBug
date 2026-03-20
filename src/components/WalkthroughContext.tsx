import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner@2.0.3';

/**
 * WALKTHROUGH CONTEXT
 * 
 * Manages walkthrough state across the entire application
 * Stores completion status in localStorage
 * 
 * USAGE:
 * const { walkthroughActive, currentStep, completeStep, skipWalkthrough } = useWalkthrough();
 * 
 * STATUS: WALKTHROUGH DISABLED (March 19, 2026)
 * REASON: Deferred to post-launch for refinement based on user feedback
 * TO RE-ENABLE: Set WALKTHROUGH_ENABLED to true
 * REFERENCE: See /ONBOARDING_WALKTHROUGH_REFERENCE.md for complete documentation
 */

// GLOBAL FLAG: Disable walkthrough (Phase 1 - deferred to post-launch)
const WALKTHROUGH_ENABLED = false;

interface WalkthroughContextType {
  walkthroughActive: boolean;
  currentStep: number;
  totalSteps: number;
  startWalkthrough: () => void;
  completeStep: (stepNumber: number) => void;
  goToStep: (stepNumber: number) => void;
  previousStep: () => void;
  skipWalkthrough: () => void;
  resetWalkthrough: () => void;
  pauseWalkthrough: () => void;
  resumeWalkthrough: () => void;
  isStepActive: (stepNumber: number) => boolean;
  setNudgeTimer: (stepNumber: number) => void;
  clearNudgeTimer: () => void;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

interface WalkthroughProviderProps {
  children: ReactNode;
}

const TOTAL_STEPS = 9;
const STORAGE_KEY = 'listingbug_walkthrough_completed';
const CURRENT_STEP_KEY = 'listingbug_walkthrough_step';
const PAUSED_KEY = 'listingbug_walkthrough_paused';
const RETURNING_USER_KEY = 'listingbug_returning_user';
const USER_LOGGED_IN_KEY = 'listingbug_user';

export function WalkthroughProvider({ children }: WalkthroughProviderProps) {
  const [walkthroughActive, setWalkthroughActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [nudgeTimerRef, setNudgeTimerRef] = useState<NodeJS.Timeout | null>(null);

  // Check if user is returning or walkthrough completed
  const isReturningUser = () => {
    return localStorage.getItem(RETURNING_USER_KEY) === 'true' || 
           localStorage.getItem(STORAGE_KEY) === 'true';
  };

  // Check if user is logged in
  const isUserLoggedIn = () => {
    return localStorage.getItem(USER_LOGGED_IN_KEY) === 'true';
  };

  // Initialize walkthrough state from localStorage on mount
  useEffect(() => {
    // Skip if walkthrough is globally disabled
    if (!WALKTHROUGH_ENABLED) {
      return;
    }
    
    // NEVER start walkthrough for returning users
    if (isReturningUser()) {
      setWalkthroughActive(false);
      setCurrentStep(0);
      return;
    }
    
    const completed = localStorage.getItem(STORAGE_KEY) === 'true';
    const paused = localStorage.getItem(PAUSED_KEY) === 'true';
    const savedStep = parseInt(localStorage.getItem(CURRENT_STEP_KEY) || '0');
    
    console.log('🎭 WalkthroughContext init:', { completed, paused, savedStep });
    
    if (!completed && savedStep > 0) {
      if (paused) {
        // Show resume prompt for paused walkthrough
        setTimeout(() => {
          toast.info('Walkthrough paused at Step ' + savedStep + '. Click to resume.', {
            duration: 10000,
            action: {
              label: 'Resume Tour',
              onClick: () => resumeWalkthrough(),
            },
          });
        }, 500);
      } else {
        // Resume walkthrough from saved step (only for first-time users)
        setWalkthroughActive(true);
        setCurrentStep(savedStep);
        
        console.log('✅ Walkthrough resumed at step', savedStep);
      }
    }
  }, []);
  
  // Monitor localStorage to keep walkthrough state in sync across page navigations
  useEffect(() => {
    if (!WALKTHROUGH_ENABLED || isReturningUser()) {
      return;
    }
    
    const checkWalkthroughState = () => {
      const savedStep = parseInt(localStorage.getItem(CURRENT_STEP_KEY) || '0');
      const completed = localStorage.getItem(STORAGE_KEY) === 'true';
      const paused = localStorage.getItem(PAUSED_KEY) === 'true';
      
      // If there's a saved step and walkthrough is not active, reactivate it
      if (!completed && !paused && savedStep > 0 && !walkthroughActive) {
        console.log('🔄 Reactivating walkthrough at step', savedStep);
        setWalkthroughActive(true);
        setCurrentStep(savedStep);
      }
      
      // If current step doesn't match localStorage, sync it
      if (savedStep > 0 && savedStep !== currentStep && !completed && walkthroughActive) {
        console.log('🔄 Syncing step:', currentStep, '→', savedStep);
        setCurrentStep(savedStep);
      }
    };
    
    // Check on interval to catch state changes
    const intervalId = setInterval(checkWalkthroughState, 500);
    
    return () => clearInterval(intervalId);
  }, [walkthroughActive, currentStep]);

  const startWalkthrough = () => {
    // Skip if walkthrough is globally disabled
    if (!WALKTHROUGH_ENABLED) {
      console.log('⚠️ Walkthrough is currently disabled');
      return;
    }
    
    // CRITICAL: Never start walkthrough for returning users
    if (isReturningUser()) {
      console.log('⚠️ Walkthrough blocked: User has already completed walkthrough or is a returning user');
      return;
    }
    
    console.log('✅ Starting walkthrough for first-time user');
    setWalkthroughActive(true);
    setCurrentStep(1);
    localStorage.setItem(CURRENT_STEP_KEY, '1');
    localStorage.removeItem(STORAGE_KEY);
  };

  const completeStep = (stepNumber: number) => {
    if (stepNumber === TOTAL_STEPS) {
      // Walkthrough complete
      setWalkthroughActive(false);
      setCurrentStep(0);
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.removeItem(CURRENT_STEP_KEY);
      
      // Mark user as returning user so they get sandbox data on next login
      localStorage.setItem(RETURNING_USER_KEY, 'true');
      
      toast.success('Walkthrough completed! 🎉');
    } else {
      // Move to next step
      const nextStep = stepNumber + 1;
      setCurrentStep(nextStep);
      localStorage.setItem(CURRENT_STEP_KEY, nextStep.toString());
      
      // Ensure walkthrough remains active
      setWalkthroughActive(true);
      
      console.log(`📍 Walkthrough: Step ${stepNumber} → Step ${nextStep}`);
      
      // Toast confirmation (only for certain steps)
      switch (stepNumber) {
        case 2:
          toast.success('Location added! Now run your search...');
          break;
        case 3:
          toast.success('Great results! Save a listing...');
          break;
      }
    }
  };

  const goToStep = (stepNumber: number) => {
    if (stepNumber > 0 && stepNumber <= TOTAL_STEPS) {
      setCurrentStep(stepNumber);
      localStorage.setItem(CURRENT_STEP_KEY, stepNumber.toString());
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      localStorage.setItem(CURRENT_STEP_KEY, prevStep.toString());
    }
  };

  const skipWalkthrough = () => {
    setWalkthroughActive(false);
    setCurrentStep(0);
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.removeItem(CURRENT_STEP_KEY);
    toast.info('Walkthrough skipped. You can restart it anytime from Settings.');
  };

  const resetWalkthrough = () => {
    setWalkthroughActive(false);
    setCurrentStep(0);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_STEP_KEY);
    localStorage.removeItem(PAUSED_KEY);
  };

  const pauseWalkthrough = () => {
    if (walkthroughActive && currentStep > 0) {
      localStorage.setItem(PAUSED_KEY, 'true');
      console.log('⏸️ Walkthrough paused at step', currentStep);
    }
  };

  const resumeWalkthrough = () => {
    const paused = localStorage.getItem(PAUSED_KEY) === 'true';
    const savedStep = parseInt(localStorage.getItem(CURRENT_STEP_KEY) || '0');
    
    if (paused && savedStep > 0) {
      setWalkthroughActive(true);
      setCurrentStep(savedStep);
      localStorage.removeItem(PAUSED_KEY);
      toast.info(`Resuming walkthrough from Step ${savedStep}`, {
        duration: 3000,
      });
      console.log('▶️ Walkthrough resumed at step', savedStep);
    }
  };

  const isStepActive = (stepNumber: number) => {
    return walkthroughActive && currentStep === stepNumber;
  };

  const setNudgeTimer = (stepNumber: number) => {
    if (nudgeTimerRef) {
      clearTimeout(nudgeTimerRef);
    }
    const timer = setTimeout(() => {
      if (isStepActive(stepNumber)) {
        toast.info('Reminder: You can continue the walkthrough here.', {
          duration: 5000,
        });
      }
    }, 10000); // 10 seconds
    setNudgeTimerRef(timer);
  };

  const clearNudgeTimer = () => {
    if (nudgeTimerRef) {
      clearTimeout(nudgeTimerRef);
      setNudgeTimerRef(null);
    }
  };

  return (
    <WalkthroughContext.Provider
      value={{
        walkthroughActive,
        currentStep,
        totalSteps: TOTAL_STEPS,
        startWalkthrough,
        completeStep,
        goToStep,
        previousStep,
        skipWalkthrough,
        resetWalkthrough,
        pauseWalkthrough,
        resumeWalkthrough,
        isStepActive,
        setNudgeTimer,
        clearNudgeTimer,
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
}

export function useWalkthrough() {
  const context = useContext(WalkthroughContext);
  if (context === undefined) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider');
  }
  return context;
}