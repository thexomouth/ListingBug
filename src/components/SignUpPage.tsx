import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Eye, EyeOff, Chrome, ArrowRight, Loader2, AlertCircle, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import patternBgLight from 'figma:asset/8435b26aaf23ac49cf6eeff1fe337b24fe375fb0.png';
import patternBgDark from 'figma:asset/b916b80137b1bd7badbcf865751a03133a7f7893.png';

interface SignUpPageProps {
  onSignUp: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToHelp?: () => void;
}

export function SignUpPage({ onSignUp, onNavigateToLogin, onNavigateToHelp }: SignUpPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` }
    });

    if (error?.message) {
      setError(error.message);
      setIsSubmitting(false);
    } else {
      // Store browser fingerprint to detect trial abuse
      try {
        const fp = [navigator.userAgent, navigator.language, screen.width + 'x' + screen.height, Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.hardwareConcurrency].join('|');
        const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fp));
        const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
        await supabase.from('signup_fingerprints').insert({ user_id: data?.user?.id, fingerprint_hash: hash });
      } catch {}
      // Google Ads conversion tracking — Sign-up
      try {
        (window as any).gtag?.('event', 'conversion', {
          send_to: 'AW-18050632133/_BUTCLKOmpIcEMWTm59D',
          value: 1.0,
          currency: 'USD',
        });
      } catch {}
      toast.success('Account created! Check your email to confirm your account.');
      setIsSubmitting(false);
      setIsVerificationStep(true);
      setResendMessage('');
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
    });
    if (error) { toast.error(error.message); setIsGoogleLoading(false); }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage('');

    const { error } = await supabase.auth.resend({ type: 'signup', email });

    if (error) {
      setResendMessage('Failed to resend verification email. Please try again.');
      toast.error(error.message);
    } else {
      setResendMessage(`Verification email resent to ${email}.`);
      toast.success('Verification email resent.');
    }

    setIsResending(false);
  };

  if (isVerificationStep) {
    return (
      <div className="min-h-[calc(100vh-4rem)] px-4 pt-8 pb-12 md:pt-0 md:pb-0 md:flex md:items-center md:justify-center relative">
        <div className="max-w-md md:max-w-lg mx-auto w-full relative z-10">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">Confirm your email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-full bg-[#FFCE0A]/30 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-[#342e37]" />
                </div>
                <p className="text-gray-700 dark:text-gray-200">
                  We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Didn&apos;t get it? Check your spam folder or
                  <button onClick={handleResendVerification} className="ml-2 underline font-medium text-[#342e37] dark:text-white">
                    Resend email
                  </button>
                </p>
                {resendMessage && <p className="text-sm text-gray-600 dark:text-gray-300">{resendMessage}</p>}
                <Button variant="outline" className="w-full" onClick={onNavigateToLogin}>
                  Back to sign in
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 pt-8 pb-12 md:pt-0 md:pb-0 md:flex md:items-center md:justify-center relative">
      <div className="absolute inset-0 opacity-[0.24] dark:opacity-0 pointer-events-none" style={{ backgroundImage: `url(${patternBgLight})`, backgroundRepeat: 'repeat', backgroundSize: '600px' }} />
      <div className="absolute inset-0 opacity-0 dark:opacity-[0.24] pointer-events-none" style={{ backgroundImage: `url(${patternBgDark})`, backgroundRepeat: 'repeat', backgroundSize: '600px' }} />

      <div className="max-w-md md:max-w-lg mx-auto w-full relative z-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Button type="button" variant="outline" disabled={isGoogleLoading} className="w-full flex items-center justify-center gap-3 h-11 active:scale-[0.97] transition-transform" onClick={handleGoogleSignUp}>
                {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5" />}
                {isGoogleLoading ? 'Redirecting…' : 'Continue with Google'}
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-white/10"></div></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-[#0F1115] text-gray-500 dark:text-[#EBF2FA]">Or continue with email</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" autoComplete="email" placeholder="you@example.com" className="placeholder:text-gray-400" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="placeholder:text-gray-400" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="absolute right-3 top-3 text-gray-500 hover:text-gray-700" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Must be at least 8 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password" className="placeholder:text-gray-400" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  <button type="button" className="absolute right-3 top-3 text-gray-500 hover:text-gray-700" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</>) : (<>Create Account<ArrowRight className="w-4 h-4 ml-2" /></>)}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-[#EBF2FA]">
              Already have an account?{' '}
              <button className="font-medium text-[#342e37] dark:text-white hover:underline" onClick={onNavigateToLogin}>Sign in</button>
            </div>
          </CardContent>
        </Card>

        {onNavigateToHelp && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-[#b5bdca]">
              Need help?{' '}<button className="hover:underline font-medium text-[#342e37] dark:text-white" onClick={onNavigateToHelp}>Contact Support</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}