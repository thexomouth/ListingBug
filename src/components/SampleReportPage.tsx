import { useState } from 'react';
import { LBButton } from './design-system/LBButton';
import { LBTable, LBTableHeader, LBTableBody, LBTableHead, LBTableRow, LBTableCell } from './design-system/LBTable';
import { LBCard, LBCardHeader, LBCardTitle, LBCardContent } from './design-system/LBCard';
import { 
  Eye, 
  Download, 
  MapPin, 
  DollarSign, 
  Home,
  ChevronLeft,
  ChevronRight,
  Zap,
  Share2,
  Calendar,
  CheckCircle,
  ArrowRight,
  FileDown,
  Settings
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { SampleListing } from '../types/listing';
import { ListingDetailModal } from './ListingDetailModal';

interface SampleReportPageProps {
  zipcode: string;
  listings: SampleListing[];
  onNavigate?: (page: string) => void;
}

export function SampleReportPage({ zipcode, listings, onNavigate }: SampleReportPageProps) {
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination calculations
  const totalPages = Math.ceil(listings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentListings = listings.slice(startIndex, endIndex);

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

          <button class="print-btn" onclick="window.print()">Print Report</button>

          <h2>Property Listings (${listings.length} Results)</h2>
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>City</th>
                <th>Price</th>
                <th>Beds</th>
                <th>Baths</th>
                <th>Sq Ft</th>
                <th>Year Built</th>
                <th>DOM</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${listings.map(l => `
                <tr>
                  <td>${l.addressLine1}</td>
                  <td>${l.city}</td>
                  <td class="price">$${l.price.toLocaleString()}</td>
                  <td>${l.bedrooms}</td>
                  <td>${l.bathrooms}</td>
                  <td>${l.squareFeet.toLocaleString()}</td>
                  <td>${l.yearBuilt}</td>
                  <td>${l.daysOnMarket}</td>
                  <td>${l.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

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
    <div className="py-3 md:py-4 bg-white dark:bg-[#0F1115]">
      {/* Header - Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-[#ffd447] flex items-center justify-center">
            <FileDown className="w-6 h-6 text-[#342e37]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-[#342e37] dark:text-white">Sample Report Results</h1>
            <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] md:text-sm">
              ZIP Code: {zipcode} • Generated {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Search Parameters Section - Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6">
        <div className="mb-3">
          <h3 className="flex items-center gap-2 font-bold text-[#342e37] dark:text-white">
            <Settings className="w-5 h-5 text-primary" />
            Search Parameters
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div>
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
            <p className="text-[11px] md:text-[14px] font-medium text-[#342e37] dark:text-white">ZIP Code: {zipcode}</p>
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-1">Property Type</p>
            <p className="text-[11px] md:text-[14px] font-medium text-[#342e37] dark:text-white">All Types</p>
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
            <p className="text-[11px] md:text-[14px] font-medium text-[#342e37] dark:text-white">Active Listings</p>
          </div>
        </div>
      </div>

      {/* Listings Table - Full Width */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6">
        <LBCard elevation="sm" className="border-0">
          <LBCardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <LBCardTitle className="text-base md:text-lg">
                Listing Results ({listings.length})
              </LBCardTitle>
              <div className="flex gap-2">
                <LBButton
                  size="sm"
                  variant="outline"
                  onClick={handleViewReport}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  View/Print
                </LBButton>
                <LBButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadReport('CSV')}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  CSV
                </LBButton>
                <LBButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadReport('JSON')}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  JSON
                </LBButton>
              </div>
            </div>
          </LBCardHeader>
          <LBCardContent className="pt-0">
            <div className="overflow-x-auto -mx-6 md:mx-0">
              <LBTable>
                <LBTableHeader>
                  <LBTableRow>
                    <LBTableHead className="min-w-[180px]">Address</LBTableHead>
                    <LBTableHead className="min-w-[120px]">City</LBTableHead>
                    <LBTableHead className="min-w-[130px]">List Price</LBTableHead>
                    <LBTableHead>Beds/Baths</LBTableHead>
                    <LBTableHead>Sq Ft</LBTableHead>
                    <LBTableHead>Year Built</LBTableHead>
                    <LBTableHead className="min-w-[140px]">Agent Name</LBTableHead>
                    <LBTableHead className="text-center">DOM</LBTableHead>
                    <LBTableHead>Status</LBTableHead>
                    <LBTableHead className="w-[80px]"></LBTableHead>
                  </LBTableRow>
                </LBTableHeader>
                <LBTableBody>
                  {currentListings.map((listing) => (
                    <LBTableRow 
                      key={listing.id} 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleViewListing(listing)}
                    >
                      <LBTableCell className="font-medium">{listing.addressLine1}</LBTableCell>
                      <LBTableCell>{listing.city}</LBTableCell>
                      <LBTableCell className="font-medium text-green-700">
                        ${listing.price.toLocaleString()}
                      </LBTableCell>
                      <LBTableCell>{listing.bedrooms} / {listing.bathrooms}</LBTableCell>
                      <LBTableCell>{listing.squareFeet.toLocaleString()}</LBTableCell>
                      <LBTableCell>{listing.yearBuilt}</LBTableCell>
                      <LBTableCell className="text-[13px]">{listing.agentName}</LBTableCell>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 md:px-3 py-4 border-t">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, listings.length)} of {listings.length} listings
                </p>
                <div className="flex items-center gap-2">
                  <LBButton
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </LBButton>
                  <span className="text-sm text-gray-600 px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <LBButton
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </LBButton>
                </div>
              </div>
            )}
          </LBCardContent>
        </LBCard>
      </div>

      {/* Sample Report Notice */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-4">
          <p className="text-xs text-amber-800 dark:text-amber-200 text-center">
            This is a sample report showing property data only. Agent contact information (emails/phones), office contact details, and builder contact info require a paid account.
          </p>
        </div>
      </div>

      {/* Automations Section */}
      <div className="bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 dark:from-[#0F1115] dark:via-[#1a1a1a] dark:to-[#0F1115] border-y border-gray-200 dark:border-white/5 py-12 mb-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="bg-white dark:bg-[#1a1a1a] border-2 border-[#ffd447]/30 dark:border-[#ffd447]/20 rounded-xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-xl md:text-2xl text-[#342e37] dark:text-white mb-2">
                  Automate Reports Like This
                </h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] md:text-[15px] mb-6">
                  Even <strong className="text-[#342e37] dark:text-white">Starter members</strong> can automate searches like this! Set up your criteria once, and receive fresh listings automatically—no more manual downloads or daily logins.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#342e37] dark:text-white text-sm">Daily Fresh Data</p>
                      <p className="text-xs text-gray-600 dark:text-[#EBF2FA]">Get updated listings every 24 hours automatically</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#342e37] dark:text-white text-sm">Rich Information</p>
                      <p className="text-xs text-gray-600 dark:text-[#EBF2FA]">Access agent contacts, office details, and more</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#342e37] dark:text-white text-sm">Set It & Forget It</p>
                      <p className="text-xs text-gray-600 dark:text-[#EBF2FA]">Configure once, run forever with zero maintenance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#342e37] dark:text-white text-sm">Custom Filters</p>
                      <p className="text-xs text-gray-600 dark:text-[#EBF2FA]">25+ search parameters to find exactly what you need</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6">
        <div className="bg-white dark:bg-[#1a1a1a] border-2 border-blue-200 dark:border-blue-800/40 rounded-xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-xl md:text-2xl text-[#342e37] dark:text-white mb-2">
                Connect to Your Favorite Tools
              </h3>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] md:text-[15px] mb-6">
                Send listings directly to the tools you already use. No manual imports, no copy-pasting—just seamless automation that fits your workflow.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-[#0F1115] border border-gray-200 dark:border-white/10 rounded-lg p-3 md:p-4 text-center transition-all hover:border-[#ffd447] dark:hover:border-[#ffd447]/60">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-white/80" />
                  <p className="text-xs font-medium text-gray-700 dark:text-white">Google Sheets</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#0F1115] border border-gray-200 dark:border-white/10 rounded-lg p-3 md:p-4 text-center transition-all hover:border-[#ffd447] dark:hover:border-[#ffd447]/60">
                  <Share2 className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-white/80" />
                  <p className="text-xs font-medium text-gray-700 dark:text-white">Zapier</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#0F1115] border border-gray-200 dark:border-white/10 rounded-lg p-3 md:p-4 text-center transition-all hover:border-[#ffd447] dark:hover:border-[#ffd447]/60">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-white/80" />
                  <p className="text-xs font-medium text-gray-700 dark:text-white">Email</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#0F1115] border border-gray-200 dark:border-white/10 rounded-lg p-3 md:p-4 text-center transition-all hover:border-[#ffd447] dark:hover:border-[#ffd447]/60">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-white/80" />
                  <p className="text-xs font-medium text-gray-700 dark:text-white">Webhooks</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                + 13 more destinations including Slack, Airtable, Make.com, and custom integrations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-br from-[#ffd447]/5 via-white to-[#ffd447]/10 dark:from-[#1a1a1a] dark:via-[#0F1115] dark:to-[#1a1a1a] border-y border-[#ffd447]/20 dark:border-[#ffd447]/10 py-12">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h3 className="font-bold text-2xl md:text-3xl text-[#342e37] dark:text-white mb-4">
            Ready to Stop Manual Searching?
          </h3>
          <p className="text-gray-600 dark:text-[#EBF2FA] text-[15px] md:text-[16px] mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of real estate professionals who have automated their listing searches with ListingBug. Get started today with a 7-day free trial—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <LBButton
              size="lg"
              onClick={() => onNavigate?.('pricing')}
              className="w-full sm:w-auto bg-[#ffd447] hover:bg-[#ffd447]/90 text-[#342e37] font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Free Trial
            </LBButton>
            <LBButton
              size="lg"
              variant="outline"
              onClick={() => onNavigate?.('automations')}
              className="w-full sm:w-auto dark:border-white/20 dark:text-white dark:hover:bg-white/5"
            >
              Learn About Automations
              <ArrowRight className="w-4 h-4 ml-2" />
            </LBButton>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
            7-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSaveListing={() => {}}
          isSaved={false}
        />
      )}
    </div>
  );
}