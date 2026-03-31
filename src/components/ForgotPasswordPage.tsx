import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import patternBgLight from 'figma:asset/8435b26aaf23ac49cf6eeff1fe337b24fe375fb0.png';
import patternBgDark from 'figma:asset/b916b80137b1bd7badbcf865751a03133a7f7893.png';

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

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.thelistingbug.com/reset-password',
    });

    setIsLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] px-2 pt-4 pb-6 md:pt-0 md:pb-0 md:flex md:items-center md:justify-center relative">
        <div className="absolute inset-0 opacity-[0.33] dark:opacity-0 pointer-events-none" style={{ backgroundImage: `url(${patternBgLight})`, backgroundRepeat: 'repeat', backgroundSize: '600px' }} />
        <div className="absolute inset-0 opacity-0 dark:opacity-[0.12] pointer-events-none" style={{ backgroundImage: `url(${patternBgDark})`, backgroundRepeat: 'repeat', backgroundSize: '600px' }} />

        <div className="max-w-md md:max-w-lg mx-auto w-full relative z-10">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-center">Check Your Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-600 dark:text-[#EBF2FA] mb-2">
                  We've sent password reset instructions to:
                </p>
                <p className="font-medium text-[#342E37] dark:text-white mb-6">{email}</p>
                <p className="text-sm text-gray-500 dark:text-[#EBF2FA] mb-6">
                  If you don't see the email, check your spam folder or try again with a different email address.
                </p>
                <Button onClick={onNavigateToLogin} className="w-full">
                  Back to Login
                </Button>
              </div>

              <div className="mt-4 text-center text-sm text-gray-600 dark:text-[#EBF2FA]">
                <button className="text-[#342e37] dark:text-white hover:underline text-[14px] underline" onClick={() => setSuccess(false)}>
                  Didn't receive the email? Try again
                </button>
              </div>
            </CardContent>
          </Card>

          {onNavigateToContactSupport && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-[#EBF2FA]">
                Need help?{' '}
                <button className="text-[#342E37] dark:text-white hover:underline font-medium" onClick={onNavigateToContactSupport}>
                  Contact Support
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-2 pt-4 pb-6 md:pt-0 md:pb-0 md:flex md:items-center md:justify-center relative">
      <div className="absolute inset-0 opacity-[0.33] dark:opacity-0 pointer-events-none" style={{ backgroundImage: `url(${patternBgLight})`, backgroundRepeat: 'repeat', backgroundSize: '600px' }} />
      <div className="absolute inset-0 opacity-0 dark:opacity-[0.12] pointer-events-none" style={{ backgroundImage: `url(${patternBgDark})`, backgroundRepeat: 'repeat', backgroundSize: '600px' }} />

      <div className="max-w-md md:max-w-lg mx-auto w-full relative z-10">
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl font-bold text-center">Reset Your Password</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <p className="text-gray-600 dark:text-[#EBF2FA] mb-6 text-sm">
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="placeholder:text-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Send Reset Instructions'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-600 dark:text-[#EBF2FA]">
              <button className="flex items-center gap-1 mx-auto text-[#342e37] dark:text-white hover:underline text-[14px]" onClick={onNavigateToLogin}>
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>

        {onNavigateToContactSupport && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-[#EBF2FA]">
              Need help?{' '}
              <button className="text-[#342E37] dark:text-white hover:underline font-medium" onClick={onNavigateToContactSupport}>
                Contact Support
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
