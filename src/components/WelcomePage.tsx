import { Sparkles, TrendingUp, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useState } from 'react';

/**
 * WELCOME PAGE - POST-SIGNUP ONBOARDING
 * 
 * PURPOSE: First page after user signs up, sets expectations and guides next steps
 * 
 * USER FLOW:
 * Sign Up → Welcome Page → Quick Start Guide (optional) → Create First Report → Dashboard
 * 
 * BACKEND INTEGRATION:
 * - User data already stored from signup
 * - Optional: PATCH /api/users/onboarding-completed
 */

interface WelcomePageProps {
  userName: string;
  onContinue: () => void;
  onSkipToReport: () => void;
}

export function WelcomePage({ userName, onContinue, onSkipToReport }: WelcomePageProps) {
  const [selectedGoal, setSelectedGoal] = useState<string>('');

  const goals = [
    {
      id: 'track-listings',
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Track Listings',
      description: 'Monitor market trends',
    },
    {
      id: 'find-deals',
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Find Deals',
      description: 'Discover opportunities',
    },
    {
      id: 'automate-research',
      icon: <Clock className="w-6 h-6" />,
      title: 'Save Time',
      description: 'Automated alerts',
    },
  ];

  const handleContinue = () => {
    // TODO: Optional - Save user's goal to personalize experience
    // await fetch('/api/users/preferences', {
    //   method: 'PATCH',
    //   body: JSON.stringify({ primaryGoal: selectedGoal })
    // });
    
    onContinue();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ffd447]/10 to-white flex items-center justify-center p-4 px-[12px] py-[16px]">
      <div className="max-w-3xl w-full">
        
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ffd447] rounded-full mb-6">
            <Sparkles className="w-8 h-8 text-[#342e37]" />
          </div>
          
          <h1 className="font-bold text-[#342e37] mb-3 text-[33px]">
            Welcome to ListingBug, {userName}! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto text-[14px]">
            You're all set up with a <span className="font-medium text-[#342e37]">7-day free trial</span> of our Professional plan, 
            plus a <span className="font-medium text-[#342e37]">free month of extra reports</span> to help you learn the platform and find the best parameters for your business. 
            Let's get you started with your first market report.
          </p>
        </div>

        {/* What You Get */}
        <Card className="mb-8 border-2">
          <CardContent className="pt-[18px] pr-[18px] pb-[11px] pl-[18px] p-[18px]">
            <h2 className="font-bold text-[#342e37] mb-6 text-center text-[21px]">
              What You Get with Your Trial
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-medium text-[#342e37] mb-2 text-[18px]">50 Active Reports</h3>
                <p className="text-sm text-gray-600">Track up to 50 different market areas</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-[#342e37] mb-2 text-[18px]">100K Data Points</h3>
                <p className="text-sm text-gray-600">Comprehensive market intelligence</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-medium text-[#342e37] mb-2 text-[18px]">Automated Scheduling</h3>
                <p className="text-sm text-gray-600">Daily, weekly, or monthly updates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Note about Report Usage */}
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-[#342e37] mb-1">
                  📊 Understanding Report Limits
                </h3>
                <p className="text-[13px] text-gray-700">
                  Each query returning up to <strong>500 results</strong> counts as 1 report. Larger queries are paginated (501-1,000 = 2 reports, etc.). 
                  Use filters to narrow searches and maximize your allocation!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Goal Selection */}
        <div className="mb-8">
          <h2 className="font-bold text-[#342e37] mb-4 text-center text-[27px] pt-[18px] pr-[0px] pb-[0px] pl-[0px]">
            What's your main goal? (Optional)
          </h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Help us personalize your experience
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            {goals.map((goal) => (
              <Card
                key={goal.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedGoal === goal.id
                    ? 'border-2 border-[#342e37] bg-blue-50'
                    : 'border-2 border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedGoal(goal.id)}
              >
                <CardContent className="text-center pt-[16px] pr-[9px] pb-[24px] pl-[9px]">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    selectedGoal === goal.id ? 'bg-[#342e37] text-white' : 'bg-gray-100 text-[#342e37]'
                  }`}>
                    {goal.icon}
                  </div>
                  <h3 className="font-medium text-[#342e37] mb-1 font-bold text-[16px] break-words">{goal.title}</h3>
                  <p className="text-gray-600 text-[11px] break-words">{goal.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleContinue}
            className="gap-2 text-lg px-8 text-[18px]"
          >
            Take the Quick Tour
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={onSkipToReport}
            className="text-lg px-8 font-normal text-[15px]"
          >
            Search New Listings
          </Button>
        </div>

        {/* Trial Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 text-[12px]">
            Your trial ends in 7 days. No credit card required. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * USER JOURNEY MAPPING
 * 
 * STEP 1: Sign Up
 * - User creates account on SignUpPage
 * - Account created with Professional trial
 * - User logged in automatically
 * 
 * STEP 2: Welcome Page (This component)
 * - Shows what they get with trial
 * - Optional goal selection
 * - Choice: Quick tour or skip to report
 * 
 * STEP 3A: Quick Start Guide (if "Take the Quick Tour")
 * - 3-step interactive tutorial
 * - Shows key features
 * - Ends with "Create First Report" button
 * 
 * STEP 3B: New Report (if "Skip to Create Report")
 * - Goes directly to New Report wizard
 * - User creates first report
 * 
 * STEP 4: Dashboard
 * - User sees their first report
 * - Becomes active user
 * - Onboarding complete
 * 
 * WORKFLOW:
 * HomePage (CTA) → SignUpPage → WelcomePage → QuickStartGuidePage → NewReport → Dashboard
 *                                               ↓ (Skip)
 *                                           NewReport → Dashboard
 */