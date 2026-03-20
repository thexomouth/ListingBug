import { useState } from 'react';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { LBCard, LBCardHeader, LBCardTitle, LBCardContent } from './design-system/LBCard';
import { LBButton } from './design-system/LBButton';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';

interface RequestIntegrationPageProps {
  onBack?: () => void;
  isMember?: boolean;
}

export function RequestIntegrationPage({ onBack, isMember = false }: RequestIntegrationPageProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    integrationName: '',
    company: '',
    website: '',
    useCase: '',
    additionalDetails: '',
    email: '',
    name: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In production, this would send to an API
    console.log('Integration Request:', formData);
    
    setSubmitted(true);
    toast.success('Integration request submitted successfully!');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-[#342E37] mb-3">
              Request Received!
            </h1>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Thank you for your integration request. Our team will review it and get back to you within 2-3 business days.
            </p>
            {onBack && (
              <LBButton onClick={onBack} variant="primary">
                {isMember ? 'Back to Integrations' : 'Back to Home'}
              </LBButton>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-[#342E37] hover:text-[#342E37]/80 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          )}
          <h1 className="text-3xl font-bold text-[#342E37] mb-2">
            Request an Integration
          </h1>
          <p className="text-gray-600">
            Can't find the integration you need? Let us know! We prioritize requests from our community.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <LBCard elevation="sm" className="border-0">
            <LBCardHeader>
              <LBCardTitle>Integration Details</LBCardTitle>
            </LBCardHeader>
            <LBCardContent className="space-y-6">
              {/* Contact Information (for non-members) */}
              {!isMember && (
                <div className="pb-6 border-b border-gray-200">
                  <h3 className="font-bold text-[16px] text-[#342E37] mb-4">
                    Your Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="John Smith"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Integration Information */}
              <div>
                <h3 className="font-bold text-[16px] text-[#342E37] mb-4">
                  What integration would you like?
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="integrationName">Integration Name *</Label>
                    <Input
                      id="integrationName"
                      value={formData.integrationName}
                      onChange={(e) => handleChange('integrationName', e.target.value)}
                      placeholder="e.g., Follow Up Boss, Propertybase, kvCORE"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      What platform or service should we integrate with?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company/Provider</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleChange('company', e.target.value)}
                        placeholder="e.g., Real Estate CRM Inc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website URL</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="useCase">Use Case *</Label>
                    <Textarea
                      id="useCase"
                      value={formData.useCase}
                      onChange={(e) => handleChange('useCase', e.target.value)}
                      placeholder="Describe how you plan to use this integration. What problem will it solve?"
                      rows={4}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Help us understand your workflow and priorities
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="additionalDetails">Additional Details</Label>
                    <Textarea
                      id="additionalDetails"
                      value={formData.additionalDetails}
                      onChange={(e) => handleChange('additionalDetails', e.target.value)}
                      placeholder="Any specific features, data points, or automation scenarios you'd like us to consider?"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-sm text-blue-900 mb-2">
                  What happens next?
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Our team reviews your request within 2-3 business days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>We'll contact you to discuss feasibility and timeline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Popular requests are prioritized in our development roadmap</span>
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                {onBack && (
                  <LBButton
                    type="button"
                    variant="secondary"
                    onClick={onBack}
                  >
                    Cancel
                  </LBButton>
                )}
                <LBButton
                  type="submit"
                  variant="primary"
                  icon={Send}
                >
                  Submit Request
                </LBButton>
              </div>
            </LBCardContent>
          </LBCard>
        </form>
      </div>
    </div>
  );
}
