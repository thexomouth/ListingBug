import { useState, useEffect, lazy, Suspense, startTransition } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'sonner';
import { supabase } from './lib/supabase';
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { LoginHeader } from "./components/LoginHeader";
import { PageLoader } from "./components/PageLoader";
import { WalkthroughProvider } from "./components/WalkthroughContext";

// Critical components - loaded immediately
import { LoginPage } from "./components/LoginPage";
import { SignUpPage } from "./components/SignUpPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { Dashboard } from "./components/Dashboard";
import { AutomationRunPage } from "./components/AutomationRunPage";

import { OnboardingModalA, OnboardingModalB, OnboardingModalC, OnboardingModalD } from "./components/OnboardingModals";

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
const SearchResultsPage = lazy(() => import("./components/SearchResultsPage").then(m => ({ default: m.SearchResultsPage })));
const AgentsPage = lazy(() => import("./components/AgentsPage").then(m => ({ default: m.AgentsPage })));
const IntegrationSetupGuidePage = lazy(() => import("./components/IntegrationSetupGuidePage").then(m => ({ default: m.IntegrationSetupGuidePage })));
const BlogPostPage = lazy(() => import("./components/BlogPostPage").then(m => ({ default: m.BlogPostPage })));
const PersonaPage = lazy(() => import("./components/PersonaPage").then(m => ({ default: m.PersonaPage })));
const ComparisonPage = lazy(() => import("./components/ComparisonPage").then(m => ({ default: m.ComparisonPage })));
const LegalPage = lazy(() => import("./components/LegalPage").then(m => ({ default: m.LegalPage })));
const MessagingPage = lazy(() => import("./components/MessagingPage").then(m => ({ default: m.MessagingPage })));
const UnsubscribePage = lazy(() => import("./components/UnsubscribePage").then(m => ({ default: m.UnsubscribePage })));
const CleanPage = lazy(() => import("./components/CleanPage").then(m => ({ default: m.CleanPage })));
const DripPage = lazy(() => import("./components/DripPage").then(m => ({ default: m.DripPage })));
const NewCampaign = lazy(() => import("./components/v2/NewCampaign").then(m => ({ default: m.NewCampaign })));
const V2Dashboard = lazy(() => import("./components/v2/V2Dashboard").then(m => ({ default: m.V2Dashboard })));
const V2Campaign = lazy(() => import("./components/v2/V2Campaign").then(m => ({ default: m.V2Campaign })));

type Page =
  | "home" | "how-it-works" | "data-sets" | "use-cases" | "integrations"
  | "automation" | "pricing" | "login" | "signup" | "forgot-password"
  | "reset-password" | "welcome" | "quick-start-guide" | "dashboard"
  | "search-listings" | "search-results" | "automations" | "automation-detail"
  | "automation-run-results"
  | "agents" | "saved-listings" | "account" | "design-system" | "api-documentation"
  | "api-setup" | "help-center" | "blog" | "changelog" | "about" | "careers"
  | "contact" | "contact-support" | "privacy" | "terms" | "billing"
  | "microcopy-pack" | "consent-panel-demo" | "consent-modal-demo"
  | "sample-report-results" | "request-integration" | "integration-guide"
  | "blog-post" | "persona-page" | "comparison-page"
  | "legal-dpa" | "legal-subprocessors"
  | "messaging"
  | "unsubscribe"
  | "clean"
  | "drip"
  | "v2-dashboard"
  | "v2-new-campaign"
  | "v2-campaign";

const PAGE_TO_PATH: Record<Page, string> = {
  "home": "/", "pricing": "/pricing", "how-it-works": "/how-it-works",
  "data-sets": "/data-sets", "use-cases": "/use-cases", "integrations": "/integrations",
  "automation": "/automation", "login": "/login", "signup": "/signup",
  "forgot-password": "/forgot-password", "reset-password": "/reset-password",
  "welcome": "/welcome", "quick-start-guide": "/quick-start", "dashboard": "/dashboard",
  "search-listings": "/listings", "search-results": "/listings/results",
  "automations": "/automations", "automation-detail": "/automations/detail",
  "automation-run-results": "/automations/results",
  "agents": "/agents",
  "saved-listings": "/saved", "account": "/account", "design-system": "/design-system",
  "api-documentation": "/api-docs", "api-setup": "/api-setup", "help-center": "/help",
  "blog": "/blog", "changelog": "/changelog", "about": "/about", "careers": "/careers",
  "contact": "/contact", "contact-support": "/support", "privacy": "/privacy",
  "terms": "/terms", "billing": "/billing", "microcopy-pack": "/microcopy-pack",
  "consent-panel-demo": "/consent-panel", "consent-modal-demo": "/consent-modal",
  "sample-report-results": "/sample-report", "request-integration": "/request-integration",
  "integration-guide": "/integrations/guide",
  "blog-post": "/blog/automate-agent-outreach",
  "persona-page": "/for/mortgage-brokers",
  "comparison-page": "/vs/zillow",
  "legal-dpa": "/legal/dpa",
  "legal-subprocessors": "/legal/subprocessors",
  "messaging": "/messaging",
  "unsubscribe": "/unsubscribe",
  "clean": "/clean",
  "drip": "/drip",
  "v2-dashboard": "/v2/dashboard",
  "v2-new-campaign": "/v2/newcampaign",
  "v2-campaign": "/v2/campaign",
};

const PATH_TO_PAGE: Record<string, Page> = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page as Page])
);

function pathToPage(pathname: string): Page {
  if (PATH_TO_PAGE[pathname]) return PATH_TO_PAGE[pathname];
  if (pathname === '/automations/results') return 'automation-run-results';
  if (pathname.startsWith('/automations/')) return 'automation-detail';
  if (pathname.startsWith('/listings/')) return 'search-results';
  if (pathname.startsWith('/account')) return 'account';
  if (pathname.startsWith('/integrations/guide')) return 'integration-guide';
  if (pathname.startsWith('/blog/')) return 'blog-post';
  if (pathname.startsWith('/for/')) return 'persona-page';
  if (pathname.startsWith('/vs/')) return 'comparison-page';
  if (pathname.startsWith('/legal/')) {
    if (pathname === '/legal/dpa') return 'legal-dpa';
    if (pathname === '/legal/subprocessors') return 'legal-subprocessors';
  }
  if (pathname.startsWith('/messaging')) return 'messaging';
  if (pathname.startsWith('/unsubscribe')) return 'unsubscribe';
  if (pathname.startsWith('/clean')) return 'clean';
  if (pathname.startsWith('/drip')) return 'drip';
  if (pathname === '/v2/dashboard') return 'v2-dashboard';
  if (pathname === '/v2/newcampaign') return 'v2-new-campaign';
  if (pathname.startsWith('/v2/campaign')) return 'v2-campaign';
  return 'home';
}

// Inline — no separate import to avoid TDZ crash
function SubscriptionGate({ planStatus, trialEndsAt, onUpgrade }: { planStatus: string; trialEndsAt: string | null; onUpgrade: () => void }) {
  const isExpired = planStatus === 'canceled' || planStatus === 'incomplete_expired';
  const isPastDue = planStatus === 'past_due' || planStatus === 'unpaid';
  const isTrialExpired = planStatus === 'trialing' && !!trialEndsAt && new Date(trialEndsAt) < new Date();
  if (!isExpired && !isPastDue && !isTrialExpired) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '12px', maxWidth: '420px', width: '100%', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👑</div>
        <h2 style={{ color: '#342E37', marginBottom: '0.5rem', fontSize: '1.4rem', fontWeight: 700 }}>
          {isPastDue ? 'Payment issue' : 'Your subscription has ended'}
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {isPastDue ? "We couldn't process your last payment. Update your billing to stay active." : 'Upgrade to keep searching listings and running automations.'}
        </p>
        <button onClick={onUpgrade} style={{ background: '#FFD447', color: '#342E37', border: 'none', borderRadius: '8px', padding: '0.75rem 2rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', width: '100%' }}>
          {isPastDue ? 'Update Billing' : 'Choose a Plan — from $19/mo'}
        </button>
      </div>
    </div>
  );
}

// Proper redirect component — never calls navigation during render
function RedirectToSearchHistory({ onRedirect }: { onRedirect: () => void }) {
  useEffect(() => { onRedirect(); }, []);
  return null;
}

/** Read the selected automation run from sessionStorage. Used as fallback when
 *  React state is lost across the navigateWithLoading transition. */
function getStoredAutomationRun(): any | null {
  try {
    const s = sessionStorage.getItem('listingbug_selected_automation_run');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // FIX: include 'usage' so Header nav to usage tab doesn't cause chunk load error
  const [accountDefaultTab, setAccountDefaultTab] = useState<'profile' | 'usage' | 'billing' | 'integrations' | 'compliance'>('profile');
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isMainContentReady, setIsMainContentReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [planStatus, setPlanStatus] = useState<string>('active');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [onboardingSeen, setOnboardingSeen] = useState<Record<string, boolean>>({});
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultTab, setModalDefaultTab] = useState<'preferences' | 'history'>('preferences');
  const [showFromNewReport, setShowFromNewReport] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<any>(null);
  const [automationsInitialTab, setAutomationsInitialTab] = useState<'create' | 'automations' | 'history'>('automations');
  const [selectedSearchRun, setSelectedSearchRun] = useState<any | null>(null);
  const [selectedAutomationRun, setSelectedAutomationRun] = useState<any | null>(null);
  const [sampleReportZipcode, setSampleReportZipcode] = useState('');
  const [sampleReportListings, setSampleReportListings] = useState<any[]>([]);
  const [sampleReportError, setSampleReportError] = useState<string | null>(null);
  const [sampleReportLoading, setSampleReportLoading] = useState(false);
  const [pageResetKey, setPageResetKey] = useState(0);

  // Onboarding modal state
  const [onboardingModal, setOnboardingModal] = useState<'a' | 'b' | 'c' | 'd' | null>(null);
  const [firstSearchCity, setFirstSearchCity] = useState<string | null>(null);

  const currentPage = pathToPage(location.pathname);

  useEffect(() => {
    const savedTheme = localStorage.getItem('listingbug_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      const prefersDark = savedTheme === 'dark';
      setIsDarkMode(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
      localStorage.setItem('listingbug_theme', prefersDark ? 'dark' : 'light');
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('listingbug_theme');
      if (!saved) {
        setIsDarkMode(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('listingbug_theme', newDarkMode ? 'dark' : 'light');
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsMainContentReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        const authPages = ['/login', '/signup', '/'];
        if (authPages.includes(location.pathname) || location.pathname === '/') {
          // Navigate immediately — no delay — so login form is never interactive with existing session
          navigate(PAGE_TO_PATH['dashboard']);
        }
        const { data } = await supabase.from('users').select('plan_status, trial_ends_at, onboarding_seen').eq('id', session.user.id).single();
        if (data) { setPlanStatus(data.plan_status ?? 'active'); setTrialEndsAt(data.trial_ends_at ?? null); setOnboardingSeen(data.onboarding_seen ?? {}); }
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        // Supabase has exchanged the recovery token for a session — send user to reset form
        navigate(PAGE_TO_PATH['reset-password']);
        return;
      }
      if (session) {
        setIsLoggedIn(true);
        const publicPages = ['/login', '/signup', '/forgot-password'];
        if (publicPages.includes(location.pathname)) {
          // Navigate immediately — no delay — so login form is never interactive with existing session
          navigate(PAGE_TO_PATH['dashboard']);
        }
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // FIX: force scroll to top on every route change — works on mobile Brave/Safari
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  const navigateWithLoading = (page: Page) => {
    const path = PAGE_TO_PATH[page] || '/';
    const isSamePage = pathToPage(location.pathname) === page;
    setIsPageLoading(true);
    if (isSamePage) setPageResetKey(k => k + 1);
    setTimeout(() => {
      startTransition(() => { navigate(path); });
      setTimeout(() => setIsPageLoading(false), 300);
    }, 100);
  };

  const isReturningUser = () => localStorage.getItem('listingbug_returning_user') === 'true';

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('listingbug_returning_user', 'true');
    navigateWithLoading('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate('/');
  };

  const handleSmartNavigate = (page: Page) => {
    if (page === 'signup' && isReturningUser()) {
      navigateWithLoading('login');
    } else {
      navigateWithLoading(page);
    }
  };

  const handleViewAutomationDetail = (automation: any) => {
    setSelectedAutomation(automation);
    navigateWithLoading('automation-detail');
  };

  const handleBackToAutomations = () => {
    setSelectedAutomation(null);
    navigateWithLoading('automations');
  };

  const handleViewSearchResults = (searchRun: any) => {
    setSelectedSearchRun(searchRun);
    navigateWithLoading('search-results');
  };

  const handleOpenReport = (report: any, tab: 'preferences' | 'history' = 'preferences', fromNewReport: boolean = false) => {
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

  const handleSaveReport = (updatedReport: any) => { setSelectedReport(updatedReport); };
  const handleAddToMyReports = (reportData: any) => { console.log("Search saved:", reportData); };

  // Onboarding modal handlers — each fires at most once (guarded by DB per-account)
  const handleFirstSearchComplete = (city: string) => {
    if (onboardingSeen['a']) return;
    if (city) setFirstSearchCity(city);
    setOnboardingModal('a');
  };

  const handleIntegrationConnected = () => {
    if (onboardingSeen['b']) return;
    setOnboardingModal('b');
  };

  const handleFirstExport = () => {
    if (onboardingSeen['c']) return;
    setOnboardingModal('c');
  };

  const handleFirstAutomationCreated = (automation: any) => {
    if (onboardingSeen['d']) return;
    const city = automation?.searchCriteria?.city || automation?.searchName?.split(',')[0] || firstSearchCity || null;
    if (city) setFirstSearchCity(city);
    setOnboardingModal('d');
  };

  const dismissOnboardingModal = async () => {
    if (onboardingModal) {
      const updated = { ...onboardingSeen, [onboardingModal]: true };
      setOnboardingSeen(updated);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('users').update({ onboarding_seen: updated }).eq('id', user.id);
      }
    }
    setOnboardingModal(null);
  };

  const isAuthPage = currentPage === 'login' || currentPage === 'signup';
  const isMinimalPage = ['welcome', 'quick-start-guide', 'forgot-password', 'reset-password', 'login', 'signup', 'unsubscribe', 'clean', 'drip'].includes(currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case "home": case "pricing":
        return <HomePage page={currentPage} onNavigate={handleSmartNavigate}
          onSampleReportGenerated={(zipcode, listings) => {
            setSampleReportZipcode(zipcode); setSampleReportListings(listings);
            setSampleReportError(listings.length === 0 ? 'No listings found for that ZIP code. Try another.' : null);
            setSampleReportLoading(false); navigateWithLoading('sample-report-results');
          }}
          onSampleReportLoading={(loading) => setSampleReportLoading(loading)} />;
      case "data-sets": return <DataSetsPage onNavigate={handleSmartNavigate} />;
      case "use-cases": return <UseCasesPage onNavigate={handleSmartNavigate} />;
      case "how-it-works": return <HowItWorksPage onNavigate={navigateWithLoading} />;
      case "login": return <LoginPage onLogin={handleLogin} onNavigateToSignUp={() => navigateWithLoading('signup')} onNavigateToForgotPassword={() => navigateWithLoading('forgot-password')} onNavigateToHelp={() => navigateWithLoading('help-center')} />;
      case "signup": return <SignUpPage onSignUp={() => { setIsLoggedIn(true); localStorage.removeItem('listingbug_returning_user'); localStorage.setItem('listingbug_saved_searches', JSON.stringify([])); localStorage.setItem('listingbug_saved_listings', JSON.stringify([])); localStorage.setItem('listingbug_automations', JSON.stringify([])); localStorage.setItem('listingbug_integrations', JSON.stringify([])); localStorage.setItem('listingbug_walkthrough_step', '1'); localStorage.removeItem('listingbug_walkthrough_completed'); navigateWithLoading('dashboard'); }} onNavigateToLogin={() => navigateWithLoading('login')} onNavigateToHelp={() => navigateWithLoading('help-center')} />;
      case "forgot-password": return <ForgotPasswordPage onNavigateToLogin={() => navigateWithLoading('login')} onNavigateToContactSupport={() => navigateWithLoading('contact-support')} />;
      case "reset-password": return <ResetPasswordPage token={undefined} onNavigateToLogin={() => navigateWithLoading('login')} onNavigateToForgotPassword={() => navigateWithLoading('forgot-password')} />;
      case "welcome": return <WelcomePage userName="User" onContinue={() => navigateWithLoading('quick-start-guide')} onSkipToReport={() => navigateWithLoading('search-listings')} />;
      case "quick-start-guide": return <QuickStartGuidePage onComplete={() => navigateWithLoading('search-listings')} onSkip={() => navigateWithLoading('search-listings')} />;
      case "dashboard": return isLoggedIn ? <Dashboard onNavigate={navigateWithLoading} onOpenReport={handleOpenReport} onAccountTabChange={setAccountDefaultTab} onViewAutomationDetail={handleViewAutomationDetail} onSetAutomationsTab={setAutomationsInitialTab} /> : <LoginPage onLogin={handleLogin} />;
      case "search-listings": return isLoggedIn ? <SearchListings onAddToMyReports={handleAddToMyReports} onNavigate={handleSmartNavigate} onViewSearchResults={handleViewSearchResults} onFirstSearchComplete={handleFirstSearchComplete} onFirstExport={handleFirstExport} /> : <LoginPage onLogin={handleLogin} />;
      case "search-results": return isLoggedIn
        ? selectedSearchRun
          ? <SearchResultsPage searchRun={selectedSearchRun} onBack={() => {
              sessionStorage.setItem('listingbug_open_tab', 'history');
              navigateWithLoading('search-listings');
            }} />
          : <RedirectToSearchHistory onRedirect={() => {
              sessionStorage.setItem('listingbug_open_tab', 'history');
              navigateWithLoading('search-listings');
            }} />
        : <LoginPage onLogin={handleLogin} />;
      case "automations": return isLoggedIn ? <AutomationsManagementPage
        onViewDetail={handleViewAutomationDetail}
        initialTab={automationsInitialTab}
        onNavigate={navigateWithLoading}
        onFirstAutomationCreated={handleFirstAutomationCreated}
        onViewRunDetails={(run) => {
          // Write to sessionStorage BEFORE navigating so the run survives
          // the navigateWithLoading timeout/transition which can drop React state.
          sessionStorage.setItem('listingbug_selected_automation_run', JSON.stringify(run));
          setSelectedAutomationRun(run);
          navigateWithLoading('automation-run-results');
        }}
      /> : <LoginPage onLogin={handleLogin} />;
      case "automation-run-results": {
        // Prefer React state; fall back to sessionStorage if state was lost across navigation.
        const run = selectedAutomationRun ?? getStoredAutomationRun();
        return isLoggedIn && run ? (
          <AutomationRunPage run={run} onBack={() => {
            sessionStorage.removeItem('listingbug_selected_automation_run');
            navigateWithLoading('automations');
          }} />
        ) : <LoginPage onLogin={handleLogin} />;
      }
      case "automation-detail": return isLoggedIn && selectedAutomation ? (
        <AutomationDetailPage automation={selectedAutomation} onBack={handleBackToAutomations}
          onDelete={(id) => { const stored = localStorage.getItem('listingbug_automations'); if (stored) { try { const a = JSON.parse(stored); localStorage.setItem('listingbug_automations', JSON.stringify(a.filter((x: any) => x.id !== id))); } catch (e) {} } }}
          onToggleActive={(id, active) => { const stored = localStorage.getItem('listingbug_automations'); if (stored) { try { const a = JSON.parse(stored); localStorage.setItem('listingbug_automations', JSON.stringify(a.map((x: any) => x.id === id ? { ...x, active } : x))); setSelectedAutomation({ ...selectedAutomation, active }); } catch (e) {} } }}
          onEdit={(automation) => { setSelectedAutomation(automation); handleBackToAutomations(); }} />
      ) : <LoginPage onLogin={handleLogin} />;
      case "saved-listings": return isLoggedIn ? <SavedListingsPage /> : <LoginPage onLogin={handleLogin} />;
      case "agents": return isLoggedIn ? <AgentsPage onNavigate={navigateWithLoading} /> : <LoginPage onLogin={handleLogin} />;
      case "account": return isLoggedIn ? <AccountPage onLogout={handleLogout} defaultTab={accountDefaultTab} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} onNavigate={navigateWithLoading} /> : <LoginPage onLogin={handleLogin} />;
      case "integrations": return isLoggedIn ? <IntegrationsPage onNavigate={navigateWithLoading} onConnect={handleIntegrationConnected} /> : <IntegrationsMarketingPage onNavigate={navigateWithLoading} />;
      case "billing": return <BillingPage />;
      case "privacy": return <PrivacyPolicyPage />;
      case "terms": return <TermsOfServicePage />;
      case "about": return <AboutPage />;
      case "blog": return <BlogPage />;
      case "changelog": return <ChangelogPage />;
      case "help-center": return <HelpCenterPage onNavigateToContactSupport={() => navigateWithLoading('contact-support')} />;
      case "contact": return <ContactPage />;
      case "contact-support": return <ContactSupportPage />;
      case "careers": return <CareersPage />;
      case "api-documentation": return <APIDocumentationPage />;
      case "api-setup": return <APISetupPage />;
      case "design-system": return <DesignSystemDemo />;
      case "automation": return <AutomationPage onNavigate={navigateWithLoading} />;
      case "microcopy-pack": return <ConsentMicrocopyPack />;
      case "consent-panel-demo": return <ConsentProvenancePanelDemo />;
      case "consent-modal-demo": return <PreSyncMarketingModalDemo />;
      case "sample-report-results": return <SampleReportPage zipcode={sampleReportZipcode} listings={sampleReportListings} isLoading={sampleReportLoading} error={sampleReportError} onNavigate={handleSmartNavigate} />;
      case "request-integration": return <RequestIntegrationPage onBack={() => navigateWithLoading('integrations')} isMember={false} />;
      case "integration-guide": return <IntegrationSetupGuidePage onBack={() => navigateWithLoading('integrations')} />;
      case "blog-post": return <BlogPostPage />;
      case "persona-page": return <PersonaPage />;
      case "comparison-page": return <ComparisonPage />;
      case "legal-dpa": return <LegalPage />;
      case "legal-subprocessors": return <LegalPage />;
      case "messaging": return <MessagingPage />;
      case "unsubscribe": return <UnsubscribePage />;
      case "clean": return <CleanPage />;
      case "drip": return <DripPage />;
      case "v2-dashboard": return isLoggedIn ? <V2Dashboard /> : <LoginPage onLogin={handleLogin} />;
      case "v2-new-campaign": return isLoggedIn ? <NewCampaign /> : <LoginPage onLogin={handleLogin} />;
      case "v2-campaign": return isLoggedIn ? <V2Campaign /> : <LoginPage onLogin={handleLogin} />;
      default: return <HomePage page="home" onNavigate={handleSmartNavigate} />;
    }
  };

  return (
    <ErrorBoundary>
      <WalkthroughProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <PageLoader isLoading={isPageLoading} />
          {isAuthPage && <LoginHeader onNavigateToHome={() => navigate('/')} onNavigateToHelp={() => navigateWithLoading('help-center')} />}
          {!isMinimalPage && <Header currentPage={currentPage} isLoggedIn={isLoggedIn} onNavigate={navigateWithLoading} onSignOut={handleLogout} onAccountTabChange={setAccountDefaultTab} onToggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />}
          {isLoggedIn && <SubscriptionGate planStatus={planStatus} trialEndsAt={trialEndsAt} onUpgrade={() => { navigateWithLoading('account'); setAccountDefaultTab('billing'); }} />}
          <main className={`flex-1 bg-white dark:bg-[#0f0f0f] ${isMainContentReady ? 'loaded' : 'loading'}`}>
            <Suspense key={pageResetKey} fallback={<PageLoader isLoading={true} />}>
              {isMainContentReady ? renderPage() : <PageLoader isLoading={true} />}
            </Suspense>
          </main>
          {!isMinimalPage && <Suspense fallback={null}><Footer isLoggedIn={isLoggedIn} onNavigate={navigateWithLoading} onAccountTabChange={setAccountDefaultTab} /></Suspense>}
          {isModalOpen && <Suspense fallback={null}><ReportDetailsModal report={selectedReport} isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveReport} showFromNewReport={showFromNewReport} defaultTab={modalDefaultTab} /></Suspense>}
          <ToastContainer />
          <Toaster position="top-right" richColors toastOptions={{ success: { duration: 2000 } }} />
          {/* Onboarding modals — rendered at App level so they survive page navigation */}
          <OnboardingModalA isOpen={onboardingModal === 'a'} onNavigate={navigateWithLoading} onDismiss={dismissOnboardingModal} />
          <OnboardingModalB isOpen={onboardingModal === 'b'} onNavigate={navigateWithLoading} onDismiss={dismissOnboardingModal} />
          <OnboardingModalC isOpen={onboardingModal === 'c'} onNavigate={navigateWithLoading} onDismiss={dismissOnboardingModal} />
          <OnboardingModalD isOpen={onboardingModal === 'd'} onNavigate={navigateWithLoading} onDismiss={dismissOnboardingModal} city={firstSearchCity} />
        </div>
      </WalkthroughProvider>
    </ErrorBoundary>
  );
}
