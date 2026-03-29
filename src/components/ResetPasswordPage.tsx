import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { supabase } from '../lib/supabase';
import headerLogo from 'figma:asset/8ecd87e74a3485372d37f4409e2e520687c69204.png';

interface ResetPasswordPageProps {
  token?: string;
  onNavigateToLogin: () => void;
  onNavigateToForgotPassword: () => void;
}

export function ResetPasswordPage({
  onNavigateToLogin,
  onNavigateToForgotPassword,
}: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if Supabase has a valid recovery session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }
  };

  // Still checking session
  if (hasSession === null) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <ImageWithFallback src={headerLogo} alt="ListingBug" className="h-24 w-auto mx-auto mb-8" />
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="w-16 h-16 border-4 border-[#FFD447] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // No valid session — link expired or already used
  if (!hasSession) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <ImageWithFallback src={headerLogo} alt="ListingBug" className="h-24 w-auto" />
          </div>
          <div className="bg-white border border-red-200 rounded-lg p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="font-bold text-2xl mb-3">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              This password reset link has expired or has already been used.
            </p>
            <Button
              onClick={onNavigateToForgotPassword}
              className="w-full bg-[#FFD447] hover:bg-[#FFD447]/90 text-[#342E37] mb-3"
            >
              Request New Reset Link
            </Button>
            <Button onClick={onNavigateToLogin} variant="outline" className="w-full">
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <ImageWithFallback src={headerLogo} alt="ListingBug" className="h-24 w-auto" />
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="font-bold text-2xl mb-3">Password Updated!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <Button
              onClick={onNavigateToLogin}
              className="w-full bg-[#FFD447] hover:bg-[#FFD447]/90 text-[#342E37]"
            >
              Continue to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <ImageWithFallback src={headerLogo} alt="ListingBug" className="h-24 w-auto" />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <h1 className="font-bold text-2xl mb-2 text-center">Set New Password</h1>
          <p className="text-gray-600 mb-6 text-center">Enter your new password below.</p>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password">New Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pl-10 pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#FFD447] hover:bg-[#FFD447]/90 text-[#342E37] font-bold"
              disabled={isLoading}
            >
              {isLoading ? 'Updating Password...' : 'Reset Password'}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button onClick={onNavigateToLogin} className="text-sm text-gray-600 hover:text-[#342E37]">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
