import { Search, Calendar, Download, ArrowRight, ArrowLeft, CheckCircle, Share2, Database } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useState, useEffect } from 'react';
import { useWalkthrough } from './WalkthroughContext';

/**
 * QUICK START GUIDE PAGE
 * 
 * PURPOSE: Interactive 3-step tutorial for first-time users
 * Shows key features and how to use the platform
 * After completion, triggers walkthrough for hands-on guidance
 * 
 * USER FLOW:
 * Welcome Page → Quick Start Guide (3 steps) → [START WALKTHROUGH] → Search → Automation → Integration
 */

interface QuickStartGuidePageProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function QuickStartGuidePage({ onComplete, onSkip }: QuickStartGuidePageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { startWalkthrough } = useWalkthrough();

  const steps = [
    {
      id: 'create-reports',
      icon: <Search className="w-12 h-12 text-[#342e37]" />,
      title: 'Create Custom Reports',
      description: 'Set up automated reports for any market you want to track',
      features: [
        'Search by city, state, or specific address',
        'Filter by property type, price, size, and more',
        'Get instant results matching your criteria',
        'Save time with smart filters',
      ],
      illustration: (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 border-2 border-blue-200 px-[18px] py-[32px]">
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-2">Location</div>
              <div className="font-medium text-[#342e37]">Austin, TX • 25 miles radius</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-2">Property Type</div>
              <div className="font-medium text-[#342e37]">Single Family, Townhouse</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-2">Price Range</div>
              <div className="font-medium text-[#342e37]">$300K - $600K</div>
            </div>
            <div className="bg-[#ffd447] text-[#342e37] rounded-lg p-4 text-center font-medium">
              127 Properties Found ✓
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'automate-tracking',
      icon: <Calendar className="w-12 h-12 text-[#342e37]" />,
      title: 'Automate Your Tracking',
      description: 'Schedule reports to run automatically and get email alerts',
      features: [
        'Set reports to run daily, weekly, or monthly',
        'Get email notifications for new matches',
        'Export data in CSV, Excel, or PDF format',
        'Never miss a hot listing again',
      ],
      illustration: (
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-8 border-2 border-purple-200">
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="font-medium text-[#342e37] mb-1">Report Schedule</div>
                <div className="text-sm text-gray-600">Runs every Monday at 9:00 AM</div>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-[#ffd447] rounded flex items-center justify-center">
                  <span className="font-bold text-[#342e37]">📧</span>
                </div>
                <div className="font-medium text-[#342e37]">Email Notifications: ON</div>
              </div>
              <div className="text-sm text-gray-600">
                You'll get an email when new properties match your criteria
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-2">Export Format</div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[#342e37] text-white rounded text-sm">CSV</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">Excel</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">PDF</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'export-and-integrate',
      icon: <Share2 className="w-12 h-12 text-[#342e37]" />,
      title: 'Export to Other Services',
      description: 'Your data works everywhere - export and integrate with your favorite tools',
      features: [
        'Export to CSV for Excel, Google Sheets, or any spreadsheet',
        'Connect to CRMs like HubSpot, Salesforce, and Zoho',
        'Sync with project management tools like Monday.com',
        'Import into your marketing automation platforms',
      ],
      illustration: (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-8 border-2 border-amber-200 px-[18px] py-[32px]">
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Download className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-[#342e37]">Export Report Data</span>
                </div>
                <span className="text-xs text-green-600 font-medium">Ready ✓</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">CSV</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">Excel</span>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">PDF</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-[#342e37]">Connect Your Tools</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="w-8 h-8 bg-orange-100 rounded mx-auto mb-1 flex items-center justify-center">
                    <Database className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-700">HubSpot</div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded mx-auto mb-1 flex items-center justify-center">
                    <Database className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-700">Salesforce</div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="w-8 h-8 bg-purple-100 rounded mx-auto mb-1 flex items-center justify-center">
                    <Database className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-700">Zoho</div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="w-8 h-8 bg-red-100 rounded mx-auto mb-1 flex items-center justify-center">
                    <Database className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-700">Monday</div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="w-8 h-8 bg-green-100 rounded mx-auto mb-1 flex items-center justify-center">
                    <Database className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-700">Mailchimp</div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded mx-auto mb-1 flex items-center justify-center">
                    <Database className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-700">Zapier</div>
                </div>
              </div>
            </div>

            <div className="bg-[#ffd447] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-[#342e37]" />
                <span className="font-medium text-[#342e37]">Your Data, Your Way</span>
              </div>
              <p className="text-sm text-[#342e37]">Use ListingBug data in your existing workflow - no lock-in, full control</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  // Scroll to top whenever the step changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      startWalkthrough();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-[#342e37] text-[33px]">Quick Start Guide</h1>
              <p className="text-sm text-gray-600 mt-1">
                Learn the basics in 3 simple steps
              </p>
            </div>
            <Button variant="ghost" onClick={onSkip} className="px-[18px] py-[8px] pt-[8px] pr-[0px] pb-[8px] pl-[18px]">
              Skip Tutorial
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`flex-1 h-2 rounded-full transition-all ${
                    index <= currentStep ? 'bg-[#ffd447]' : 'bg-gray-200'
                  }`}
                />
                {index < steps.length - 1 && <div className="w-2" />}
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-[18px] px-[32px]">
        <div className="max-w-5xl mx-auto">
          
          {/* Step Content */}
          <div className="text-center mb-[18px] mt-[0px] mr-[0px] ml-[0px]">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-4">
              {currentStepData.icon}
            </div>
            
            <h2 className="font-bold text-[#342e37] mb-2 text-[27px]">
              {currentStepData.title}
            </h2>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto text-[15px]">
              {currentStepData.description}
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-8 mb-[18px] mt-[0px] mr-[0px] ml-[0px]">
            
            {/* Features List */}
            <Card>
              <CardContent className="pt-[32px] pr-[18px] pb-[24px] pl-[18px]">
                <h3 className="font-bold text-[#342e37] mb-6 text-[21px]">Key Features:</h3>
                <div className="space-y-4">
                  {currentStepData.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-[14px]">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Visual Illustration */}
            <div>
              {currentStepData.illustration}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep ? 'bg-[#ffd447] w-6' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button onClick={handleNext} className="gap-2">
              {currentStep === steps.length - 1 ? 'Start Walkthrough' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Skip Link */}
          <div className="text-center mt-8">
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Skip and Search New Listings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * USAGE IN USER FLOW:
 * 
 * WelcomePage → "Take the Quick Tour" → QuickStartGuidePage → NewReport
 * 
 * This component:
 * - Shows 3 key features in sequence
 * - Has visual illustrations for each
 * - Allows going back/forward
 * - Can be skipped at any time
 * - Ends by directing to Create First Report
 * 
 * After this, user goes to NewReport wizard to create their first report,
 * then to Dashboard where they become an active user.
 */