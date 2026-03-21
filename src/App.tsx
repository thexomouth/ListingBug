import { useState, useEffect, lazy, Suspense, startTransition } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'sonner';import { supabase } from './lib/supabase';import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { LoginHeader } from "./components/LoginHeader";
import { PageLoader } from "./components/PageLoader";
import { WalkthroughProvider } from "./components/WalkthroughContext";

/**
 * LOADING STRATEGY & PERFORMANCE OPTIMIZATION
 * 
 * Industry-Standard Load Order Implementation:
 * 
 * 1. CRITICAL COMPONENTS (Loaded Immediately):
 *    - LoginPage, SignUpPage, ForgotPasswordPage, ResetPasswordPage
 *    - Dashboard (for authenticated users)
 *    - These components are imported synchronously for fastest above-the-fold rendering
 * 
 * 2. LAZY-LOADED COMPONENTS (Deferred):
 *    - Footer, HomePage, secondary pages, modals
 *    - Loaded on-demand using React.lazy() with Suspense boundaries
 *    - Reduces initial bundle size and improves Time to Interactive (TTI)
 * 
 * 3. RENDERING PRIORITIES:
 *    - Main content renders within 100ms (see isMainContentReady timer)
 *    - Header renders immediately for login/signup pages (LoginHeader)
 *    - Footer deferred until after main content (lazy loaded)
 *    - Modals only loaded when needed (conditional Suspense)
 * 
 * 4. VISUAL LOADING STATES:
 *    - .loading class: opacity: 0, transition: 0.2s
 *    - .loaded class: opacity: 1, transition: 0.3s
 *    - Applied to <main> element for smooth transitions
 * 
 * 5. PERFORMANCE OPTIMIZATIONS:
 *    - content-visibility: auto on main children
 *    - contain: layout style paint on main
 *    - Skeleton loaders for form fields (LoginFormSkeleton)
 *    - Suspense fallbacks prevent layout shift
 */

// Critical components - loaded immediately
import { LoginPage } from "./components/LoginPage";
import { SignUpPage } from "./components/SignUpPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { Dashboard } from "./components/Dashboard";

// Lazy-loaded non-critical components
const Footer = lazy(() => import("./components/Footer").then(m => ({ default: m.Footer })));
const HomePage = lazy(() => import("./components/HomePage").then(m => ({ default: m.HomePage })));
const WelcomePage = lazy(() => import("./components/WelcomePage").then(m => ({ default: m.WelcomePage })));
const QuickStartGuidePage = lazy(() => import("./components/QuickStartGuidePage").then(m => ({ default: m.QuickStartGuidePage })));
const SearchListings = lazy(() => import("./components/SearchListings").then(m => ({ default: m.SearchListings })));
const AutomationsManagementPage = lazy(() => import("./components/AutomationsManagementPage").then(m => ({ default: m.AutomationsManagementPage })));
const SavedListingsPage = lazy(() => import("./components/SavedListingsPage").then(m => ({ default: m.SavedListingsPage })));
const AccountPage = lazy(() => import("./components/AccountPage").then(m => ({ default: m.AccountPage })));
const DesignSystemDemo = lazy(() => import("./components/DesignSystemDemo").then(m => ({ default: m.DesignSystemDemo })));
const DataSetsPage = lazy(() => import("./components/DataSetsPage").then(m => ({ default: m.DataSetsPage })));
const UseCasesPage = lazy(() => import("./components/UseCasesPage").then(m => ({ default: m.UseCasesPage })));
const HowItWorksPage = lazy(() => import("./components/HowItWorksPage").then(m => ({ default: m.HowItWorksPage })));
const ReportDetailsModal = lazy(() => import("./components/ReportDetailsModal").then(m => ({ default: m.ReportDetailsModal })));
const APIDocumentationPage = lazy(() => import("./components/APIDocumentationPage").then(m => ({ default: m.APIDocumentationPage })));
const HelpCenterPage = lazy(() => import("./components/HelpCenterPage").then(m => ({ default: m.HelpCenterPage })));
const BlogPage = lazy(() => import("./components/BlogPage").then(m => ({ default: m.BlogPage })));
const ChangelogPage = lazy(() => import("./components/ChangelogPage").then(m => ({ default: m.ChangelogPage })));
const AboutPage = lazy(() => import("./components/AboutPage").then(m => ({ default: m.AboutPage })));
const CareersPage = lazy(() => import("./components/CareersPage").then(m => ({ default: m.CareersPage })));
const ContactPage = lazy(() => import("./components/ContactPage").then(m => ({ default: m.ContactPage })));
const ContactSupportPage = lazy(() => import("./components/ContactSupportPage").then(m => ({ default: m.ContactSupportPage })));
const PrivacyPolicyPage = lazy(() => import("./components/PrivacyPolicyPage").then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import("./components/TermsOfServicePage").then(m => ({ default: m.TermsOfServicePage })));
const BillingPage = lazy(() => import("./components/BillingPage").then(m => ({ default: m.BillingPage })));
const AutomationPage = lazy(() => import("./components/AutomationPage").then(m => ({ default: m.AutomationPage })));
const APISetupPage = lazy(() => import("./components/APISetupPage").then(m => ({ default: m.APISetupPage })));
const ConsentMicrocopyPack = lazy(() => import("./components/ConsentMicrocopyPack").then(m => ({ default: m.ConsentMicrocopyPack })));
const ConsentProvenancePanelDemo = lazy(() => import("./components/ConsentProvenancePanelDemo").then(m => ({ default: m.ConsentProvenancePanelDemo })));
const PreSyncMarketingModalDemo = lazy(() => import("./components/PreSyncMarketingModalDemo").then(m => ({ default: m.PreSyncMarketingModalDemo })));
const RequestIntegrationPage = lazy(() => import("./components/RequestIntegrationPage").then(m => ({ default: m.RequestIntegrationPage })));
const IntegrationsPage = lazy(() => import("./components/IntegrationsPage").then(m => ({ default: m.IntegrationsPage })));
const IntegrationsMarketingPage = lazy(() => import("./components/IntegrationsMarketingPage").then(m => ({ default: m.IntegrationsMarketingPage })));
const AutomationDetailPage = lazy(() => import("./components/AutomationDetailPage").then(m => ({ default: m.AutomationDetailPage })));
const SampleReportPage = lazy(() => import("./components/SampleReportPage").then(m => ({ default: m.SampleReportPage })));

type Page =
  | "home"
  | "how-it-works"
  | "data-sets"
  | "use-cases"
  | "integrations"
  | "automation"
  | "pricing"
  | "login"
  | "signup"
  | "forgot-password"
  | "reset-password"
  | "welcome"
  | "quick-start-guide"
  | "dashboard"
  | "search-listings"
  | "automations"
  | "automation-detail"
  | "saved-listings"
  | "account"
  | "design-system"
  | "api-documentation"
  | "api-setup"
  | "help-center"
  | "blog"
  | "changelog"
  | "about"
  | "careers"
  | "contact"
  | "contact-support"
  | "privacy"
  | "terms"
  | "billing"
  | "microcopy-pack"
  | "consent-panel-demo"
  | "consent-modal-demo"
  | "sample-report-results"
  | "request-integration";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newReportData, setNewReportData] = useState<any>(null);
  const [accountDefaultTab, setAccountDefaultTab] = useState<'profile' | 'billing' | 'integrations' | 'compliance'>('profile');
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isMainContentReady, setIsMainContentReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Global modal state
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultTab, setModalDefaultTab] = useState<'preferences' | 'history'>('preferences');
  const [showFromNewReport, setShowFromNewReport] = useState(false);

  // Automation detail page state
  const [selectedAutomation, setSelectedAutomation] = useState<any>(null);
  
  // Automations page initial tab state
  const [automationsInitialTab, setAutomationsInitialTab] = useState<'create' | 'automations' | 'history'>('create');

  // Sample report page state
  const [sampleReportZipcode, setSampleReportZipcode] = useState('');
  const [sampleReportListings, setSampleReportListings] = useState<any[]>([]);

  // Initialize dark mode based on system preference or saved preference
  useEffect(() => {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('listingbug_theme');
    
    if (savedTheme === 'dark' || savedTheme === 'light') {
      // Use saved preference
      const prefersDark = savedTheme === 'dark';
      setIsDarkMode(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      // Auto-detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
      // Save the detected preference
      localStorage.setItem('listingbug_theme', prefersDark ? 'dark' : 'light');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('listingbug_theme');
      if (!savedTheme) {
        const prefersDark = e.matches;
        setIsDarkMode(prefersDark);
        document.documentElement.classList.toggle('dark', prefersDark);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Toggle dark mode handler
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('listingbug_theme', newDarkMode ? 'dark' : 'light');
  };

  // Handler for viewing automation detail
  const handleViewAutomationDetail = (automation: any) => {
    setSelectedAutomation(automation);
    navigateWithLoading("automation-detail");
  };

  // Handler for going back from automation detail
  const handleBackToAutomations = () => {
    setSelectedAutomation(null);
    navigateWithLoading("automations");
  };

  // Ensure main content renders within 100ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMainContentReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        navigateWithLoading('dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true);
        navigateWithLoading('dashboard');
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if user is a returning visitor
  const isReturningUser = () => {
    return localStorage.getItem('listingbug_returning_user') === 'true';
  };

  // Mark user as returning visitor
  const markAsReturningUser = () => {
    localStorage.setItem('listingbug_returning_user', 'true');
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    
    // 🔐 SIGN-IN FLOW: Returning users should NOT see walkthrough
    console.log('👋 SIGN-IN → Returning user login (no walkthrough)');
    
    // Mark user as returning to prevent walkthrough from activating
    localStorage.setItem('listingbug_returning_user', 'true');
    
    navigateWithLoading("dashboard");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigateWithLoading("home");
  };

  const handleAddToMyReports = (reportData: any) => {
    // Save search is now handled within SearchListings component
    // This can be a no-op or show a toast
    console.log("Search saved:", reportData);
  };

  const handleOpenReport = (report: Report, tab: 'preferences' | 'history' = 'preferences', fromNewReport: boolean = false) => {
    setSelectedReport(report);
    setModalDefaultTab(tab);
    setShowFromNewReport(fromNewReport);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
    setShowFromNewReport(false);
  };

  const handleSaveReport = (updatedReport: Report) => {
    // Update the selected report to reflect changes in the modal
    setSelectedReport(updatedReport);
    // In a real app, this would persist to a database
    // For now, the updated data exists in the modal state
  };

  // Smart navigation handler for CTAs - routes returning users to login, new users to signup
  const handleSmartNavigate = (page: Page) => {
    if (page === 'signup' && isReturningUser()) {
      navigateWithLoading('login');
    } else {
      navigateWithLoading(page);
    }
  };

  // Handle page navigation with loading animation
  const navigateWithLoading = (page: Page) => {
    setIsPageLoading(true);
    
    // Minimum loading time to avoid flicker
    setTimeout(() => {
      // Wrap state update in startTransition to avoid suspense errors with lazy-loaded components
      startTransition(() => {
        setCurrentPage(page);
      });
      setTimeout(() => {
        setIsPageLoading(false);
      }, 300);
    }, 100);
  };

  // Scroll to top whenever the page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case "home":
      case "pricing":
        return <HomePage 
          page={currentPage} 
          onNavigate={handleSmartNavigate}
          onSampleReportGenerated={(zipcode, listings) => {
            setSampleReportZipcode(zipcode);
            setSampleReportListings(listings);
            navigateWithLoading('sample-report-results');
          }}
        />;
      case "data-sets":
        return <DataSetsPage onNavigate={handleSmartNavigate} />;
      case "use-cases":
        return <UseCasesPage onNavigate={handleSmartNavigate} />;
      case "login":
        return <LoginPage onLogin={handleLogin} onNavigateToSignUp={() => navigateWithLoading("signup")} onNavigateToForgotPassword={() => navigateWithLoading("forgot-password")} onNavigateToHelp={() => navigateWithLoading("help-center")} />;
      case "signup":
        return <SignUpPage onSignUp={() => {
          setIsLoggedIn(true);
          
          // NEW USER - Explicitly mark as NOT a returning user
          localStorage.removeItem('listingbug_returning_user');
          console.log('🆕 NEW USER SIGNUP - Starting fresh account with empty data');
          
          // Initialize with empty data for new users
          localStorage.setItem('listingbug_saved_searches', JSON.stringify([]));
          localStorage.setItem('listingbug_saved_listings', JSON.stringify([]));
          localStorage.setItem('listingbug_automations', JSON.stringify([]));
          localStorage.setItem('listingbug_integrations', JSON.stringify([]));
          
          // Auto-start walkthrough for new users (currently disabled globally)
          localStorage.setItem('listingbug_walkthrough_step', '1');
          localStorage.removeItem('listingbug_walkthrough_completed');
          
          // Go directly to dashboard (walkthrough will activate automatically when re-enabled)
          navigateWithLoading("dashboard");
        }} onNavigateToLogin={() => navigateWithLoading("login")} onNavigateToHelp={() => navigateWithLoading("help-center")} />;
      case "forgot-password":
        return <ForgotPasswordPage onNavigateToLogin={() => navigateWithLoading("login")} onNavigateToContactSupport={() => navigateWithLoading("contact-support")} />;
      case "reset-password":
        return <ResetPasswordPage 
          token={undefined} // In real app, extract from URL params
          onNavigateToLogin={() => navigateWithLoading("login")} 
          onNavigateToForgotPassword={() => navigateWithLoading("forgot-password")}
        />;
      case "welcome":
        return <WelcomePage 
          userName="User"
          onContinue={() => navigateWithLoading("quick-start-guide")}
          onSkipToReport={() => navigateWithLoading("search-listings")}
        />;
      case "quick-start-guide":
        return <QuickStartGuidePage 
          onComplete={() => navigateWithLoading("search-listings")}
          onSkip={() => navigateWithLoading("search-listings")}
        />;
      case "dashboard":
        return isLoggedIn ? (
          <Dashboard 
            onNavigate={navigateWithLoading} 
            onOpenReport={handleOpenReport}
            onAccountTabChange={setAccountDefaultTab}
            onViewAutomationDetail={handleViewAutomationDetail}
            onSetAutomationsTab={setAutomationsInitialTab}
          />
        ) : (
          <LoginPage onLogin={handleLogin} />
        );
      case "search-listings":
        return isLoggedIn ? (
          <SearchListings 
            onAddToMyReports={handleAddToMyReports} 
            onNavigate={handleSmartNavigate}
          />
        ) : (
          <LoginPage onLogin={handleLogin} />
        );
      case "automations":
        return isLoggedIn ? (
          <AutomationsManagementPage 
            onViewDetail={handleViewAutomationDetail} 
            initialTab={automationsInitialTab}
          />
        ) : (
          <LoginPage onLogin={handleLogin} />
        );
      case "automation-detail":
        return isLoggedIn && selectedAutomation ? (
          <AutomationDetailPage 
            automation={selectedAutomation}
            onBack={handleBackToAutomations}
            onDelete={(id) => {
              // Handle delete logic here
              const stored = localStorage.getItem('listingbug_automations');
              if (stored) {
                try {
                  const automations = JSON.parse(stored);
                  const updated = automations.filter((a: any) => a.id !== id);
                  localStorage.setItem('listingbug_automations', JSON.stringify(updated));
                } catch (e) {
                  console.error('Failed to delete automation:', e);
                }
              }
            }}
            onToggleActive={(id, active) => {
              // Handle toggle logic here
              const stored = localStorage.getItem('listingbug_automations');
              if (stored) {
                try {
                  const automations = JSON.parse(stored);
                  const updated = automations.map((a: any) => 
                    a.id === id ? { ...a, active } : a
                  );
                  localStorage.setItem('listingbug_automations', JSON.stringify(updated));
                  setSelectedAutomation({ ...selectedAutomation, active });
                } catch (e) {
                  console.error('Failed to toggle automation:', e);
                }
              }
            }}
            onEdit={(automation) => {
              // Navigate back to automations page with edit modal
              setSelectedAutomation(automation);
              handleBackToAutomations();
            }}
          />
        ) : (
          <LoginPage onLogin={handleLogin} />
        );
      case "saved-listings":
        return isLoggedIn ? (
          <SavedListingsPage />
        ) : (
          <LoginPage onLogin={handleLogin} />
        );
      case "account":
        return isLoggedIn ? (
          <AccountPage 
            onLogout={handleLogout} 
            defaultTab={accountDefaultTab}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onNavigate={navigateWithLoading}
          />
        ) : (
          <LoginPage onLogin={handleLogin} />
        );
      case "design-system":
        return <DesignSystemDemo />;
      case "how-it-works":
        return <HowItWorksPage onNavigate={navigateWithLoading} />;
      case "integrations":
        return isLoggedIn ? (
          <IntegrationsPage onNavigate={navigateWithLoading} />
        ) : (
          <IntegrationsMarketingPage onNavigate={navigateWithLoading} />
        );
      case "api-documentation":
        return <APIDocumentationPage />;
      case "api-setup":
        return <APISetupPage />;
      case "help-center":
        return <HelpCenterPage onNavigateToContactSupport={() => navigateWithLoading("contact-support")} />;
      case "blog":
        return <BlogPage />;
      case "changelog":
        return <ChangelogPage />;
      case "about":
        return <AboutPage />;
      case "careers":
        return <CareersPage />;
      case "contact":
        return <ContactPage />;
      case "contact-support":
        return <ContactSupportPage />;
      case "privacy":
        return <PrivacyPolicyPage />;
      case "terms":
        return <TermsOfServicePage />;
      case "billing":
        return <BillingPage />;
      case "automation":
        return <AutomationPage onNavigate={navigateWithLoading} />;
      case "microcopy-pack":
        return <ConsentMicrocopyPack />;
      case "consent-panel-demo":
        return <ConsentProvenancePanelDemo />;
      case "consent-modal-demo":
        return <PreSyncMarketingModalDemo />;
      case "sample-report-results":
        return <SampleReportPage 
          zipcode={sampleReportZipcode}
          listings={sampleReportListings}
          onNavigate={handleSmartNavigate}
        />;
      case "request-integration":
        return <RequestIntegrationPage onBack={() => navigateWithLoading('integrations')} isMember={false} />;
      default:
        return <HomePage page="home" onNavigate={handleSmartNavigate} />;
    }
  };

  return (
    <ErrorBoundary>
      <WalkthroughProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <PageLoader isLoading={isPageLoading} />
          
          {/* Simplified header for login/signup pages */}
          {(currentPage === "login" || currentPage === "signup") && (
            <LoginHeader 
              onNavigateToHome={() => navigateWithLoading("home")}
              onNavigateToHelp={() => navigateWithLoading("help-center")}
            />
          )}
          
          {/* Standard header for all other pages */}
          {currentPage !== "welcome" && 
           currentPage !== "quick-start-guide" && 
           currentPage !== "forgot-password" && 
           currentPage !== "reset-password" &&
           currentPage !== "login" &&
           currentPage !== "signup" && (
            <Header
              currentPage={currentPage}
              isLoggedIn={isLoggedIn}
              onNavigate={navigateWithLoading}
              onSignOut={handleLogout}
              onAccountTabChange={setAccountDefaultTab}
              onToggleDarkMode={toggleDarkMode}
              isDarkMode={isDarkMode}
            />
          )}
          
          <main className={`flex-1 bg-white dark:bg-[#0f0f0f] ${isMainContentReady ? 'loaded' : 'loading'}`}>
            <Suspense fallback={<PageLoader isLoading={true} />}>
              {isMainContentReady ? renderPage() : <PageLoader isLoading={true} />}
            </Suspense>
          </main>
          
          {currentPage !== "login" && 
           currentPage !== "signup" && 
           currentPage !== "forgot-password" && 
           currentPage !== "reset-password" &&
           currentPage !== "welcome" && 
           currentPage !== "quick-start-guide" && (
            <Suspense fallback={null}>
              <Footer isLoggedIn={isLoggedIn} onNavigate={navigateWithLoading} onAccountTabChange={setAccountDefaultTab} />
            </Suspense>
          )}
          
          {/* Global Report Details Modal - Lazy loaded */}
          {isModalOpen && (
            <Suspense fallback={null}>
              <ReportDetailsModal
                report={selectedReport}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveReport}
                showFromNewReport={showFromNewReport}
                defaultTab={modalDefaultTab}
              />
            </Suspense>
          )}
          
          {/* Toast Container */}
          <ToastContainer />
          <Toaster position="top-right" richColors />
        </div>
      </WalkthroughProvider>
    </ErrorBoundary>
  );
}