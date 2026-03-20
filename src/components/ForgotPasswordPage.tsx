import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, ArrowLeft, Mail } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import headerLogo from 'figma:asset/507fab16b51ccf6be96c685cf4c76a6b2a4bb7b0.png';

/**
 * FORGOT PASSWORD PAGE
 * 
 * PURPOSE: Allow users to request a password reset email
 * 
 * BACKEND INTEGRATION:
 * - API Endpoint: POST /api/auth/forgot-password
 * - Request: { email: string }
 * - Response: { success: boolean, message: string }
 * 
 * FLOW:
 * 1. User enters email address
 * 2. Frontend validates email format
 * 3. POST to /api/auth/forgot-password
 * 4. Backend sends reset email with token
 * 5. Show success message to user
 * 6. User clicks link in email → ResetPasswordPage
 */

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
  onNavigateToContactSupport?: () => void;
}

export function ForgotPasswordPage({ onNavigateToLogin, onNavigateToContactSupport }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // BACKEND INTEGRATION:
      // Replace with actual API call
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to send reset email. Please try again.');
        return;
      }

      // Show success state
      setSuccess(true);
    } catch (err) {
      // For demo purposes, show success anyway
      // In production, handle actual errors
      console.log('Mock: Password reset email sent to:', email);
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <ImageWithFallback 
              src={headerLogo} 
              alt="ListingBug" 
              className="h-24 w-auto"
            />
          </div>

          {/* Success Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h1 className="font-bold text-2xl mb-3">Check Your Email</h1>
            <p className="text-gray-600 mb-6">
              We've sent password reset instructions to:
            </p>
            <p className="font-medium text-[#342E37] mb-6">{email}</p>
            <p className="text-sm text-gray-500 mb-6">
              If you don't see the email, check your spam folder or try again with a different email address.
            </p>

            <Button
              onClick={onNavigateToLogin}
              className="w-full bg-[#FFD447] hover:bg-[#FFD447]/90 text-[#342E37]"
            >
              Back to Login
            </Button>
          </div>

          {/* Resend Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setSuccess(false)}
              className="text-sm text-[#342E37] hover:underline"
            >
              Didn't receive the email? Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <ImageWithFallback 
            src={headerLogo} 
            alt="ListingBug" 
            className="h-24 w-auto"
          />
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          {/* Back Button */}
          <button
            onClick={onNavigateToLogin}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#342E37] mb-6 transition-colors"
            aria-label="Back to login"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          <h1 className="font-bold text-2xl mb-3 text-center">Reset Your Password</h1>
          <p className="text-gray-600 mb-6">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                  disabled={isLoading}
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'email-error' : undefined}
                />
              </div>
              {error && (
                <p id="email-error" className="text-sm text-red-600 mt-2" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#FFD447] hover:bg-[#FFD447]/90 text-[#342E37]"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>
          </form>
        </div>

        {/* Additional Help - Bottom Center */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <button className="text-[#342E37] hover:underline font-medium" onClick={onNavigateToContactSupport}>
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}