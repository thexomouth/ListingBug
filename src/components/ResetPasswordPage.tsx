import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { ImageWithFallback } from './figma/ImageWithFallback';
import headerLogo from 'figma:asset/8ecd87e74a3485372d37f4409e2e520687c69204.png';

/**
 * RESET PASSWORD PAGE
 * 
 * PURPOSE: Allow users to set a new password using reset token from email
 * 
 * BACKEND INTEGRATION:
 * - API Endpoint: POST /api/auth/reset-password
 * - Request: { token: string, password: string, confirmPassword: string }
 * - Response: { success: boolean, message: string }
 * 
 * TOKEN VALIDATION:
 * - Endpoint: GET /api/auth/verify-reset-token?token={token}
 * - Validates token is not expired and belongs to valid user
 * 
 * FLOW:
 * 1. User arrives from email link with token in URL
 * 2. Frontend extracts token from URL params
 * 3. Validate token with backend
 * 4. If valid, show password reset form
 * 5. If invalid/expired, show error with option to request new link
 * 6. User enters and confirms new password
 * 7. POST to /api/auth/reset-password
 * 8. On success, redirect to login with success message
 */

interface ResetPasswordPageProps {
  token?: string; // Token from URL params
  onNavigateToLogin: () => void;
  onNavigateToForgotPassword: () => void;
}

export function ResetPasswordPage({ 
  token, 
  onNavigateToLogin, 
  onNavigateToForgotPassword 
}: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid reset link. Please request a new password reset.');
        setIsVerifyingToken(false);
        return;
      }

      try {
        // BACKEND INTEGRATION:
        // Replace with actual API call
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'This reset link has expired. Please request a new one.');
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch (err) {
        // For demo purposes, assume token is valid
        console.log('Mock: Token verification for:', token);
        setTokenValid(true);
      } finally {
        setIsVerifyingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || 'Invalid password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // BACKEND INTEGRATION:
      // Replace with actual API call
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          password, 
          confirmPassword 
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to reset password. Please try again.');
        return;
      }

      // Show success state
      setSuccess(true);
    } catch (err) {
      // For demo purposes, show success anyway
      // In production, handle actual errors
      console.log('Mock: Password reset successful for token:', token);
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while verifying token
  if (isVerifyingToken) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <ImageWithFallback 
            src={headerLogo} 
            alt="ListingBug" 
            className="h-24 w-auto mx-auto mb-8"
          />
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="w-16 h-16 border-4 border-[#FFD447] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <ImageWithFallback 
              src={headerLogo} 
              alt="ListingBug" 
              className="h-24 w-auto"
            />
          </div>

          <div className="bg-white border border-red-200 rounded-lg p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="font-bold text-2xl mb-3">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              {error || 'This password reset link has expired or is invalid.'}
            </p>

            <Button
              onClick={onNavigateToForgotPassword}
              className="w-full bg-[#FFD447] hover:bg-[#FFD447]/90 text-[#342E37] mb-3"
            >
              Request New Reset Link
            </Button>

            <Button
              onClick={onNavigateToLogin}
              variant="outline"
              className="w-full"
            >
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
            <ImageWithFallback 
              src={headerLogo} 
              alt="ListingBug" 
              className="h-24 w-auto"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h1 className="font-bold text-2xl mb-3">Password Reset Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been updated. You can now sign in with your new password.
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

  // Reset password form
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
          <h1 className="font-bold text-2xl mb-3 text-center">Set New Password</h1>
          <p className="text-gray-600 mb-6">
            Please enter your new password below.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Input */}
            <div>
              <Label htmlFor="password">
                New Password <span className="text-red-500">*</span>
              </Label>
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
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby="password-requirements"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p id="password-requirements" className="text-xs text-gray-500 mt-2">
                Must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <Label htmlFor="confirmPassword">
                Confirm New Password <span className="text-red-500">*</span>
              </Label>
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
                  aria-required="true"
                  aria-invalid={!!error}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#FFD447] hover:bg-[#FFD447]/90 text-[#342E37]"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            onClick={onNavigateToLogin}
            className="text-sm text-gray-600 hover:text-[#342E37]"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}