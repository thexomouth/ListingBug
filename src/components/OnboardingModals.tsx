import { X, ArrowRight } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  headline: string;
  body: string;
  primaryCta: string;
  onPrimary: () => void;
  secondaryCta: string;
}

function OnboardingModalBase({ isOpen, onDismiss, headline, body, primaryCta, onPrimary, secondaryCta }: BaseModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl max-w-sm w-full p-6 relative">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2 pr-6">{headline}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{body}</p>
        <button
          onClick={onPrimary}
          className="w-full flex items-center justify-center gap-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115] font-bold px-4 py-3 rounded-lg text-sm transition-colors mb-2"
        >
          {primaryCta} <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onDismiss}
          className="w-full text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-2"
        >
          {secondaryCta}
        </button>
      </div>
    </div>
  );
}

// Modal A — post first search
export function OnboardingModalA({
  isOpen,
  onNavigate,
  onDismiss,
}: {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onDismiss: () => void;
}) {
  return (
    <OnboardingModalBase
      isOpen={isOpen}
      onDismiss={onDismiss}
      headline="You've got listings — now where do you want to send them?"
      body="Connect an integration to sync listings to Mailchimp, Google Sheets, a webhook, or more."
      primaryCta="Connect a destination"
      onPrimary={() => { onNavigate('integrations'); onDismiss(); }}
      secondaryCta="I'll do this later"
    />
  );
}

// Modal B — post first integration connected
export function OnboardingModalB({
  isOpen,
  onNavigate,
  onDismiss,
}: {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onDismiss: () => void;
}) {
  return (
    <OnboardingModalBase
      isOpen={isOpen}
      onDismiss={onDismiss}
      headline="Connected. Let's export your first batch of listings."
      body="Head back to your search history and export the results to your new integration."
      primaryCta="Go to Search History"
      onPrimary={() => {
        sessionStorage.setItem('listingbug_open_tab', 'history');
        onNavigate('search-listings');
        onDismiss();
      }}
      secondaryCta="I'll do this later"
    />
  );
}

// Modal C — post first export
export function OnboardingModalC({
  isOpen,
  onNavigate,
  onDismiss,
}: {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onDismiss: () => void;
}) {
  return (
    <OnboardingModalBase
      isOpen={isOpen}
      onDismiss={onDismiss}
      headline="Nice work. Want to automate that search?"
      body="Set up a daily automation and ListingBug will run this search and export new listings for you — automatically."
      primaryCta="Set up an automation"
      onPrimary={() => {
        sessionStorage.setItem('listingbug_automations_tab', 'create');
        onNavigate('automations');
        onDismiss();
      }}
      secondaryCta="Maybe later"
    />
  );
}

// Modal D — post first automation created
export function OnboardingModalD({
  isOpen,
  onNavigate,
  onDismiss,
  city,
}: {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onDismiss: () => void;
  city: string | null;
}) {
  const cityLabel = city || 'your area';
  return (
    <OnboardingModalBase
      isOpen={isOpen}
      onDismiss={onDismiss}
      headline={`Want to set up automated messaging for agents in ${cityLabel}?`}
      body="ListingBug Messaging lets you send automated emails directly to agents in your list — from your own sender address."
      primaryCta="Set up messaging"
      onPrimary={() => {
        sessionStorage.setItem('messaging_open_tab', 'setup');
        onNavigate('messaging');
        onDismiss();
      }}
      secondaryCta="Not now"
    />
  );
}
