import { useState } from 'react';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { MoreVertical, Edit, Copy, Trash2 } from 'lucide-react';
import { FileText } from 'lucide-react';

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

interface MyReportsProps {
  newReportData?: any;
  onOpenReport: (report: Report, tab?: 'preferences' | 'history', fromNewReport?: boolean) => void;
}

export function MyReports({ newReportData, onOpenReport }: MyReportsProps) {
  const [reports, setReports] = useState<Report[]>([
    {
      id: 1,
      name: 'Los Angeles Single Family Homes',
      location: 'Los Angeles, CA',
      criteria: '3+ bed, 2+ bath, $500k-$1M',
      results: 247,
      createdAt: '2025-11-15',
      automated: true,
      filters: {
        address: '',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '',
        radius: '',
        propertyType: 'Single Family Home',
        beds: '3+',
        baths: '2+',
        minPrice: '500000',
        maxPrice: '1000000',
        status: '',
        daysListed: '',
      },
      history: [
        {
          id: 101,
          date: '2025-11-23',
          resultsCount: 247,
          format: 'PDF',
        },
        {
          id: 102,
          date: '2025-11-20',
          resultsCount: 243,
          format: 'CSV',
        },
        {
          id: 103,
          date: '2025-11-15',
          resultsCount: 239,
          format: 'PDF',
        },
      ],
    },
    {
      id: 2,
      name: 'San Francisco Condos',
      location: 'San Francisco, CA',
      criteria: '2+ bed, $800k-$1.5M',
      results: 89,
      createdAt: '2025-11-10',
      automated: false,
      filters: {
        address: '',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '',
        radius: '',
        propertyType: 'Condo',
        beds: '2+',
        baths: '',
        minPrice: '800000',
        maxPrice: '1500000',
        status: '',
        daysListed: '',
      },
      history: [
        {
          id: 201,
          date: '2025-11-10',
          resultsCount: 89,
          format: 'PDF',
        },
        {
          id: 202,
          date: '2025-11-08',
          resultsCount: 92,
          format: 'CSV',
        },
      ],
    },
    {
      id: 3,
      name: 'San Diego Coastal Properties',
      location: 'San Diego, CA',
      criteria: '2+ bed, within 5 miles of coast',
      results: 156,
      createdAt: '2025-11-05',
      automated: true,
      filters: {
        address: '',
        city: 'San Diego',
        state: 'CA',
        zipCode: '',
        radius: '5',
        propertyType: 'Coastal Property',
        beds: '2+',
        baths: '',
        minPrice: '',
        maxPrice: '',
        status: '',
        daysListed: '',
      },
      history: [
        {
          id: 301,
          date: '2025-11-23',
          resultsCount: 156,
          format: 'PDF',
        },
        {
          id: 302,
          date: '2025-11-18',
          resultsCount: 152,
          format: 'PDF',
        },
        {
          id: 303,
          date: '2025-11-12',
          resultsCount: 148,
          format: 'CSV',
        },
        {
          id: 304,
          date: '2025-11-05',
          resultsCount: 145,
          format: 'PDF',
        },
      ],
    },
    {
      id: 4,
      name: 'Sacramento Investment Properties',
      location: 'Sacramento, CA',
      criteria: 'Multi-family, $300k-$600k',
      results: 73,
      createdAt: '2025-11-01',
      automated: false,
      filters: {
        address: '',
        city: 'Sacramento',
        state: 'CA',
        zipCode: '',
        radius: '',
        propertyType: 'Multi-family',
        beds: '',
        baths: '',
        minPrice: '300000',
        maxPrice: '600000',
        status: '',
        daysListed: '',
      },
      history: [
        {
          id: 401,
          date: '2025-11-01',
          resultsCount: 73,
          format: 'PDF',
        },
      ],
    },
  ]);

  // Handle incoming new report data
  useEffect(() => {
    if (newReportData) {
      setReports((prevReports) => {
        // Convert the new report data to the Report format
        const newId = prevReports.length > 0 ? Math.max(...prevReports.map((r) => r.id)) + 1 : 1;
        const today = new Date().toISOString().split('T')[0];
        
        // Generate unique history ID based on timestamp and random component
        const historyId = Date.now() + Math.floor(Math.random() * 10000);
        
        const newReport: Report = {
          id: newId,
          name: `${newReportData.location} Search`,
          location: newReportData.location,
          criteria: newReportData.criteriaDescription,
          results: newReportData.resultsCount,
          createdAt: today,
          automated: newReportData.isAutomated,
          filters: {
            address: newReportData.criteria.address || '',
            city: newReportData.criteria.city || '',
            state: newReportData.criteria.state || '',
            zipCode: newReportData.criteria.zip || '',
            radius: newReportData.criteria.radius || '',
            propertyType: newReportData.criteria.propertyType || '',
            beds: newReportData.criteria.bedrooms || '',
            baths: newReportData.criteria.bathrooms || '',
            minPrice: newReportData.criteria.minPrice || '',
            maxPrice: newReportData.criteria.maxPrice || '',
            status: newReportData.criteria.status || '',
            daysListed: newReportData.criteria.daysListed || '',
          },
          history: [
            {
              id: historyId,
              date: today,
              resultsCount: newReportData.resultsCount,
              format: 'CSV',
            },
          ],
        };

        // Open the modal with the new report
        setTimeout(() => onOpenReport(newReport, 'preferences', true), 0);
        
        // Add the new report to the top of the list
        return [newReport, ...prevReports];
      });
    }
  }, [newReportData, onOpenReport]);

  const toggleAutomation = (id: number) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === id ? { ...report, automated: !report.automated } : report
      )
    );
  };

  const handleEdit = (id: number) => {
    // Open the report in the details modal for editing
    const report = reports.find(r => r.id === id);
    if (report) {
      onOpenReport(report, 'preferences');
    }
  };

  const handleDuplicate = (id: number) => {
    setReports((prevReports) => {
      const reportToDuplicate = prevReports.find((r) => r.id === id);
      if (reportToDuplicate) {
        // Generate base timestamp for uniqueness
        const baseTimestamp = Date.now();
        
        // Generate new unique history IDs for the duplicated report
        const newHistory = reportToDuplicate.history.map((historyItem, index) => ({
          ...historyItem,
          id: baseTimestamp + (index * 1000) + Math.floor(Math.random() * 1000), // Ensure unique IDs
        }));
        
        const newId = prevReports.length > 0 ? Math.max(...prevReports.map((r) => r.id)) + 1 : 1;
        
        const newReport = {
          ...reportToDuplicate,
          id: newId,
          name: `${reportToDuplicate.name} (Copy)`,
          createdAt: new Date().toISOString().split('T')[0],
          automated: false,
          history: newHistory,
        };
        
        return [newReport, ...prevReports];
      }
      return prevReports;
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this report?')) {
      setReports((prev) => prev.filter((report) => report.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
      {/* Header - Tighter spacing */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-6 h-6 md:w-7 md:h-7 text-[#342e37]" />
          <h1 className="mb-0 text-2xl md:text-4xl font-bold text-[27px]">My Searches</h1>
        </div>
        <p className="text-gray-600 text-sm md:text-base">Manage your saved and automated searches</p>
      </div>

      {/* Reports List - Borderless design with hover states */}
      <div className="space-y-2">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white hover:bg-gray-50 rounded-lg p-3 md:p-4 cursor-pointer transition-colors group"
            onClick={() => onOpenReport(report)}
          >
            {/* Mobile-First Vertical Layout */}
            <div className="space-y-2">
              {/* Header Row: Title + Actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="font-bold text-base md:text-lg leading-snug break-words">{report.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Created {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Actions Menu - Mobile Friendly */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(report.id);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(report.id);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(report.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Location + Criteria - Stack on Mobile, Row on Desktop */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Location</span>
                  <p className="text-gray-900 break-words mt-0.5">{report.location}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Criteria</span>
                  <p className="text-gray-900 break-words mt-0.5">{report.criteria}</p>
                </div>
              </div>

              {/* Bottom Row: Results + Automation */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base md:text-lg text-[#342e37]">{report.results}</span>
                  <span className="text-xs text-gray-500">results</span>
                </div>
                
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-gray-600">Automated</span>
                  <Switch
                    checked={report.automated}
                    onCheckedChange={() => toggleAutomation(report.id)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}