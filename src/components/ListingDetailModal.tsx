import { X, MapPin, Home, TrendingUp, TrendingDown, Phone, Mail, Building2, FileText, DollarSign, Save, ChevronLeft, Shield, AlertTriangle, CheckCircle2, Clock, Activity, BarChart3, User, Globe, History, HardHat, Target } from 'lucide-react';
import { LBButton } from './design-system/LBButton';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom'
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBx4RH4XvtQWTRfIw4EW-g1VzwEAihe628';

interface ListingDetailModalProps {
  listing: any;
  onClose: () => void;
  onSaveListing?: (listing: any) => void;
  isSaved?: boolean;
}

// Property record and valuation views are hidden pending future implementation.
// ViewMode type kept for forward-compatibility but only 'listing' is reachable.
type ViewMode = 'listing' | 'property-record' | 'valuation';

export function ListingDetailModal({ listing, onClose, onSaveListing, isSaved = false }: ListingDetailModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('listing');
  const [saved, setSaved] = useState(isSaved);

  // Swipe-to-close drag state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // isExiting: purely visual — drives the slide-out animation.
  const [isExiting, setIsExiting] = useState(false);
  const scrollYRef = useRef(0);
  const scrollLockActiveRef = useRef(false);

  // Save state
  useEffect(() => {
    const checkSaved = async () => {
      if (!listing?.id) return;
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setSaved(false); return; }
        const { data } = await supabase
          .from('saved_listings')
          .select('listing_id')
          .eq('user_id', user.id)
          .eq('listing_id', listing.id)
          .single();
        setSaved(!!data);
      } catch {
        setSaved(false);
      }
    };
    checkSaved();
    const handler = () => { checkSaved(); };
    window.addEventListener('savedListingsUpdated', handler);
    return () => window.removeEventListener('savedListingsUpdated', handler);
  }, [listing?.id]);

  useEffect(() => { setSaved(isSaved); }, [isSaved]);

  // Scroll lock
  const releaseScrollLock = useCallback(() => {
    if (!scrollLockActiveRef.current) return;
    scrollLockActiveRef.current = false;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo(0, scrollYRef.current);
  }, []);

  useEffect(() => {
    scrollYRef.current = window.scrollY;
    scrollLockActiveRef.current = true;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.width = '100%';
    document.body.style.left = '0';
    document.body.style.right = '0';
    return () => releaseScrollLock();
  }, [releaseScrollLock]);

  const animateClose = useCallback(() => {
    if (isExiting) return;
    releaseScrollLock();
    setIsExiting(true);
    onClose();
  }, [isExiting, onClose, releaseScrollLock]);

  const handleSwipeDrag = useCallback((deltaX: number) => {
    setIsDragging(true);
    setDragX(Math.max(0, deltaX));
  }, []);

  const handleSwipeRight = useCallback(() => {
    setIsDragging(false);
    animateClose();
  }, [animateClose]);

  const handleSwipeCancel = useCallback(() => {
    setIsDragging(false);
    setDragX(0);
  }, []);

  useSwipeGesture({
    onSwipeRight: handleSwipeRight,
    onSwipeDrag: handleSwipeDrag,
    onSwipeCancel: handleSwipeCancel,
    threshold: 80,
    velocityThreshold: 0.4,
  });

  // ESC key — property-record/valuation views are not reachable but guard anyway
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewMode !== 'listing') setViewMode('listing');
        else animateClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [animateClose, viewMode]);

  if (!listing) return null;

  const hasBuilderInfo = !!(listing.builderName || listing.builderPhone || listing.builderEmail || listing.builderWebsite || listing.builderDevelopmentName);

  const panelTransform = isExiting
    ? 'translateX(100%)'
    : dragX > 0
    ? `translateX(${dragX}px)`
    : 'translateX(0)';

  const panelTransition = isDragging ? 'none' : 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)';

  const backdropOpacity = isExiting ? 0 : Math.max(0, 0.5 - (dragX / window.innerWidth) * 0.5);
  const backdropTransition = isDragging ? 'none' : 'opacity 300ms ease';

  const lat = listing.latitude;
  const lng = listing.longitude;
  const hasLatLng =
    lat != null && lng != null &&
    typeof lat === 'number' && typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) &&
    lat !== 0 && lng !== 0;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black z-[9998]"
        style={{ opacity: backdropOpacity, transition: backdropTransition }}
        onClick={() => viewMode === 'listing' ? animateClose() : setViewMode('listing')}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="fixed right-0 top-0 h-screen w-[calc(100%-12px)] md:w-[650px] lg:w-[800px] bg-white dark:bg-[#0F1115] z-[9999] shadow-2xl overflow-hidden"
        style={{ transform: panelTransform, transition: panelTransition }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 bg-[#ffd447] border-b border-[#ffd447]/20 px-3 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {viewMode !== 'listing' && (
                <button onClick={() => setViewMode('listing')} className="p-2 hover:bg-[#342e37]/10 rounded-lg transition-colors flex-shrink-0" aria-label="Back to listing">
                  <ChevronLeft className="w-5 h-5 text-[#342e37]" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-[21px] font-bold text-[#342e37] mb-1 truncate">
                  {listing.address || listing.formattedAddress || `${listing.city ?? ''}, ${listing.state ?? ''} ${listing.zip ?? ''}`.trim()}
                </h2>
                <p className="text-[14px] text-[#342e37]/80 truncate">
                  {[listing.city, listing.state, listing.zip].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {onSaveListing && (
                <button
                  onClick={() => onSaveListing(listing)}
                  className={`p-2 rounded-lg transition-colors ${saved ? 'bg-[#342e37] text-[#FFD447] hover:bg-[#342e37]/90' : 'hover:bg-[#342e37]/10'}`}
                  aria-label={saved ? 'Unsave listing' : 'Save listing'}
                >
                  <Save className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                </button>
              )}
              <button onClick={animateClose} className="p-2 hover:bg-[#342e37]/10 rounded-lg transition-colors" aria-label="Close">
                <X className="w-5 h-5 text-[#342e37]" />
              </button>
            </div>
          </div>

          {/* Scrollable Content — listing view only */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 md:px-6 py-6 space-y-6">
              {/* PHOTO / STREET VIEW */}
              {(() => {
                const hasPhoto = listing.photos && listing.photos.length > 0 && listing.photos[0];
                if (hasPhoto) {
                  return (
                    <div className="rounded-lg overflow-hidden">
                      <img src={listing.photos[0]} alt={listing.address} className="w-full h-64 object-cover"
                        onError={(e) => {
                          const t = e.currentTarget;
                          if (hasLatLng) {
                            t.src = `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${lat},${lng}&key=${GMAPS_KEY}`;
                            t.onerror = () => { const p = t.parentElement!; t.remove(); p.innerHTML = `<div class="flex flex-col items-center justify-center h-64 gap-2 bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="text-xs text-gray-400">No photo available</span></div>`; };
                          } else { const p = t.parentElement!; t.remove(); p.innerHTML = `<div class="flex flex-col items-center justify-center h-64 gap-2 bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="text-xs text-gray-400">No photo available</span></div>`; }
                        }} />
                    </div>
                  );
                }
                if (hasLatLng) {
                  return (
                    <div className="rounded-lg overflow-hidden">
                      <div className="relative w-full h-64 bg-gray-100 dark:bg-white/5 overflow-hidden">
                        <img src={`https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${lat},${lng}&fov=90&pitch=10&key=${GMAPS_KEY}`} alt={`Street view of ${listing.address}`} className="w-full h-64 object-cover"
                          onError={(e) => { const p = e.currentTarget.parentElement!; e.currentTarget.remove(); p.innerHTML = `<div class="flex flex-col items-center justify-center h-64 gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="text-xs text-gray-400">No photo available</span></div>`; }}
                        />
                        <span className="absolute bottom-2 right-2 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">Street View</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="rounded-lg overflow-hidden w-full h-48 bg-gray-100 dark:bg-white/5 flex flex-col items-center justify-center gap-2">
                    <Home className="w-10 h-10 text-gray-300 dark:text-white/20" />
                    <span className="text-[12px] text-gray-400 dark:text-white/30">No photo available</span>
                  </div>
                );
              })()}

              {/* AGENT & BROKERAGE */}
              <div className="bg-[#342e37] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1"><User className="w-4 h-4 text-[#FFCE0A]" /><h3 className="font-bold text-[16px] text-white">Listing Agent</h3></div>
                {listing.agentName ? <p className="text-white font-semibold text-[15px]">{listing.agentName}</p> : <p className="text-white/50 italic text-[13px]">Agent name not provided</p>}
                <div className="flex flex-wrap gap-2">
                  {listing.agentPhone ? (<a href={`tel:${listing.agentPhone}`} className="flex items-center gap-1.5 bg-[#FFCE0A] text-[#342e37] font-bold px-3 py-1.5 rounded-lg text-[13px] hover:bg-[#FFCE0A]/90 transition-colors"><Phone className="w-3.5 h-3.5" />{listing.agentPhone}</a>) : <span className="text-white/40 text-[12px] italic">No phone</span>}
                  {listing.agentEmail ? (<a href={`mailto:${listing.agentEmail}`} className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-1.5 rounded-lg text-[13px] hover:bg-white/20 transition-colors"><Mail className="w-3.5 h-3.5" />{listing.agentEmail}</a>) : <span className="text-white/40 text-[12px] italic">No email</span>}
                  {listing.agentWebsite && (<a href={listing.agentWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-1.5 rounded-lg text-[13px] hover:bg-white/20 transition-colors"><Globe className="w-3.5 h-3.5" />Agent Website</a>)}
                </div>
                {(listing.brokerage || listing.officeName) && (
                  <div className="border-t border-white/10 pt-3 space-y-1">
                    <p className="text-white/60 text-[11px] uppercase tracking-wide">Brokerage</p>
                    <p className="text-white font-medium text-[14px]">{listing.brokerage || listing.officeName}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {listing.officePhone && (<a href={`tel:${listing.officePhone}`} className="flex items-center gap-1 text-white/70 text-[12px] hover:text-white"><Phone className="w-3 h-3" />{listing.officePhone}</a>)}
                      {listing.officeEmail && (<a href={`mailto:${listing.officeEmail}`} className="flex items-center gap-1 text-white/70 text-[12px] hover:text-white"><Mail className="w-3 h-3" />{listing.officeEmail}</a>)}
                      {listing.officeWebsite && (<a href={listing.officeWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-white/70 text-[12px] hover:text-white"><Globe className="w-3 h-3" />Office Website</a>)}
                    </div>
                  </div>
                )}
              </div>

              {/* BUILDER */}
              {hasBuilderInfo && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1"><HardHat className="w-4 h-4 text-amber-700 dark:text-amber-400" /><h3 className="font-bold text-[16px] text-amber-900 dark:text-amber-300">Builder & Development</h3></div>
                  {listing.builderDevelopmentName && <p className="text-amber-800 dark:text-amber-200 font-semibold text-[15px]">{listing.builderDevelopmentName}</p>}
                  {listing.builderName && <p className="text-amber-700 dark:text-amber-300 text-[14px]">{listing.builderName}</p>}
                  <div className="flex flex-wrap gap-2">
                    {listing.builderPhone && (<a href={`tel:${listing.builderPhone}`} className="flex items-center gap-1.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold px-3 py-1.5 rounded-lg text-[13px] hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"><Phone className="w-3.5 h-3.5" />{listing.builderPhone}</a>)}
                    {listing.builderEmail && (<a href={`mailto:${listing.builderEmail}`} className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-1.5 rounded-lg text-[13px] hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors"><Mail className="w-3.5 h-3.5" />{listing.builderEmail}</a>)}
                    {listing.builderWebsite && (<a href={listing.builderWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-1.5 rounded-lg text-[13px] hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors"><Globe className="w-3.5 h-3.5" />Builder Website</a>)}
                  </div>
                </div>
              )}

              {/* PRICE & LISTING */}
              <div>
                <div className="flex items-center gap-2 mb-3"><DollarSign className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" /><h3 className="font-bold text-[18px] dark:text-white">Price & Listing</h3></div>
                <div className="grid grid-cols-2 gap-3 text-[14px]">
                  <div><p className="text-gray-500 mb-0.5">List Price</p><p className="font-bold text-[20px] text-[#342e37] dark:text-white">{listing.price != null ? `$${listing.price.toLocaleString()}` : '—'}</p></div>
                  <div><p className="text-gray-500 mb-0.5">Price / Sq Ft</p><p className="font-bold text-[18px] dark:text-white">{listing.sqft > 0 && listing.price != null ? `$${Math.round(listing.price / listing.sqft).toLocaleString()}` : '--'}</p></div>
                  <div><p className="text-gray-500 mb-0.5">Status</p><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${listing.status === 'Active' ? 'bg-green-100 text-green-800' : listing.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>{listing.status || '—'}</span></div>
                  <div><p className="text-gray-500 mb-0.5">Days on Market</p><p className={`font-semibold ${listing.daysListed > 30 ? 'text-orange-600' : listing.daysListed > 14 ? 'text-amber-600' : 'dark:text-white'}`}>{listing.daysListed ?? '--'}d</p></div>
                  <div><p className="text-gray-500 mb-0.5">Listed Date</p><p className="font-medium dark:text-white">{listing.listedDate ? new Date(listing.listedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'}</p></div>
                  <div><p className="text-gray-500 mb-0.5">Last Seen</p><p className="font-medium dark:text-white">{listing.lastSeenDate ? new Date(listing.lastSeenDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'}</p></div>
                  <div><p className="text-gray-500 mb-0.5">Listing Type</p><p className="font-medium dark:text-white">{listing.listingType || listing.listingTypeDetail || '--'}</p></div>
                  <div><p className="text-gray-500 mb-0.5">MLS Number</p><p className="font-medium font-mono text-[13px] dark:text-white">{listing.mlsNumber || '--'}</p></div>
                  <div><p className="text-gray-500 mb-0.5">MLS Name</p><p className="font-medium text-[13px] dark:text-white">{listing.mlsName || '--'}</p></div>
                  {listing.removedDate && (<div><p className="text-gray-500 mb-0.5">Removed Date</p><p className="font-medium dark:text-white">{new Date(listing.removedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div>)}
                  {listing.priceDrop && (<div className="col-span-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><TrendingDown className="w-4 h-4 text-red-600 flex-shrink-0" /><span className="text-red-700 text-[13px] font-medium">Price Reduced</span></div>)}
                  {listing.reList && (<div className="col-span-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"><TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0" /><span className="text-blue-700 text-[13px] font-medium">Re-listed Property</span></div>)}
                  {listing.virtualTourUrl && (<div className="col-span-2"><a href={listing.virtualTourUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[13px] text-[#342e37] dark:text-[#FFCE0A] font-medium hover:underline"><Globe className="w-4 h-4" />Virtual Tour Available</a></div>)}
                </div>
              </div>

              {/* PROPERTY DETAILS */}
              <div>
                <div className="flex items-center gap-2 mb-3"><Home className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" /><h3 className="font-bold text-[18px] dark:text-white">Property Details</h3></div>
                <div className="grid grid-cols-2 gap-3 text-[14px]">
                  <div><p className="text-gray-500 mb-0.5">Property Type</p><p className="font-medium dark:text-white">{listing.propertyType || '--'}</p></div>
                  <div><p className="text-gray-500 mb-0.5">Year Built</p><p className="font-medium dark:text-white">{listing.yearBuilt || '--'}</p></div>
                  <div><p className="text-gray-500 mb-0.5">Bedrooms</p><p className="font-semibold text-[16px] dark:text-white">{listing.bedrooms ?? '--'}</p></div>
                  <div><p className="text-gray-500 mb-0.5">Bathrooms</p><p className="font-semibold text-[16px] dark:text-white">{listing.bathrooms ?? '--'}</p></div>
                  <div><p className="text-gray-500 mb-0.5">Living Area</p><p className="font-medium dark:text-white">{listing.sqft > 0 ? `${listing.sqft.toLocaleString()} sq ft` : '--'}</p></div>
                  <div><p className="text-gray-500 mb-0.5">Lot Size</p><p className="font-medium dark:text-white">{listing.lotSize > 0 ? `${listing.lotSize.toLocaleString()} sq ft` : '--'}</p></div>
                  {listing.stories != null && <div><p className="text-gray-500 mb-0.5">Stories</p><p className="font-medium dark:text-white">{listing.stories}</p></div>}
                  {listing.garage != null && (<div><p className="text-gray-500 mb-0.5">Garage</p><p className="font-medium dark:text-white">{listing.garage ? `Yes${listing.garageSpaces ? ` (${listing.garageSpaces} spaces)` : ''}` : 'No'}</p></div>)}
                  {listing.pool != null && <div><p className="text-gray-500 mb-0.5">Pool</p><p className="font-medium dark:text-white">{listing.pool ? 'Yes' : 'No'}</p></div>}
                  {listing.hoaFee != null && (<div><p className="text-gray-500 mb-0.5">HOA Fee</p><p className="font-medium dark:text-white">${listing.hoaFee?.toLocaleString()}/mo</p></div>)}
                </div>
              </div>

              {/* LOCATION */}
              <div>
                <div className="flex items-center gap-2 mb-3"><MapPin className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" /><h3 className="font-bold text-[18px] dark:text-white">Location</h3></div>
                <div className="grid grid-cols-2 gap-3 text-[14px]">
                  <div className="col-span-2"><p className="text-gray-500 mb-0.5">Full Address</p><p className="font-medium dark:text-white">{listing.formattedAddress || `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`}</p></div>
                  <div><p className="text-gray-500 mb-0.5">City</p><p className="font-medium dark:text-white">{listing.city}</p></div>
                  <div><p className="text-gray-500 mb-0.5">State</p><p className="font-medium dark:text-white">{listing.state}</p></div>
                  <div><p className="text-gray-500 mb-0.5">ZIP Code</p><p className="font-medium dark:text-white">{listing.zip}</p></div>
                  {listing.county && <div><p className="text-gray-500 mb-0.5">County</p><p className="font-medium dark:text-white">{listing.county}</p></div>}
                  {listing.stateFips && <div><p className="text-gray-500 mb-0.5">State FIPS</p><p className="font-mono text-[12px] dark:text-white">{listing.stateFips}</p></div>}
                  {listing.countyFips && <div><p className="text-gray-500 mb-0.5">County FIPS</p><p className="font-mono text-[12px] dark:text-white">{listing.countyFips}</p></div>}
                  {hasLatLng && (<><div><p className="text-gray-500 mb-0.5">Latitude</p><p className="font-mono text-[12px] dark:text-white">{lat}</p></div><div><p className="text-gray-500 mb-0.5">Longitude</p><p className="font-mono text-[12px] dark:text-white">{lng}</p></div></>)}
                </div>
                {hasLatLng && (<a href={`https://maps.google.com/?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-[#342e37] dark:text-[#FFCE0A] font-medium hover:underline"><MapPin className="w-3.5 h-3.5" />View on Google Maps</a>)}
              </div>

              {/* LISTING HISTORY */}
              {listing.history && Object.keys(listing.history).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3"><History className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" /><h3 className="font-bold text-[18px] dark:text-white">Listing History</h3></div>
                  <div className="space-y-2">
                    {Object.entries(listing.history).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime()).map(([date, event]: [string, any]) => (
                      <div key={date} className="flex items-start justify-between border border-gray-100 dark:border-white/10 rounded-lg px-3 py-2 text-[13px]">
                        <div><p className="font-medium dark:text-white">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p><p className="text-gray-500 text-[12px]">{event.event || '--'}{event.listingType ? ` - ${event.listingType}` : ''}</p></div>
                        <div className="text-right">{event.price && <p className="font-semibold dark:text-white">${Number(event.price).toLocaleString()}</p>}{event.daysOnMarket != null && <p className="text-gray-400 text-[11px]">{event.daysOnMarket}d on market</p>}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DESCRIPTION */}
              {listing.description && (
                <div>
                  <div className="flex items-center gap-2 mb-3"><FileText className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" /><h3 className="font-bold text-[18px] dark:text-white">Description</h3></div>
                  <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">{listing.description}</p>
                </div>
              )}

              {/* METADATA */}
              <div className="border-t border-gray-100 dark:border-white/10 pt-4">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Data Metadata</p>
                <div className="grid grid-cols-2 gap-2 text-[12px] text-gray-500">
                  {listing.createdDate && <div><span className="text-gray-400">First seen: </span>{new Date(listing.createdDate).toLocaleDateString()}</div>}
                  {listing.lastSeenDate && <div><span className="text-gray-400">Last seen: </span>{new Date(listing.lastSeenDate).toLocaleDateString()}</div>}
                  {listing.removedDate && <div><span className="text-gray-400">Removed: </span>{new Date(listing.removedDate).toLocaleDateString()}</div>}
                  {listing.photos?.length > 0 && <div><span className="text-gray-400">Photos: </span>{listing.photos.length}</div>}
                </div>
              </div>
              <div className="pt-2 pb-2" />
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
