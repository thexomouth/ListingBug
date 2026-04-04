import { X, MapPin, Home, TrendingUp, TrendingDown, Phone, Mail, Building2, FileText, DollarSign, Calendar, Ruler, Bed, Bath, Target, Sparkles, Save, ChevronLeft, Shield, AlertTriangle, CheckCircle2, Clock, Activity, BarChart3, User, Globe, Key, Hash, History, Tag, Layers, HardHat } from 'lucide-react';
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

type ViewMode = 'listing' | 'property-record' | 'valuation';

export function ListingDetailModal({ listing, onClose, onSaveListing, isSaved = false }: ListingDetailModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('listing');
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [saved, setSaved] = useState(isSaved);

  // Swipe-to-close drag state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // isExiting: purely visual — drives the slide-out animation.
  // Stays true for 300ms after onClose is called so the panel can animate out.
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

  // Scroll lock — applied on mount, released by releaseScrollLock()
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
    // Cleanup is a safety net — the lock should be released by animateClose first
    return () => releaseScrollLock();
  }, [releaseScrollLock]);

  // animateClose: release scroll lock and call onClose immediately so the parent
  // can update its state right away (enabling the next listing to be opened).
  // Then run the visual exit animation for 300ms — the portal keeps the panel
  // visible during that window even after the parent has set selectedListing=null,
  // because isExiting keeps the local component alive via its own render cycle.
  const animateClose = useCallback(() => {
    if (isExiting) return; // already closing
    releaseScrollLock();
    setIsExiting(true);
    onClose(); // call immediately — parent state updates now
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

  // ESC key
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

  const calculateOpportunityScore = () => {
    let score = 50;
    if (listing.daysListed > 14) score += 20;
    if (listing.priceDrop) score += 15;
    if (listing.reList) score += 10;
    if (listing.yearBuilt < 2000) score += 5;
    return Math.min(score, 100);
  };

  const generatePropertyRecord = () => {
    // Safe fallbacks so math never produces NaN or crashes on null fields
    const safePrice = listing.price ?? 300000;
    const safeYearBuilt = listing.yearBuilt ?? 2000;
    const safeCity = listing.city ?? 'UNKNOWN';
    const safePropertyType = listing.propertyType ?? '';

    const purchaseYear = safeYearBuilt + Math.floor(Math.random() * 10);
    const purchasePrice = Math.floor(safePrice * (0.6 + Math.random() * 0.2));
    const taxAssessment = Math.floor(safePrice * 0.85);
    const landValue = Math.floor(taxAssessment * 0.25);
    const improvementValue = taxAssessment - landValue;
    const annualTax = Math.floor(taxAssessment * 0.012);
    return {
      ownerName: 'John & Sarah Henderson',
      mailingAddress: '1425 Oak Street, Portland, OR 97204',
      purchaseDate: `${purchaseYear}-03-15`,
      purchasePrice,
      taxAssessment: { total: taxAssessment, land: landValue, improvements: improvementValue },
      annualTax,
      legalDescription: `LOT 12, BLOCK 5, ${safeCity.toUpperCase()} HEIGHTS SUBDIVISION, ACCORDING TO THE PLAT THEREOF RECORDED IN VOLUME 47 OF PLATS, PAGE 23`,
      parcelNumber: `${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      zoning: safePropertyType === 'Commercial' ? 'C-2 (General Commercial)' : safePropertyType === 'Multi-Family' ? 'R-3 (Multi-Family Residential)' : 'R-1 (Single Family Residential)',
      deedType: 'Warranty Deed',
      recordedDate: `${purchaseYear}-04-02`,
      liens: Math.random() > 0.7 ? [{ type: 'Mortgage Lien', amount: Math.floor(safePrice * 0.7), holder: 'First National Bank', recorded: `${purchaseYear}-04-02` }] : [],
      permits: [
        { type: 'Building Permit', description: 'Roof Replacement', date: '2021-06-15', status: 'Completed' },
        { type: 'Building Permit', description: 'HVAC Installation', date: '2019-03-22', status: 'Completed' },
      ],
      salesHistory: [
        { date: `${purchaseYear}-03-15`, price: purchasePrice, type: 'Sale' },
        { date: `${purchaseYear - 8}-07-20`, price: Math.floor(purchasePrice * 0.75), type: 'Sale' },
        { date: `${safeYearBuilt}-01-10`, price: Math.floor(purchasePrice * 0.45), type: 'New Construction' },
      ],
    };
  };

  const generateValuation = () => {
    // Safe fallbacks — sqft must be > 0 to avoid division by zero
    const safePrice = listing.price ?? 300000;
    const safeSqft = (listing.sqft && listing.sqft > 0) ? listing.sqft : 1500;
    const safeBeds = listing.bedrooms ?? 3;
    const safeBaths = listing.bathrooms ?? 2;

    const estimatedValue = Math.floor(safePrice * (0.95 + Math.random() * 0.1));
    const lowRange = Math.floor(estimatedValue * 0.92);
    const highRange = Math.floor(estimatedValue * 1.08);
    const pricePerSqFt = Math.floor(estimatedValue / safeSqft);
    const rentEstimate = Math.floor(estimatedValue * 0.008);
    const comps = [
      { address: '1456 Maple Ave', distance: '0.3 mi', price: Math.floor(estimatedValue * 0.98), beds: safeBeds, baths: safeBaths, sqft: safeSqft + Math.floor(Math.random() * 200 - 100), soldDate: '2024-11-15', daysOnMarket: 12 },
      { address: '892 Birch Street', distance: '0.5 mi', price: Math.floor(estimatedValue * 1.02), beds: safeBeds, baths: safeBaths, sqft: safeSqft + Math.floor(Math.random() * 200 - 100), soldDate: '2024-10-28', daysOnMarket: 8 },
      { address: '2134 Cedar Lane', distance: '0.7 mi', price: Math.floor(estimatedValue * 0.96), beds: safeBeds === 3 ? 4 : safeBeds, baths: safeBaths, sqft: safeSqft + Math.floor(Math.random() * 300 - 150), soldDate: '2024-10-05', daysOnMarket: 15 },
    ];
    return {
      estimatedValue, confidenceScore: 87,
      valueRange: { low: lowRange, high: highRange },
      pricePerSqFt, marketPricePerSqFt: Math.floor(pricePerSqFt * 1.03),
      appreciation: { oneYear: 6.2, threeYear: 18.5, fiveYear: 34.8 },
      rentalEstimate: { monthly: rentEstimate, low: Math.floor(rentEstimate * 0.9), high: Math.floor(rentEstimate * 1.1) },
      comparables: comps,
      marketConditions: { avgDaysOnMarket: 24, listToSaleRatio: 98.2, inventoryLevel: 'Low', marketTrend: 'Appreciating' },
      equity: estimatedValue - Math.floor(estimatedValue * 0.7),
      // store safePrice so JSX can reference it without re-accessing listing.price
      safePrice,
    };
  };

  const handleLoadReport = (type: 'property-record' | 'valuation') => {
    setIsLoadingReport(true);
    setTimeout(() => { setViewMode(type); setIsLoadingReport(false); }, 800);
  };

  const propertyRecord = generatePropertyRecord();
  const valuation = generateValuation();
  const hasBuilderInfo = !!(listing.builderName || listing.builderPhone || listing.builderEmail || listing.builderWebsite || listing.builderDevelopmentName);

  // Panel slides with finger during drag; slides off-screen when exiting; sits at 0 otherwise.
  const panelTransform = isExiting
    ? 'translateX(100%)'
    : dragX > 0
    ? `translateX(${dragX}px)`
    : 'translateX(0)';

  const panelTransition = isDragging ? 'none' : 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)';

  // Backdrop fades proportionally with drag progress and disappears on exit
  const backdropOpacity = isExiting ? 0 : Math.max(0, 0.5 - (dragX / window.innerWidth) * 0.5);
  const backdropTransition = isDragging ? 'none' : 'opacity 300ms ease';

  // Guard: only use lat/lng if they are real non-zero numbers.
  // null/undefined coords would produce ?location=null,null which Google returns
  // as a valid gray "no imagery" thumbnail — visually misleading.
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
                  {viewMode === 'property-record' && 'Property Record'}
                  {viewMode === 'valuation' && 'Property Valuation'}
                  {viewMode === 'listing' && (listing.address || listing.formattedAddress || `${listing.city ?? ''}, ${listing.state ?? ''} ${listing.zip ?? ''}`.trim())}
                </h2>
                <p className="text-[14px] text-[#342e37]/80 truncate">
                  {viewMode === 'listing' ? [listing.city, listing.state, listing.zip].filter(Boolean).join(', ') : (listing.address || listing.formattedAddress || '')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {viewMode === 'listing' && onSaveListing && (
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

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingReport ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-[#FFD447] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading report...</p>
                </div>
              </div>
            ) : viewMode === 'property-record' ? (
              <div className="px-3 md:px-6 py-6 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-blue-600" /><h3 className="font-bold text-[18px]">Property Record Report</h3></div>
                  <p className="text-sm text-gray-700">Comprehensive public record information for {listing.address}</p>
                  <p className="text-xs text-gray-600 mt-2">Generated: {new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-[#342e37]" /><h3 className="font-bold text-[18px]">Current Ownership</h3></div>
                  <div className="space-y-3 text-[14px]">
                    <div><p className="text-gray-600 mb-1">Owner Name</p><p className="font-medium">{propertyRecord.ownerName}</p></div>
                    <div><p className="text-gray-600 mb-1">Mailing Address</p><p className="font-medium">{propertyRecord.mailingAddress}</p></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-gray-600 mb-1">Purchase Date</p><p className="font-medium">{new Date(propertyRecord.purchaseDate).toLocaleDateString()}</p></div>
                      <div><p className="text-gray-600 mb-1">Purchase Price</p><p className="font-medium">${propertyRecord.purchasePrice.toLocaleString()}</p></div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3"><DollarSign className="w-5 h-5 text-[#342e37]" /><h3 className="font-bold text-[18px]">Tax Assessment</h3></div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div><p className="text-gray-600 mb-1">Total Assessment</p><p className="font-medium text-[16px]">${propertyRecord.taxAssessment.total.toLocaleString()}</p></div>
                    <div><p className="text-gray-600 mb-1">Annual Tax</p><p className="font-medium text-[16px]">${propertyRecord.annualTax.toLocaleString()}</p></div>
                    <div><p className="text-gray-600 mb-1">Land Value</p><p className="font-medium">${propertyRecord.taxAssessment.land.toLocaleString()}</p></div>
                    <div><p className="text-gray-600 mb-1">Improvement Value</p><p className="font-medium">${propertyRecord.taxAssessment.improvements.toLocaleString()}</p></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3"><FileText className="w-5 h-5 text-[#342e37]" /><h3 className="font-bold text-[18px]">Legal Information</h3></div>
                  <div className="space-y-3 text-[14px]">
                    <div><p className="text-gray-600 mb-1">Parcel Number (APN)</p><p className="font-medium font-mono">{propertyRecord.parcelNumber}</p></div>
                    <div><p className="text-gray-600 mb-1">Zoning</p><p className="font-medium">{propertyRecord.zoning}</p></div>
                    <div><p className="text-gray-600 mb-1">Legal Description</p><p className="font-medium text-xs leading-relaxed">{propertyRecord.legalDescription}</p></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3"><Building2 className="w-5 h-5 text-[#342e37]" /><h3 className="font-bold text-[18px]">Deed Information</h3></div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div><p className="text-gray-600 mb-1">Deed Type</p><p className="font-medium">{propertyRecord.deedType}</p></div>
                    <div><p className="text-gray-600 mb-1">Recorded Date</p><p className="font-medium">{new Date(propertyRecord.recordedDate).toLocaleDateString()}</p></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {propertyRecord.liens.length > 0 ? <AlertTriangle className="w-5 h-5 text-orange-600" /> : <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    <h3 className="font-bold text-[18px]">Liens & Encumbrances</h3>
                  </div>
                  {propertyRecord.liens.length > 0 ? (
                    <div className="space-y-3">
                      {propertyRecord.liens.map((lien, idx) => (
                        <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-[14px]">
                          <div className="flex items-center justify-between mb-2"><p className="font-bold">{lien.type}</p><p className="font-bold text-orange-700">${lien.amount.toLocaleString()}</p></div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                            <div><p className="text-gray-600">Holder</p><p className="font-medium">{lien.holder}</p></div>
                            <div><p className="text-gray-600">Recorded</p><p className="font-medium">{new Date(lien.recorded).toLocaleDateString()}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-[14px]">
                      <div className="flex items-center gap-2 text-green-700"><CheckCircle2 className="w-4 h-4" /><p>No active liens or encumbrances found</p></div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3"><FileText className="w-5 h-5 text-[#342e37]" /><h3 className="font-bold text-[18px]">Building Permits</h3></div>
                  <div className="space-y-2">
                    {propertyRecord.permits.map((permit, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3 text-[14px]">
                        <div className="flex items-center justify-between mb-1"><p className="font-bold">{permit.description}</p><span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">{permit.status}</span></div>
                        <div className="flex items-center gap-4 text-xs text-gray-600"><span>{permit.type}</span><span>&bull;</span><span>{new Date(permit.date).toLocaleDateString()}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3"><Clock className="w-5 h-5 text-[#342e37]" /><h3 className="font-bold text-[18px]">Sales History</h3></div>
                  <div className="space-y-2">
                    {propertyRecord.salesHistory.map((sale, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3 text-[14px]">
                        <div className="flex items-center justify-between">
                          <div><p className="font-bold">{new Date(sale.date).toLocaleDateString()}</p><p className="text-xs text-gray-600">{sale.type}</p></div>
                          <p className="font-bold text-[16px]">${sale.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 pb-2" />
              </div>
            ) : viewMode === 'valuation' ? (
              <div className="px-3 md:px-6 py-6 space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-green-600" /><h3 className="font-bold text-[18px]">Property Valuation Report</h3></div>
                  <p className="text-sm text-gray-700">Automated valuation model (AVM) for {listing.address}</p>
                  <p className="text-xs text-gray-600 mt-2">Generated: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="bg-gradient-to-br from-[#FFD447]/20 to-[#FFD447]/5 border-2 border-[#FFD447] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div><p className="text-sm text-gray-600 mb-1">Estimated Market Value</p><p className="font-bold text-[28px] text-[#342e37]">$ {valuation.estimatedValue.toLocaleString()}</p></div>
                    <div className="text-right"><p className="text-xs text-gray-600 mb-1">Confidence Score</p><div className="bg-green-100 text-green-800 px-3 py-1 rounded-full"><span className="font-bold">{valuation.confidenceScore}%</span></div></div>
                  </div>
                  <div className="pt-3 border-t border-[#FFD447]/30">
                    <p className="text-xs text-gray-600 mb-2">Value Range</p>
                    <div className="flex items-center justify-between text-sm"><span className="font-medium">${valuation.valueRange.low.toLocaleString()}</span><span className="text-gray-400">&ndash;</span><span className="font-medium">${valuation.valueRange.high.toLocaleString()}</span></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-5 h-5 text-[#342e37]" /><h3 className="font-bold text-[18px]">Price Analysis</h3></div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div><p className="text-gray-600 mb-1">Property Price/SF</p><p className="font-medium text-[16px]">${valuation.pricePerSqFt}/sf</p></div>
                    <div><p className="text-gray-600 mb-1">Market Avg Price/SF</p><p className="font-medium text-[16px]">${valuation.marketPricePerSqFt}/sf</p></div>
                    <div><p className="text-gray-600 mb-1">Current List Price</p><p className="font-medium">{valuation.safePrice > 0 ? `$${valuation.safePrice.toLocaleString()}` : '—'}</p></div>
                    <div><p className="text-gray-600 mb-1">Est. vs. List</p><p className={`font-medium ${valuation.estimatedValue > valuation.safePrice ? 'text-green-600' : 'text-red-600'}`}>{valuation.estimatedValue > valuation.safePrice ? '+' : ''}{(((valuation.estimatedValue - valuation.safePrice) / valuation.safePrice) * 100).toFixed(1)}%</p></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5 text-[#342e37]" /><h3 className="font-bold text-[18px]">Appreciation Trends</h3></div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"><span className="text-sm text-gray-700">1-Year Appreciation</span><span className="font-bold text-green-600">+{valuation.appreciation.oneYear}%</span></div>
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"><span className="text-sm text-gray-700">3-Year Appreciation</span><span className="font-bold text-green-600">+{valuation.appreciation.threeYear}%</span></div>
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"><span className="text-sm text-gray-700">5-Year Appreciation</span><span className="font-bold text-green-600">+{valuation.appreciation.fiveYear}%</span></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3"><Home className="w-5 h-5 text-[#342e37]" /><h3 className="font-bold text-[18px]">Rental Estimate</h3></div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="mb-3"><p className="text-sm text-gray-600 mb-1">Estimated Monthly Rent</p><p className="font-bold text-[24px] text-blue-600">${valuation.rentalEstimate.monthly.toLocaleString()}/mo</p></div>
                    <div className="pt-3 border-t border-blue-200"><p className="text-xs text-gray-600 mb-2">Rental Range</p><div className="flex items-center justify-between text-sm"><span className="font-medium">${valuation.rentalEstimate.low.toLocaleString()}</span><span className="text-gray-400">&ndash;</span><span className="font-medium">${valuation.rentalEstimate.high.toLocaleString()}</span></div></div>
                    <div className="pt-3 border-t border-blue-200 mt-3"><p className="text-xs text-gray-600 mb-1">Estimated Annual Yield</p><p className="font-bold text-blue-600">{((valuation.rentalEstimate.monthly * 12 / valuation.estimatedValue) * 100).toFixed(2)}%</p></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3"><Target className="w-5 h-5 text-[#342e37]" /><h3 className="font-bold text-[18px]">Comparable Sales</h3></div>
                  <div className="space-y-3">
                    {valuation.comparables.map((comp, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2"><div><p className="font-bold text-[15px]">{comp.address}</p><p className="text-xs text-gray-600">{comp.distance} away</p></div><p className="font-bold text-[16px]">${comp.price.toLocaleString()}</p></div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <div><p className="text-gray-500">Beds/Baths</p><p className="font-medium text-gray-900">{comp.beds} / {comp.baths}</p></div>
                          <div><p className="text-gray-500">Sq Ft</p><p className="font-medium text-gray-900">{comp.sqft.toLocaleString()}</p></div>
                          <div><p className="text-gray-500">$/SF</p><p className="font-medium text-gray-900">${comp.sqft > 0 ? Math.floor(comp.price / comp.sqft) : '—'}</p></div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600"><span>Sold: {new Date(comp.soldDate).toLocaleDateString()}</span><span>&bull;</span><span>{comp.daysOnMarket} days on market</span></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3"><Activity className="w-5 h-5 text-[#342e37]" /><h3 className="font-bold text-[18px]">Market Conditions</h3></div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div><p className="text-gray-600 mb-1">Avg Days on Market</p><p className="font-medium">{valuation.marketConditions.avgDaysOnMarket} days</p></div>
                    <div><p className="text-gray-600 mb-1">List to Sale Ratio</p><p className="font-medium">{valuation.marketConditions.listToSaleRatio}%</p></div>
                    <div><p className="text-gray-600 mb-1">Inventory Level</p><p className="font-medium">{valuation.marketConditions.inventoryLevel}</p></div>
                    <div><p className="text-gray-600 mb-1">Market Trend</p><p className="font-medium text-green-600">{valuation.marketConditions.marketTrend}</p></div>
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-purple-600" /><h3 className="font-bold text-[16px]">Estimated Equity Position</h3></div>
                  <p className="text-sm text-gray-700 mb-3">Based on estimated mortgage balance of 70% LTV</p>
                  <p className="font-bold text-[24px] text-purple-600">${valuation.equity.toLocaleString()}</p>
                  <p className="text-xs text-gray-600 mt-1">{((valuation.equity / valuation.estimatedValue) * 100).toFixed(1)}% equity</p>
                </div>
                <div className="pt-4 pb-2" />
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
