import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Eye, Download, MapPin, DollarSign, Home, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { SampleListing } from '../types/listing';
import { useState, useEffect } from 'react';
import { ListingDetailModal } from './ListingDetailModal';
import { FileText } from 'lucide-react';
import { LBTable, LBTableHeader, LBTableBody, LBTableHead, LBTableRow, LBTableCell } from './design-system/LBTable';
import { LBButton } from './design-system/LBButton';

interface SampleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  zipcode: string;
  listings: SampleListing[];
  onNavigate?: (page: string) => void;
}

export function SampleReportModal({
  isOpen,
  onClose,
  zipcode,
  listings,
  onNavigate,
}: SampleReportModalProps) {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedListing, setSelectedListing] = useState<any | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Array of property photos for fallback
  const propertyPhotos = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDF8fHx8MTc2NDEwMzA0N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb25kbyUyMGludGVyaW9yfGVufDF8fHx8MTc2NDExOTc3NXww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdWJ1cmJhbiUyMGhvdXNlfGVufDF8fHx8MTc2NDA5NjQwMnww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1656712193274-d391a185fde6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3duaG91c2UlMjBleHRlcmlvcnxlbnwxfHx8fDE3NjQxMjg3NTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1597475681177-809cfdc76cd2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMGhvdXNlJTIwb2NlYW58ZW58MXx8fHwxNzY0MTk0MDY4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1659720879195-d5a108231648?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb250ZW1wb3JhcnklMjBob21lfGVufDF8fHx8MTc2NDE1OTc2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1674821770946-4f774b1907d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNpZGVudGlhbCUyMHByb3BlcnR5fGVufDF8fHx8MTc2NDE5NDA2OHww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsJTIwZXN0YXRlJTIwaG91c2V8ZW58MXx8fHwxNzY0MTIyMDUzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  ];

  const handleViewListing = (listing: SampleListing) => {
    // Convert SampleListing to the format expected by ListingDetailModal
    const convertedListing = {
      id: listing.id,
      address: listing.addressLine1,
      city: listing.city,
      state: listing.state,
      zip: listing.zipCode,
      propertyType: listing.propertyType,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqft: listing.squareFeet,
      lotSize: listing.lotSize,
      yearBuilt: listing.yearBuilt,
      status: listing.status,
      price: listing.price,
      daysListed: listing.daysOnMarket,
      agentName: listing.agentName,
      agentPhone: '(Contact info requires paid account)',
      agentEmail: 'contact-info@requires-account.com',
      brokerage: listing.officeName,
      reList: false,
      priceDrop: false,
      latitude: listing.latitude,
      longitude: listing.longitude,
      description: `${listing.propertyType} property in ${listing.city}, ${listing.state}. Built in ${listing.yearBuilt}.`,
      photos: [],
      mlsNumber: listing.mlsNumber,
      mlsSource: listing.mlsName,
    };
    setSelectedListing(convertedListing);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedListing(null);
  };

  const handleCloseModal = () => {
    setViewMode('list');
    setSelectedListing(null);
    onClose();
  };

  const handleViewReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to view reports');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sample Report - ZIP ${zipcode}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 1400px; margin: 0 auto; }
            h1 { color: #342E37; border-bottom: 3px solid #FFD447; padding-bottom: 10px; }
            h2 { color: #342E37; margin-top: 30px; margin-bottom: 15px; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 8px; }
            .report-info { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
            .info-item { text-align: center; }
            .info-item strong { display: block; color: #666; font-size: 12px; margin-bottom: 5px; }
            .info-item .value { font-size: 24px; font-weight: bold; color: #342E37; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
            th { background: #342E37; color: white; padding: 10px 8px; text-align: left; font-size: 11px; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            tr:hover { background: #f9f9f9; }
            .price { color: #16a34a; font-weight: bold; }
            .print-btn { background: #FFD447; border: none; padding: 12px 24px; cursor: pointer; font-size: 16px; border-radius: 4px; margin: 20px 0; }
            @media print { .print-btn { display: none; } }
            .disclaimer { background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #FFD447; }
            .section { margin: 30px 0; page-break-inside: avoid; }
            .listing-card { background: white; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 8px; page-break-inside: avoid; }
            .listing-header { background: #342E37; color: white; padding: 10px 15px; margin: -15px -15px 15px -15px; border-radius: 8px 8px 0 0; }
            .data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 10px 0; }
            .data-item { padding: 8px; background: #f9f9f9; border-radius: 4px; }
            .data-label { font-size: 10px; color: #666; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px; }
            .data-value { font-size: 13px; color: #342E37; font-weight: 500; }
            .header-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px; }
            .header-row h2 { margin: 0; color: #342E37; font-size: 20px; }
          </style>
        </head>
        <body>
          <h1>Sample Listing Report - ZIP ${zipcode}</h1>
          
          <div class="report-info">
            <div class="info-item">
              <strong>Generated</strong>
              <div class="value">${new Date().toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <strong>Total Properties</strong>
              <div class="value">${listings.length}</div>
            </div>
            <div class="info-item">
              <strong>Average Price</strong>
              <div class="value">$${Math.round(listings.reduce((sum, l) => sum + l.price, 0) / listings.length).toLocaleString()}</div>
            </div>
          </div>

          <div class="disclaimer">
            <strong>Sample Report Notice:</strong> This is a sample report showing property data only. 
            Agent contact information (emails and phone numbers), office contact details, and builder contact information require a paid ListingBug account.
          </div>

          <div class="header-row">
            <h2>Property Listings (${listings.length} Results)</h2>
            <button class="print-btn" onclick="window.print()" style="margin: 0;">Print Report</button>
          </div>

          ${listings.map((listing, index) => `
            <div class="listing-card">
              <div class="listing-header">
                <strong>Property #${index + 1}</strong> • ${listing.formattedAddress}
              </div>

              <div class="section">
                <h3 style="font-size: 14px; color: #342E37; margin: 15px 0 10px 0;">📍 Location Information</h3>
                <div class="data-grid">
                  <div class="data-item">
                    <span class="data-label">ID</span>
                    <span class="data-value">${listing.id}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Address</span>
                    <span class="data-value">${listing.addressLine1}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">City</span>
                    <span class="data-value">${listing.city}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">State</span>
                    <span class="data-value">${listing.state}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">ZIP Code</span>
                    <span class="data-value">${listing.zipCode}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">County</span>
                    <span class="data-value">${listing.county}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Latitude</span>
                    <span class="data-value">${listing.latitude.toFixed(4)}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Longitude</span>
                    <span class="data-value">${listing.longitude.toFixed(4)}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h3 style="font-size: 14px; color: #342E37; margin: 15px 0 10px 0;">🏠 Property Details</h3>
                <div class="data-grid">
                  <div class="data-item">
                    <span class="data-label">Property Type</span>
                    <span class="data-value">${listing.propertyType}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Bedrooms</span>
                    <span class="data-value">${listing.bedrooms}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Bathrooms</span>
                    <span class="data-value">${listing.bathrooms}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Square Footage</span>
                    <span class="data-value">${listing.squareFeet.toLocaleString()} sq ft</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Lot Size</span>
                    <span class="data-value">${listing.lotSize > 0 ? listing.lotSize.toLocaleString() + ' sq ft' : 'N/A'}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Year Built</span>
                    <span class="data-value">${listing.yearBuilt}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h3 style="font-size: 14px; color: #342E37; margin: 15px 0 10px 0;">💰 Listing Information</h3>
                <div class="data-grid">
                  <div class="data-item">
                    <span class="data-label">Price</span>
                    <span class="data-value price">$${listing.price.toLocaleString()}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Status</span>
                    <span class="data-value">${listing.status}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Days on Market</span>
                    <span class="data-value">${listing.daysOnMarket} days</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Listing Date</span>
                    <span class="data-value">${new Date(listing.listingDate).toLocaleDateString()}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Last Seen Date</span>
                    <span class="data-value">${new Date(listing.lastSeenDate).toLocaleDateString()}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Created Date</span>
                    <span class="data-value">${new Date(listing.createdDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h3 style="font-size: 14px; color: #342E37; margin: 15px 0 10px 0;">👤 Agent Information</h3>
                <div class="data-grid">
                  <div class="data-item">
                    <span class="data-label">Agent Name</span>
                    <span class="data-value">${listing.agentName}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Agent Website</span>
                    <span class="data-value">${listing.agentWebsite}</span>
                  </div>
                  <div class="data-item" style="background: #fff3cd;">
                    <span class="data-label">Agent Email</span>
                    <span class="data-value" style="font-style: italic; color: #856404;">Paid Account Required</span>
                  </div>
                  <div class="data-item" style="background: #fff3cd;">
                    <span class="data-label">Agent Phone</span>
                    <span class="data-value" style="font-style: italic; color: #856404;">Paid Account Required</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h3 style="font-size: 14px; color: #342E37; margin: 15px 0 10px 0;">🏢 Office Information</h3>
                <div class="data-grid">
                  <div class="data-item">
                    <span class="data-label">Office Name</span>
                    <span class="data-value">${listing.officeName}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Office Website</span>
                    <span class="data-value">${listing.officeWebsite}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Broker Name</span>
                    <span class="data-value">${listing.brokerName}</span>
                  </div>
                  <div class="data-item" style="background: #fff3cd;">
                    <span class="data-label">Office Email</span>
                    <span class="data-value" style="font-style: italic; color: #856404;">Paid Account Required</span>
                  </div>
                  <div class="data-item" style="background: #fff3cd;">
                    <span class="data-label">Office Phone</span>
                    <span class="data-value" style="font-style: italic; color: #856404;">Paid Account Required</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h3 style="font-size: 14px; color: #342E37; margin: 15px 0 10px 0;">📋 MLS Information</h3>
                <div class="data-grid">
                  <div class="data-item">
                    <span class="data-label">MLS Number</span>
                    <span class="data-value">${listing.mlsNumber}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">MLS Name</span>
                    <span class="data-value">${listing.mlsName}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h3 style="font-size: 14px; color: #342E37; margin: 15px 0 10px 0;">🏗️ Builder Information</h3>
                <div class="data-grid">
                  <div class="data-item">
                    <span class="data-label">Builder Name</span>
                    <span class="data-value">${listing.builderName || 'N/A'}</span>
                  </div>
                  <div class="data-item" style="background: #fff3cd;">
                    <span class="data-label">Builder Phone</span>
                    <span class="data-value" style="font-style: italic; color: #856404;">Paid Account Required</span>
                  </div>
                  <div class="data-item" style="background: #fff3cd;">
                    <span class="data-label">Builder Email</span>
                    <span class="data-value" style="font-style: italic; color: #856404;">Paid Account Required</span>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}

          <div class="disclaimer">
            <strong>Note:</strong> This sample report demonstrates the data structure and available fields. 
            To access agent contact information, office contact details, and builder contact information, please upgrade to a paid account.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success('Report opened for viewing');
  };

  const handleDownloadReport = (format: 'CSV' | 'JSON') => {
    let content: string;
    let mimeType: string;
    let fileExtension: string;

    if (format === 'CSV') {
      const headers = 'ID,Formatted Address,Address Line 1,City,State,ZIP Code,County,Latitude,Longitude,Property Type,Bedrooms,Bathrooms,Square Feet,Lot Size,Year Built,Price,Status,Days on Market,Listing Date,Last Seen Date,Removed Date,Created Date,Agent Name,Agent Website,Office Name,Office Website,Broker Name,MLS Number,MLS Name,Builder Name\n';
      const rows = listings.map(l => 
        `"${l.id}","${l.formattedAddress}","${l.addressLine1}","${l.city}","${l.state}","${l.zipCode}","${l.county}",${l.latitude},${l.longitude},"${l.propertyType}",${l.bedrooms},${l.bathrooms},${l.squareFeet},${l.lotSize},${l.yearBuilt},${l.price},"${l.status}",${l.daysOnMarket},"${l.listingDate}","${l.lastSeenDate}","${l.removedDate || ''}","${l.createdDate}","${l.agentName}","${l.agentWebsite}","${l.officeName}","${l.officeWebsite}","${l.brokerName}","${l.mlsNumber}","${l.mlsName}","${l.builderName || ''}"`
      ).join('\n');
      content = headers + rows;
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else {
      content = JSON.stringify({
        zipcode,
        generatedDate: new Date().toISOString(),
        totalProperties: listings.length,
        averagePrice: Math.round(listings.reduce((sum, l) => sum + l.price, 0) / listings.length),
        listings: listings,
        disclaimer: 'Sample report - Agent, office, and builder contact information requires paid account'
      }, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-report-${zipcode}-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(`Report downloaded as ${format}`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleCloseModal}>
      <SheetContent className="w-full sm:max-w-2xl lg:max-w-4xl p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b bg-[#ffd447]">
          {viewMode === 'detail' ? (
            <div className="space-y-3">
              {/* Row 1: Back Button */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="text-[#342e37] hover:bg-[#342e37]/10 -ml-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to List
                </Button>
              </div>
              {/* Row 2: Title */}
              <SheetTitle className="text-2xl text-[#342e37]">
                Listing Details
              </SheetTitle>
              {/* Row 3: Description */}
              <SheetDescription className="text-[15px] text-[#342e37]/80">
                Complete property information
              </SheetDescription>
            </div>
          ) : (
            <>
              <SheetTitle className="text-2xl text-[#342e37]">
                Sample Report - ZIP {zipcode}
              </SheetTitle>
              <SheetDescription className="text-[15px] text-[#342e37]/80">
                View sample listing data for your area
              </SheetDescription>
            </>
          )}
        </SheetHeader>

        {viewMode === 'list' ? (
          <div className="flex-1 overflow-y-auto px-[12px] py-[16px]">
            {/* Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-[13px] text-yellow-800">
                <strong>Sample Report Notice:</strong> This report shows property data only. 
                Agent contact information (emails/phones), office contact details, and builder contact info require a paid account.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-2 md:p-4">
                <div className="flex flex-col items-center text-center gap-0.5 md:gap-2">
                  <Home className="w-3.5 h-3.5 md:w-5 md:h-5 text-[#342E37]" />
                  <p className="text-[10px] md:text-[12px] text-gray-600 leading-tight">Total<br className="md:hidden" /> Properties</p>
                  <p className="text-[18px] md:text-[24px] font-bold text-[#342E37]">{listings.length}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 md:p-4">
                <div className="flex flex-col items-center text-center gap-0.5 md:gap-2">
                  <DollarSign className="w-3.5 h-3.5 md:w-5 md:h-5 text-green-600" />
                  <p className="text-[10px] md:text-[12px] text-gray-600 leading-tight">Average<br className="md:hidden" /> Price</p>
                  <p className="text-[14px] md:text-[24px] font-bold text-green-600">
                    ${Math.round(listings.reduce((sum, l) => sum + l.price, 0) / listings.length).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 md:p-4">
                <div className="flex flex-col items-center text-center gap-0.5 md:gap-2">
                  <MapPin className="w-3.5 h-3.5 md:w-5 md:h-5 text-blue-600" />
                  <p className="text-[10px] md:text-[12px] text-gray-600 leading-tight">Location</p>
                  <p className="text-[14px] md:text-[24px] font-bold text-blue-600">ZIP {zipcode}</p>
                </div>
              </div>
            </div>

            {/* Listing Results Header with Action Buttons */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-bold text-[16px]">Listing Results ({listings.length})</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleViewReport}
                  className="gap-1.5 text-[13px] px-3 py-1.5 h-auto"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View/Print
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadReport('CSV')}
                  className="gap-1.5 text-[13px] px-3 py-1.5 h-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadReport('JSON')}
                  className="gap-1.5 text-[13px] px-3 py-1.5 h-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  JSON
                </Button>
              </div>
            </div>

            {/* Listings Table */}
            <div className="overflow-x-auto">
              <LBTable>
                <LBTableHeader>
                  <LBTableRow>
                    <LBTableHead className="min-w-[150px]">Address</LBTableHead>
                    <LBTableHead className="min-w-[100px]">City</LBTableHead>
                    <LBTableHead className="min-w-[130px]">List Price</LBTableHead>
                    <LBTableHead>Year Built</LBTableHead>
                    <LBTableHead className="min-w-[130px]">Agent Name</LBTableHead>
                    <LBTableHead className="text-center">Days on Market</LBTableHead>
                    <LBTableHead>Status</LBTableHead>
                    <LBTableHead className="w-[80px]"></LBTableHead>
                  </LBTableRow>
                </LBTableHeader>
                <LBTableBody>
                  {listings.map((listing) => (
                    <LBTableRow key={listing.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewListing(listing)}>
                      <LBTableCell className="font-medium">{listing.addressLine1}</LBTableCell>
                      <LBTableCell>{listing.city}</LBTableCell>
                      <LBTableCell className="font-medium">${listing.price.toLocaleString()}</LBTableCell>
                      <LBTableCell>{listing.yearBuilt}</LBTableCell>
                      <LBTableCell>{listing.agentName}</LBTableCell>
                      <LBTableCell className="text-center">
                        <span className={`${listing.daysOnMarket > 14 ? 'text-orange-600 font-medium' : ''}`}>
                          {listing.daysOnMarket}
                        </span>
                      </LBTableCell>
                      <LBTableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                            listing.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : listing.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {listing.status}
                        </span>
                      </LBTableCell>
                      <LBTableCell>
                        <LBButton 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewListing(listing);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </LBButton>
                      </LBTableCell>
                    </LBTableRow>
                  ))}
                </LBTableBody>
              </LBTable>
            </div>

            {/* Automation CTA Section */}
            <div className="mt-8 bg-gradient-to-br from-[#ffd447]/10 via-white to-[#ffd447]/5 border-2 border-[#ffd447] rounded-lg p-6">
              <div className="text-center">
                <h3 className="font-bold text-[20px] text-[#342e37] mb-2">
                  Stop Manual Searching. Automate Everything.
                </h3>
                <p className="text-gray-600 text-[14px] mb-4 max-w-2xl mx-auto">
                  Get fresh listings delivered automatically to your inbox, CRM, or any tool you use. 
                  No more logging in, no more manual downloads. Set it once, and let ListingBug do the work.
                </p>
                <button
                  onClick={() => {
                    handleCloseModal();
                    onNavigate?.('automation');
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-[#ffd447] hover:bg-[#ffd447]/90 text-[#342e37] rounded-lg transition-colors font-bold text-[14px] px-6 py-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Learn About Automation
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 md:px-6 py-6 space-y-6">
            {selectedListing && (
              <>
                {/* Property Photo - Always show with fallback */}
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={(selectedListing.photos && selectedListing.photos.length > 0) ? selectedListing.photos[0] : propertyPhotos[selectedListing.id % propertyPhotos.length]} 
                    alt={selectedListing.address}
                    className="w-full h-64 object-cover"
                  />
                </div>

                {/* Description */}
                {selectedListing.description && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-[#342E37]" />
                      <h3 className="font-bold text-[18px]">Description</h3>
                    </div>
                    <p className="text-[14px] text-gray-700 leading-relaxed">
                      {selectedListing.description}
                    </p>
                  </div>
                )}

                {/* Sample Report Notice for Contact Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-[13px] text-yellow-800">
                    <strong>Note:</strong> Agent contact information (phone/email) requires a paid account. This is sample data only.
                  </p>
                </div>

                {/* Listing Information */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-5 h-5 text-[#342E37]" />
                    <h3 className="font-bold text-[18px]">Listing Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">List Price</p>
                      <p className="font-medium text-[16px]">${selectedListing.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Status</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                          selectedListing.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : selectedListing.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedListing.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Days on Market</p>
                      <p className="font-medium">{selectedListing.daysListed} days</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">MLS Number</p>
                      <p className="font-medium">{selectedListing.mlsNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">MLS Source</p>
                      <p className="font-medium">{selectedListing.mlsSource}</p>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-5 h-5 text-[#342E37]" />
                    <h3 className="font-bold text-[18px]">Property Details</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">Property Type</p>
                      <p className="font-medium">{selectedListing.propertyType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Year Built</p>
                      <p className="font-medium">{selectedListing.yearBuilt}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Bedrooms</p>
                      <p className="font-medium">{selectedListing.bedrooms}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Bathrooms</p>
                      <p className="font-medium">{selectedListing.bathrooms}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Square Feet</p>
                      <p className="font-medium">{selectedListing.sqft.toLocaleString()} sq ft</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Lot Size</p>
                      <p className="font-medium">
                        {selectedListing.lotSize > 0 ? `${selectedListing.lotSize.toLocaleString()} sq ft` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-[#342E37]" />
                    <h3 className="font-bold text-[18px]">Location Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">Address</p>
                      <p className="font-medium">{selectedListing.address}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">City</p>
                      <p className="font-medium">{selectedListing.city}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">State</p>
                      <p className="font-medium">{selectedListing.state}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">ZIP Code</p>
                      <p className="font-medium">{selectedListing.zip}</p>
                    </div>
                  </div>
                </div>

                {/* Agent & Broker Information */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-5 h-5 text-[#342E37]" />
                    <h3 className="font-bold text-[18px]">Agent & Broker Information</h3>
                  </div>
                  <div className="space-y-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">Listing Agent</p>
                      <p className="font-medium">{selectedListing.agentName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Brokerage</p>
                      <p className="font-medium">{selectedListing.brokerage}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Agent Phone</p>
                      <p className="font-medium text-gray-500 italic">{selectedListing.agentPhone}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Agent Email</p>
                      <p className="font-medium text-gray-500 italic">{selectedListing.agentEmail}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}