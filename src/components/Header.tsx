import { Menu, User, X, Bell, ChevronLeft, CheckCircle2, AlertCircle, Info, Trash2, ChevronDown, Moon, Sun } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import headerLogoFull from 'figma:asset/507fab16b51ccf6be96c685cf4c76a6b2a4bb7b0.png';
import headerLogoSimplified from 'figma:asset/18389b12a0fe14349edcb6b64a2864bb6264d47e.png';
import headerLogoWhite from 'figma:asset/ac9d14a9fc5e2f8315c311b8dec3220da367a867.png';
import React, { useState, useEffect, useRef } from 'react';
import { LBToggle } from './design-system/LBToggle';
import { fetchUserNotifications, deleteNotification, markNotificationAsRead } from '../lib/notifications';
import { supabase } from '../lib/supabase';

type Page = 'home' | 'how-it-works' | 'data-sets' | 'use-cases' | 'integrations' | 'pricing' | 'login' | 'dashboard' | 'search-listings' | 'automations' | 'agents' | 'my-listings' | 'my-reports' | 'account' | 'design-system' | 'saved-searches' | 'saved-listings' | 'listing-history' | 'create-automation' | 'my-automations' | 'automation-history';

interface HeaderProps {
  currentPage: Page;
  isLoggedIn: boolean;
  onNavigate: (page: Page) => void;
  onSignOut?: () => void;
  onAccountTabChange?: (tab: 'profile' | 'usage' | 'billing' | 'integrations' | 'compliance') => void;
  onOpenNotifications?: () => void;
  onToggleDarkMode?: () => void;
  isDarkMode?: boolean;
}

// Notification type
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string | null;
  created_at: string;
  read: boolean;
}

// Initialize default notifications in localStorage
const initializeNotifications = (): Notification[] => {
  return [];
};

export function Header({ currentPage, isLoggedIn, onNavigate, onSignOut, onAccountTabChange, onOpenNotifications, onToggleDarkMode, isDarkMode }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mobileListingsExpanded, setMobileListingsExpanded] = useState(false);
  const [mobileAutomationsExpanded, setMobileAutomationsExpanded] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  // Load notifications on mount
  useEffect(() => {
    if (isLoggedIn) {
      // Clear any stale localStorage notifications from old mock data
      localStorage.removeItem('listingbug_notifications');

      const loadNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const notifs = await fetchUserNotifications(user.id);
          setNotifications(notifs);
        }
      };
      
      loadNotifications();
      
      // Set up real-time subscription to notifications table
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          (payload) => {
            // Reload notifications when changes occur
            loadNotifications();
          }
        )
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isLoggedIn]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Save notifications to Supabase (mark all as read and update locally)
  const saveNotifications = (updatedNotifications: Notification[]) => {
    setNotifications(updatedNotifications);
    // Dispatch event to update dashboard and other components
    window.dispatchEvent(new Event('notificationsChanged'));
  };

  // Mark all as read when opening notifications panel
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
    // Update read status in database for each notification
    updated.forEach(n => {
      markNotificationAsRead(n.id).catch(err => console.error('Failed to mark as read:', err));
    });
  };

  // Dismiss individual notification
  const dismissNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
    deleteNotification(id).catch(err => console.error('Failed to delete notification:', err));
  };

  // Clear all read notifications
  const clearAllRead = () => {
    const updated = notifications.filter(n => !n.read);
    saveNotifications(updated);
    // Delete read notifications from database
    notifications.filter(n => n.read).forEach(n => {
      deleteNotification(n.id).catch(err => console.error('Failed to delete notification:', err));
    });
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  };

  // Get notification icon and colors based on type
  const getNotificationStyle = (type: string, isRead: boolean) => {
    const baseStyles = {
      success: {
        bg: isRead ? 'bg-green-50/50' : 'bg-green-50',
        border: isRead ? 'border-green-200/50' : 'border-green-200',
        dot: 'bg-green-500',
        icon: CheckCircle2
      },
      error: {
        bg: isRead ? 'bg-red-50/50' : 'bg-red-50',
        border: isRead ? 'border-red-200/50' : 'border-red-200',
        dot: 'bg-red-500',
        icon: AlertCircle
      },
      info: {
        bg: isRead ? 'bg-blue-50/50' : 'bg-blue-50',
        border: isRead ? 'border-blue-200/50' : 'border-blue-200',
        dot: 'bg-blue-500',
        icon: Info
      },
      warning: {
        bg: isRead ? 'bg-amber-50/50' : 'bg-amber-50',
        border: isRead ? 'border-amber-200/50' : 'border-amber-200',
        dot: 'bg-amber-500',
        icon: AlertCircle
      }
    };
    return baseStyles[type as keyof typeof baseStyles] || baseStyles.info;
  };

  const handleNavigate = (page: Page, accountTab?: 'profile' | 'usage' | 'billing' | 'integrations' | 'compliance') => {
    if (accountTab && onAccountTabChange) {
      onAccountTabChange(accountTab);
    }
    // When navigating via nav menu, always reset to first tab (clear last-tab memory)
    if (page === 'search-listings') {
      sessionStorage.removeItem('listingbug_last_tab');
      sessionStorage.removeItem('listingbug_open_tab');
      sessionStorage.removeItem('listingbug_open_saved_tab');
    }
    if (page === 'automations') {
      sessionStorage.removeItem('listingbug_automations_last_tab');
    }
    if (page === 'account') {
      sessionStorage.removeItem('account_last_tab');
    }
    onNavigate(page);
    setIsMenuOpen(false);
    setIsAccountMenuOpen(false);
    setShowNotifications(false);
  };

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setIsAccountMenuOpen(true);
    markAllAsRead();
  };

  const handleBackToAccount = () => {
    setShowNotifications(false);
  };
  
  // Expose openNotifications globally for Dashboard and other components
  useEffect(() => {
    (window as any).openNotifications = () => {
      setShowNotifications(true);
      setIsAccountMenuOpen(true);
      markAllAsRead();
    };
    return () => {
      delete (window as any).openNotifications;
    };
  }, [notifications]);

  const handleCloseAccountMenu = () => {
    setIsAccountMenuOpen(false);
    setShowNotifications(false);
  };

  // Close nav menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const clickedElement = event.target as Node;

      if (isMenuOpen && menuRef.current && !menuRef.current.contains(clickedElement)) {
        setIsMenuOpen(false);
      }

      if (isAccountMenuOpen && accountMenuRef.current && !accountMenuRef.current.contains(clickedElement)) {
        setIsAccountMenuOpen(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen, isAccountMenuOpen]);

  // Lock page scroll when either nav menu is open
  useEffect(() => {
    if (isMenuOpen || isAccountMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen, isAccountMenuOpen]);

  // Keyboard navigation: Close menus on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMenuOpen) setIsMenuOpen(false);
        if (isAccountMenuOpen) setIsAccountMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen, isAccountMenuOpen]);

  // Expose method to open notifications programmatically
  useEffect(() => {
    if (onOpenNotifications) {
      // Store the function to open notifications globally
      (window as any).openNotifications = () => {
        setIsAccountMenuOpen(true);
        setShowNotifications(true);
      };
    }
    return () => {
      delete (window as any).openNotifications;
    };
  }, [onOpenNotifications]);

  return (
    <>
      {/* Header Container */}
      <header className="border-b-2 border-gray-200 dark:border-white/10 bg-[#FFCE0A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-[16px]">
          <div className="flex items-center justify-between h-20">
            {/* Left side */}
            <div className="flex items-center gap-4">
              {/* Hamburger Menu Button - Mobile Only */}
              <button
                onClick={() => {
                  setIsMenuOpen(true);
                  setIsAccountMenuOpen(false);
                }}
                className="md:hidden w-12 h-12 flex items-center justify-center transition-colors group font-bold"
                aria-label="Open navigation menu"
                aria-expanded={isMenuOpen}
              >
                <Menu className="w-6 h-6 text-[#342e37]" strokeWidth={2.5} />
              </button>

              <button
                onClick={() => handleNavigate(isLoggedIn ? 'dashboard' : 'home')}
                className="flex items-center group md:relative absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0"
                aria-label={isLoggedIn ? "ListingBug dashboard" : "ListingBug home"}
              >
                {isLoggedIn ? (
                  <div className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:bg-white">
                    <ImageWithFallback 
                      src={headerLogoSimplified} 
                      alt="ListingBug" 
                      className="h-12 w-12 object-contain relative z-12"
                    />
                  </div>
                ) : (
                  <ImageWithFallback 
                    src={headerLogoFull} 
                    alt="ListingBug" 
                    className="h-22 w-auto object-contain"
                  />
                )}
              </button>
            </div>

            {/* Center - Desktop Navigation */}
            {!isLoggedIn ? (
              <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
                {/* TEMPORARILY REMOVED - Holding for potential re-addition
                <button
                  onClick={() => handleNavigate('how-it-works')}
                  className={`font-bold text-[17px] relative pb-1 transition-all text-[#342e37] hover:text-white whitespace-nowrap group`}
                >
                  How It Works
                  {currentPage === 'how-it-works' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37] rounded-full" />
                  )}
                  {currentPage !== 'how-it-works' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <span className="text-[#342e37]/30 font-normal">|</span>
                */}
                <button
                  onClick={() => handleNavigate('data-sets')}
                  className={`font-bold text-[17px] relative pb-1 transition-all text-[#342e37] hover:text-white whitespace-nowrap group`}
                >
                  Listing Data
                  {currentPage === 'data-sets' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37] rounded-full" />
                  )}
                  {currentPage !== 'data-sets' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <span className="text-[#342e37] font-normal">|</span>
                <button
                  onClick={() => handleNavigate('integrations')}
                  className={`font-bold text-[17px] relative pb-1 transition-all text-[#342e37] hover:text-white whitespace-nowrap group`}
                >
                  Integrations
                  {currentPage === 'integrations' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37] rounded-full" />
                  )}
                  {currentPage !== 'integrations' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <span className="text-[#342e37] font-normal">|</span>
                <button
                  onClick={() => handleNavigate('use-cases')}
                  className={`font-bold text-[18px] relative pb-1 transition-all text-[#342e37] hover:text-white whitespace-nowrap group`}
                >
                  Use Cases
                  {currentPage === 'use-cases' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37] rounded-full" />
                  )}
                  {currentPage !== 'use-cases' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <span className="text-[#342e37] font-normal">|</span>
                <button
                  onClick={() => handleNavigate('pricing')}
                  className={`font-bold text-[17px] relative pb-1 transition-all text-[#342e37] hover:text-white whitespace-nowrap group`}
                >
                  Pricing
                  {currentPage === 'pricing' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37] rounded-full" />
                  )}
                  {currentPage !== 'pricing' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              </nav>
            ) : (
              <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
                {/* Dashboard */}
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className={`font-bold text-[17px] relative pb-1 transition-all text-[#342e37] hover:text-white whitespace-nowrap group`}
                >
                  Dashboard
                  {currentPage === 'dashboard' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37] rounded-full" />
                  )}
                  {currentPage !== 'dashboard' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <span className="text-[#342e37] font-normal">|</span>

                {/* Listings */}
                <button
                  onClick={() => handleNavigate('search-listings')}
                  className={`font-bold text-[17px] relative pb-1 transition-all text-[#342e37] hover:text-white whitespace-nowrap group`}
                  data-walkthrough="listings-button"
                >
                  Listings
                  {(currentPage === 'search-listings' || currentPage === 'saved-searches' || currentPage === 'saved-listings' || currentPage === 'listing-history') && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37] rounded-full" />
                  )}
                  {!(currentPage === 'search-listings' || currentPage === 'saved-searches' || currentPage === 'saved-listings' || currentPage === 'listing-history') && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <span className="text-[#342e37] font-normal">|</span>

                {/* Agents */}
                <button
                  onClick={() => handleNavigate('agents')}
                  className={`font-bold text-[17px] relative pb-1 transition-all text-[#342e37] hover:text-white whitespace-nowrap group`}
                >
                  Agents
                  {currentPage === 'agents' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37] rounded-full" />
                  )}
                  {currentPage !== 'agents' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <span className="text-[#342e37] font-normal">|</span>

                {/* Automations */}
                <button
                  onClick={() => handleNavigate('automations')}
                  className={`font-bold text-[17px] relative pb-1 transition-all text-[#342e37] hover:text-white whitespace-nowrap group`}
                >
                  Automations
                  {(currentPage === 'automations' || currentPage === 'create-automation' || currentPage === 'my-automations' || currentPage === 'automation-history') && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37] rounded-full" />
                  )}
                  {!(currentPage === 'automations' || currentPage === 'create-automation' || currentPage === 'my-automations' || currentPage === 'automation-history') && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <span className="text-[#342e37] font-normal">|</span>

                {/* Integrations */}
                <button
                  onClick={() => handleNavigate('integrations')}
                  className={`font-bold text-[17px] relative pb-1 transition-all text-[#342e37] hover:text-white whitespace-nowrap group`}
                >
                  Integrations
                  {currentPage === 'integrations' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37] rounded-full" />
                  )}
                  {currentPage !== 'integrations' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#342e37]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              </nav>
            )}

            {/* Right side - User Avatar */}
            <button
              onClick={() => {
                if (isLoggedIn) {
                  setIsAccountMenuOpen(true);
                  setIsMenuOpen(false);
                } else {
                  handleNavigate('signup');
                }
              }}
              className="w-10 h-10 rounded-full bg-[#342e37] hover:bg-white flex items-center justify-center transition-all group border border-[#342e37]/20"
              aria-label={isLoggedIn ? "Open account menu" : "Sign up for an account"}
              aria-expanded={isLoggedIn ? isAccountMenuOpen : undefined}
            >
              <User className="w-6 h-6 text-white group-hover:text-[#342e37] transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      {isMenuOpen && (
        <>
          {/* Sidebar */}
          <div ref={menuRef} className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#252525] z-50 shadow-xl md:hidden transform transition-transform duration-300 ease-out">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleNavigate('home')}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <ImageWithFallback
                  src={isDarkMode ? headerLogoWhite : headerLogoFull}
                  alt="ListingBug"
                  className={isDarkMode ? "h-6 w-auto object-contain" : "h-12 w-auto object-contain"}
                />
              </button>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-[#342e37] dark:text-white" />
              </button>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex flex-col p-4">
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => handleNavigate('data-sets')}
                    className={`text-left py-3 px-4 rounded-lg font-bold transition-colors ${
                      currentPage === 'data-sets'
                        ? 'bg-[#342e37]/10 text-[#342e37] dark:bg-white/10 dark:text-white'
                        : 'text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Listing Data
                  </button>
                  <button
                    onClick={() => handleNavigate('integrations')}
                    className={`text-left py-3 px-4 rounded-lg font-bold transition-colors ${
                      currentPage === 'integrations'
                        ? 'bg-[#342e37]/10 text-[#342e37] dark:bg-white/10 dark:text-white'
                        : 'text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Integrations
                  </button>
                  <button
                    onClick={() => handleNavigate('use-cases')}
                    className={`text-left py-3 px-4 rounded-lg font-bold transition-colors ${
                      currentPage === 'use-cases'
                        ? 'bg-[#342e37]/10 text-[#342e37] dark:bg-white/10 dark:text-white'
                        : 'text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Use Cases
                  </button>
                  <button
                    onClick={() => handleNavigate('pricing')}
                    className={`text-left py-3 px-4 rounded-lg font-bold transition-colors ${
                      currentPage === 'pricing'
                        ? 'bg-[#342e37]/10 text-[#342e37] dark:bg-white/10 dark:text-white'
                        : 'text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Pricing
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

                  <button
                    onClick={() => handleNavigate('login')}
                    className="text-left py-3 px-4 rounded-lg font-bold text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Login / Sign Up
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigate('dashboard')}
                    className={`text-left py-3 px-4 rounded-lg font-bold transition-colors ${currentPage === 'dashboard' ? 'bg-[#342e37]/10 text-[#342e37] dark:bg-white/10 dark:text-white' : 'text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigate('search-listings')}
                    className={`text-left py-3 px-4 rounded-lg font-bold transition-colors ${currentPage === 'search-listings' ? 'bg-[#342e37]/10 text-[#342e37] dark:bg-white/10 dark:text-white' : 'text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    Listings
                  </button>
                  <button
                    onClick={() => handleNavigate('agents')}
                    className={`text-left py-3 px-4 rounded-lg font-bold transition-colors ${currentPage === 'agents' ? 'bg-[#342e37]/10 text-[#342e37] dark:bg-white/10 dark:text-white' : 'text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    Agents
                  </button>
                  <button
                    onClick={() => handleNavigate('automations')}
                    className={`text-left py-3 px-4 rounded-lg font-bold transition-colors ${currentPage === 'automations' ? 'bg-[#342e37]/10 text-[#342e37] dark:bg-white/10 dark:text-white' : 'text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    Automations
                  </button>
                  <button
                    onClick={() => handleNavigate('integrations')}
                    className={`text-left py-3 px-4 rounded-lg font-bold transition-colors ${currentPage === 'integrations' ? 'bg-[#342e37]/10 text-[#342e37] dark:bg-white/10 dark:text-white' : 'text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    Integrations
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

                  <button
                    onClick={() => handleNavigate('account')}
                    className={`text-left py-3 px-4 rounded-lg font-bold transition-colors ${currentPage === 'account' ? 'bg-[#342e37]/10 text-[#342e37] dark:bg-white/10 dark:text-white' : 'text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    Account
                  </button>
                </>
              )}
            </nav>
          </div>
        </>
      )}

      {/* Account Menu - Right Side */}
      {isAccountMenuOpen && isLoggedIn && (
        <>
          {/* Account Sidebar */}
          <div ref={accountMenuRef} className="fixed top-0 right-0 h-full w-[85vw] max-w-[256px] bg-white dark:bg-[#252525] z-50 shadow-xl transform transition-transform duration-300 ease-out overflow-y-auto">
            {!showNotifications ? (
              <>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#342e37] flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate dark:text-white">My Account</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseAccountMenu}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors flex-shrink-0"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5 text-[#342e37] dark:text-white" />
                  </button>
                </div>

                {/* Account Navigation */}
                <nav className="flex flex-col p-4">
                  {/* Notifications Button - Top */}
                  <button
                    onClick={handleOpenNotifications}
                    className="text-left py-3 px-4 rounded-lg font-bold text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 mb-2"
                  >
                    <Bell className="w-4 h-4" />
                    Notifications
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                  <button
                    onClick={() => handleNavigate('account', 'profile')}
                    className="text-left py-3 px-4 rounded-lg font-bold text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => handleNavigate('account', 'usage')}
                    className="text-left py-3 px-4 rounded-lg font-bold text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Usage
                  </button>
                  <button
                    onClick={() => handleNavigate('account', 'billing')}
                    className="text-left py-3 px-4 rounded-lg font-bold text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Billing
                  </button>
                  <button
                    onClick={() => handleNavigate('account', 'integrations')}
                    className="text-left py-3 px-4 rounded-lg font-bold text-[#342e37] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    API
                  </button>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                  {/* Dark Mode Toggle */}
                  {onToggleDarkMode && (
                    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-2">
                        {isDarkMode ? (
                          <Moon className="w-4 h-4 text-[#342e37] dark:text-white" />
                        ) : (
                          <Sun className="w-4 h-4 text-[#342e37] dark:text-white" />
                        )}
                        <span className="font-bold text-sm text-[#342e37] dark:text-white">
                          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </span>
                      </div>
                      <button
                        onClick={onToggleDarkMode}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                          isDarkMode ? 'bg-[#342e37]' : 'bg-gray-300'
                        }`}
                        aria-label="Toggle dark mode"
                        role="switch"
                        aria-checked={isDarkMode}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                            isDarkMode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                  
                  <button
                    onClick={() => onSignOut && onSignOut()}
                    className="text-left py-3 px-4 rounded-lg font-bold text-[#342e37] dark:text-white hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Sign Out
                  </button>
                </nav>
              </>
            ) : (
              <>
                {/* Notifications View */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                  <button
                    onClick={handleBackToAccount}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
                    aria-label="Back to account menu"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#FFCE0A]" />
                  </button>
                  <div className="flex items-center gap-2 flex-1">
                    <Bell className="w-5 h-5 text-[#FFCE0A]" />
                    <p className="font-bold text-sm">Notifications</p>
                  </div>
                  <button
                    onClick={handleCloseAccountMenu}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5 text-[#FFCE0A]" />
                  </button>
                </div>

                {/* Notifications List */}
                <div className="flex flex-col p-4 gap-3">
                  {/* Clear All Button */}
                  {notifications.length > 0 && notifications.some(n => n.read) && (
                    <button
                      onClick={clearAllRead}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-bold text-[#342e37]"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Read
                    </button>
                  )}

                {/* Notifications */}
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-bold text-gray-600">No notifications yet</p>
                    <p className="text-sm text-gray-500 mt-1">You'll get notifications when your searches and automations run</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const style = getNotificationStyle(notif.type, notif.read);
                    const Icon = style.icon;
                    
                    return (
                      <div 
                        key={notif.id} 
                        className={`relative p-3 border rounded-lg transition-all ${style.bg} ${style.border} ${notif.read ? 'opacity-70' : ''}`}
                      >
                        <div className="flex items-start gap-2 mb-1">
                          {!notif.read && (
                            <div className={`w-2 h-2 rounded-full ${style.dot} mt-1.5 flex-shrink-0`} />
                          )}
                          {notif.read && (
                            <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm ${notif.read ? 'text-gray-600' : 'text-[#342e37]'}`}>
                              {notif.title}
                            </p>
                            {notif.message && (
                              <p className={`text-xs mt-1 ${notif.read ? 'text-gray-500' : 'text-gray-600'}`}>
                                {notif.message}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Icon className={`w-3 h-3 ${notif.read ? 'text-gray-400' : 'text-gray-500'}`} />
                              <p className={`text-xs ${notif.read ? 'text-gray-400' : 'text-gray-500'}`}>
                                {formatTimestamp(notif.created_at)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notif.id);
                            }}
                            className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                            aria-label="Dismiss notification"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
