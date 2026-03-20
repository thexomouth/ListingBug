/**
 * USER DATA UTILITIES
 * 
 * Centralized utilities for checking user data state and empty states
 */

export interface UserDataState {
  hasSearches: boolean;
  hasSavedListings: boolean;
  hasAutomations: boolean;
  hasIntegrations: boolean;
  isFirstTimeUser: boolean;
  searchCount: number;
  savedListingsCount: number;
  automationsCount: number;
  integrationsCount: number;
}

/**
 * Get comprehensive user data state from localStorage
 */
export function getUserDataState(): UserDataState {
  // Check saved searches
  try {
    const savedSearches = localStorage.getItem('listingbug_saved_searches');
    const searches = savedSearches ? JSON.parse(savedSearches) : [];
    const searchCount = Array.isArray(searches) ? searches.length : 0;

    // Check saved listings
    const savedListings = localStorage.getItem('listingbug_saved_listings');
    const listings = savedListings ? JSON.parse(savedListings) : [];
    const savedListingsCount = Array.isArray(listings) ? listings.length : 0;

    // Check automations
    const automationsData = localStorage.getItem('listingbug_automations');
    const automations = automationsData ? JSON.parse(automationsData) : [];
    const automationsCount = Array.isArray(automations) ? automations.length : 0;

    // Check integrations (mock for now - in production, this would check actual connected integrations)
    const integrationsData = localStorage.getItem('listingbug_integrations');
    const integrations = integrationsData ? JSON.parse(integrationsData) : [];
    const integrationsCount = Array.isArray(integrations) ? integrations.length : 0;

    // Determine if first-time user (no data at all)
    const isFirstTimeUser = searchCount === 0 && 
                            savedListingsCount === 0 && 
                            automationsCount === 0 && 
                            integrationsCount === 0;

    return {
      hasSearches: searchCount > 0,
      hasSavedListings: savedListingsCount > 0,
      hasAutomations: automationsCount > 0,
      hasIntegrations: integrationsCount > 0,
      isFirstTimeUser,
      searchCount,
      savedListingsCount,
      automationsCount,
      integrationsCount,
    };
  } catch (error) {
    // If there's any error parsing localStorage data, treat as first-time user
    console.error('Error reading user data state:', error);
    return {
      hasSearches: false,
      hasSavedListings: false,
      hasAutomations: false,
      hasIntegrations: false,
      isFirstTimeUser: true,
      searchCount: 0,
      savedListingsCount: 0,
      automationsCount: 0,
      integrationsCount: 0,
    };
  }
}

/**
 * Initialize user data with empty states (for new users)
 */
export function initializeEmptyUserData(): void {
  // Only initialize if data doesn't exist
  if (!localStorage.getItem('listingbug_saved_searches')) {
    localStorage.setItem('listingbug_saved_searches', JSON.stringify([]));
  }
  if (!localStorage.getItem('listingbug_saved_listings')) {
    localStorage.setItem('listingbug_saved_listings', JSON.stringify([]));
  }
  if (!localStorage.getItem('listingbug_automations')) {
    localStorage.setItem('listingbug_automations', JSON.stringify([]));
  }
  if (!localStorage.getItem('listingbug_integrations')) {
    localStorage.setItem('listingbug_integrations', JSON.stringify([]));
  }
}

/**
 * Clear all user data (for testing purposes)
 */
export function clearAllUserData(): void {
  localStorage.removeItem('listingbug_saved_searches');
  localStorage.removeItem('listingbug_saved_listings');
  localStorage.removeItem('listingbug_automations');
  localStorage.removeItem('listingbug_integrations');
}