import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Info, Eye, Download, Save } from 'lucide-react';
import { toast } from 'sonner';
import { generateComprehensiveListings } from '../utils/listingGenerator';
import { ComprehensiveListing } from '../types/listing';

interface ReportFilters {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  radius?: string;
  propertyType?: string;
  beds?: string;
  baths?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: string;
  daysListed?: string;
}

interface ReportHistory {
  id: number;
  date: string;
  resultsCount: number;
  format: string;
}

interface Report {
  id: number;
  name: string;
  location: string;
  criteria: string;
  results: number;
  createdAt: string;
  automated: boolean;
  filters: ReportFilters;
  history: ReportHistory[];
}

interface ReportDetailsModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: Report) => void;
  showFromNewReport?: boolean;
  defaultTab?: 'preferences' | 'history';
}

export function ReportDetailsModal({
  report,
  isOpen,
  onClose,
  onSave,
  showFromNewReport = false,
  defaultTab = 'preferences',
}: ReportDetailsModalProps) {
  const [editedReport, setEditedReport] = useState<Report | null>(report);

  // Update editedReport when report prop changes
  useEffect(() => {
    if (report) {
      setEditedReport(report);
    }
  }, [report]);

  if (!report || !editedReport) return null;

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setEditedReport((prev) =>
      prev
        ? {
            ...prev,
            filters: {
              ...prev.filters,
              [field]: value,
            },
          }
        : null
    );
  };

  const handleSave = () => {
    if (editedReport && JSON.stringify(editedReport) !== JSON.stringify(report)) {
      onSave(editedReport);
      toast.success('Report preferences saved successfully');
    }
  };

  const handleViewReport = (historyId?: number) => {
    // Generate comprehensive listing data based on report filters
    const listings = generateComprehensiveListings(report.filters);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to view reports');
      return;
    }
    
    const historyItem = historyId ? report.history.find(h => h.id === historyId) : null;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.name} - Full Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 1400px; margin: 0 auto; }
            h1 { color: #342E37; border-bottom: 3px solid #FFCE0A; padding-bottom: 10px; }
            h2 { color: #342E37; margin-top: 30px; margin-bottom: 15px; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 8px; }
            .report-info { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
            .info-item { text-align: center; }
            .info-item strong { display: block; color: #666; font-size: 12px; margin-bottom: 5px; }
            .info-item .value { font-size: 24px; font-weight: bold; color: #342E37; }
            .print-btn { background: #FFCE0A; border: none; padding: 12px 24px; cursor: pointer; font-size: 16px; border-radius: 4px; margin: 20px 0; }
            @media print { .print-btn { display: none; } }
            .section { margin: 30px 0; page-break-inside: avoid; }
            .listing-card { background: white; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 8px; page-break-inside: avoid; }
            .listing-header { background: #342E37; color: white; padding: 10px 15px; margin: -15px -15px 15px -15px; border-radius: 8px 8px 0 0; }
            .data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 10px 0; }
            .data-item { padding: 8px; background: #f9f9f9; border-radius: 4px; }
            .data-label { font-size: 10px; color: #666; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px; }
            .data-value { font-size: 13px; color: #342E37; font-weight: 500; }
            .contact-info { background: #e8f5e9; border-left: 4px solid #4caf50; }
            .price { color: #16a34a; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${report.name}</h1>
          
          <div class="report-info">
            <div class="info-item">
              <strong>Generated</strong>
              <div class="value">${historyItem ? new Date(historyItem.date).toLocaleDateString() : new Date().toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <strong>Total Properties</strong>
              <div class="value">${listings.length}</div>
            </div>
            <div class="info-item">
              <strong>Average Price</strong>
              <div class="value">$${listings.length > 0 ? Math.round(listings.reduce((sum, l) => sum + l.price, 0) / listings.length).toLocaleString() : '0'}</div>
            </div>
          </div>

          <h2>Property Listings (${listings.length} Results)</h2>

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
                  <div class="data-item contact-info">
                    <span class="data-label">Agent Email</span>
                    <span class="data-value">${listing.agentEmail}</span>
                  </div>
                  <div class="data-item contact-info">
                    <span class="data-label">Agent Phone</span>
                    <span class="data-value">${listing.agentPhone}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Agent Website</span>
                    <span class="data-value">${listing.agentWebsite}</span>
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
                  <div class="data-item contact-info">
                    <span class="data-label">Office Email</span>
                    <span class="data-value">${listing.officeEmail}</span>
                  </div>
                  <div class="data-item contact-info">
                    <span class="data-label">Office Phone</span>
                    <span class="data-value">${listing.officePhone}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Office Website</span>
                    <span class="data-value">${listing.officeWebsite}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Broker Name</span>
                    <span class="data-value">${listing.brokerName}</span>
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

              ${listing.builderName ? `
                <div class="section">
                  <h3 style="font-size: 14px; color: #342E37; margin: 15px 0 10px 0;">🏗️ Builder Information</h3>
                  <div class="data-grid">
                    <div class="data-item">
                      <span class="data-label">Builder Name</span>
                      <span class="data-value">${listing.builderName}</span>
                    </div>
                    ${listing.builderPhone ? `
                      <div class="data-item contact-info">
                        <span class="data-label">Builder Phone</span>
                        <span class="data-value">${listing.builderPhone}</span>
                      </div>
                    ` : ''}
                    ${listing.builderEmail ? `
                      <div class="data-item contact-info">
                        <span class="data-label">Builder Email</span>
                        <span class="data-value">${listing.builderEmail}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}

          <button class="print-btn" onclick="window.print()">Print Report</button>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success('Report opened for viewing');
  };

  const handleDownloadReport = (historyId: number, format: string) => {
    const listings = generateComprehensiveListings(report.filters);
    const historyItem = report.history.find(h => h.id === historyId);
    if (!historyItem) return;
    
    let content: string;
    let mimeType: string;
    let fileExtension: string;

    if (format === 'CSV') {
      const headers = 'ID,Formatted Address,Address Line 1,City,State,ZIP Code,County,Latitude,Longitude,Property Type,Bedrooms,Bathrooms,Square Feet,Lot Size,Year Built,Price,Status,Days on Market,Listing Date,Last Seen Date,Removed Date,Created Date,Agent Name,Agent Email,Agent Phone,Agent Website,Office Name,Office Email,Office Phone,Office Website,Broker Name,MLS Number,MLS Name,Builder Name,Builder Phone,Builder Email\n';
      const rows = listings.map(l => 
        `"${l.id}","${l.formattedAddress}","${l.addressLine1}","${l.city}","${l.state}","${l.zipCode}","${l.county}",${l.latitude},${l.longitude},"${l.propertyType}",${l.bedrooms},${l.bathrooms},${l.squareFeet},${l.lotSize},${l.yearBuilt},${l.price},"${l.status}",${l.daysOnMarket},"${l.listingDate}","${l.lastSeenDate}","${l.removedDate || ''}","${l.createdDate}","${l.agentName}","${l.agentEmail}","${l.agentPhone}","${l.agentWebsite}","${l.officeName}","${l.officeEmail}","${l.officePhone}","${l.officeWebsite}","${l.brokerName}","${l.mlsNumber}","${l.mlsName}","${l.builderName || ''}","${l.builderPhone || ''}","${l.builderEmail || ''}"`
      ).join('\n');
      content = headers + rows;
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else {
      content = JSON.stringify({
        reportName: report.name,
        generatedDate: historyItem.date,
        totalProperties: listings.length,
        averagePrice: Math.round(listings.reduce((sum, l) => sum + l.price, 0) / listings.length),
        filters: report.filters,
        listings: listings,
      }, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, '-').toLowerCase()}-${historyItem.date}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Report downloaded as ${format}`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b bg-[#FFCE0A]">
          <SheetTitle className="text-2xl text-[#342e37]">{report.name}</SheetTitle>
          <SheetDescription className="text-[15px] text-[#342e37]/80">
            View and manage your report preferences and history
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="preferences" aria-label="View and edit report preferences">
                View / Edit
              </TabsTrigger>
              <TabsTrigger value="history" aria-label="View and download report history">
                Download
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preferences" className="space-y-4 mt-0">
              {showFromNewReport && (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Your report has been added successfully! You can view and download your report results in the <strong>Download</strong> tab above.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Edit your report search criteria and preferences. Changes are saved automatically when you close this window.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Report Name */}
                <div className="col-span-2">
                  <Label htmlFor="name">Report Name</Label>
                  <Input
                    id="name"
                    value={editedReport.name}
                    onChange={(e) =>
                      setEditedReport((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                    className="mt-1"
                  />
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={editedReport.filters.address || ''}
                    onChange={(e) => handleFilterChange('address', e.target.value)}
                    className="mt-1"
                    placeholder="Enter address"
                  />
                </div>

                {/* City */}
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={editedReport.filters.city || ''}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="mt-1"
                    placeholder="Enter city"
                  />
                </div>

                {/* State */}
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={editedReport.filters.state || ''}
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                    className="mt-1"
                    placeholder="Enter state"
                  />
                </div>

                {/* Zip Code */}
                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={editedReport.filters.zipCode || ''}
                    onChange={(e) => handleFilterChange('zipCode', e.target.value)}
                    className="mt-1"
                    placeholder="Enter zip code"
                  />
                </div>

                {/* Property Type */}
                <div>
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Input
                    id="propertyType"
                    value={editedReport.filters.propertyType || ''}
                    onChange={(e) =>
                      handleFilterChange('propertyType', e.target.value)
                    }
                    className="mt-1"
                    placeholder="Enter property type"
                  />
                </div>

                {/* Radius */}
                <div>
                  <Label htmlFor="radius">Radius (miles)</Label>
                  <Input
                    id="radius"
                    value={editedReport.filters.radius || ''}
                    onChange={(e) => handleFilterChange('radius', e.target.value)}
                    className="mt-1"
                    placeholder="Enter radius"
                  />
                </div>

                {/* Beds */}
                <div>
                  <Label htmlFor="beds">Bedrooms</Label>
                  <Input
                    id="beds"
                    value={editedReport.filters.beds || ''}
                    onChange={(e) => handleFilterChange('beds', e.target.value)}
                    className="mt-1"
                    placeholder="e.g., 3+"
                  />
                </div>

                {/* Baths */}
                <div>
                  <Label htmlFor="baths">Bathrooms</Label>
                  <Input
                    id="baths"
                    value={editedReport.filters.baths || ''}
                    onChange={(e) => handleFilterChange('baths', e.target.value)}
                    className="mt-1"
                    placeholder="e.g., 2+"
                  />
                </div>

                {/* Min Price */}
                <div>
                  <Label htmlFor="minPrice">Min Price</Label>
                  <Input
                    id="minPrice"
                    value={editedReport.filters.minPrice || ''}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="mt-1"
                    placeholder="Enter minimum price"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <Label htmlFor="maxPrice">Max Price</Label>
                  <Input
                    id="maxPrice"
                    value={editedReport.filters.maxPrice || ''}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="mt-1"
                    placeholder="Enter maximum price"
                  />
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={editedReport.filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="mt-1"
                    placeholder="e.g., Active, Pending"
                  />
                </div>

                {/* Days Listed */}
                <div>
                  <Label htmlFor="daysListed">Days Listed</Label>
                  <Input
                    id="daysListed"
                    value={editedReport.filters.daysListed || ''}
                    onChange={(e) =>
                      handleFilterChange('daysListed', e.target.value)
                    }
                    className="mt-1"
                    placeholder="e.g., 30+"
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSave}
                    className="bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342E37]"
                    aria-label="Save report changes"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>

                {/* Email Notifications Toggle */}
                <div className="col-span-2 border-t pt-4 mt-2">
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor="email-notifications" className="cursor-pointer">
                        Receive Email Notifications
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Get notified when new properties match this report
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={editedReport.automated}
                      onCheckedChange={(checked) =>
                        setEditedReport((prev) =>
                          prev ? { ...prev, automated: checked } : null
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  View and download previous report generations
                </p>
              </div>

              {report.history && report.history.length > 0 ? (
                <div className="space-y-3">
                  {report.history.map((historyItem) => (
                    <div
                      key={historyItem.id}
                      className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Report Details */}
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {new Date(historyItem.date).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {historyItem.resultsCount} results • {historyItem.format}{' '}
                            format
                          </p>
                        </div>

                        {/* Action Buttons - Mobile Optimized */}
                        <div className="flex gap-1.5 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReport(historyItem.id)}
                            className="flex-1 gap-1 sm:gap-2 px-2 sm:px-3 min-w-0"
                            aria-label={`View and print report from ${new Date(historyItem.date).toLocaleDateString()}`}
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-[11px] sm:text-sm truncate">View/Print</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleDownloadReport(historyItem.id, historyItem.format)
                            }
                            className="flex-1 gap-1 sm:gap-2 px-2 sm:px-3 min-w-0 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342E37]"
                            aria-label={`Download ${historyItem.format} report from ${new Date(historyItem.date).toLocaleDateString()}`}
                          >
                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-[11px] sm:text-sm truncate">Download</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No report history available</p>
                  <p className="text-sm mt-2">
                    Reports will appear here once generated
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}