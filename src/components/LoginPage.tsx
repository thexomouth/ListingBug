import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Chrome, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import patternBgLight from 'figma:asset/8435b26aaf23ac49cf6eeff1fe337b24fe375fb0.png';
import patternBgDark from 'figma:asset/b916b80137b1bd7badbcf865751a03133a7f7893.png';

interface LoginPageProps {
  onLogin: () => void;
  onNavigateToSignUp?: () => void;
  onNavigateToForgotPassword?: () => void;
  onNavigateToHelp?: () => void;
}

export function LoginPage({ onLogin, onNavigateToSignUp, onNavigateToForgotPassword, onNavigateToHelp }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      toast.success('Welcome back!');
      onLogin();
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-2 pt-4 pb-6 md:pt-0 md:pb-0 md:flex md:items-center md:justify-center relative">
      <div className="absolute inset-0 opacity-[0.33] dark:opacity-0 pointer-events-none" style={{ backgroundImage: `url(${patternBgLight})`, backgroundRepeat: 'repeat', backgroundSize: '600px' }} />
      <div className="absolute inset-0 opacity-0 dark:opacity-[0.12] pointer-events-none" style={{ backgroundImage: `url(${patternBgDark})`, backgroundRepeat: 'repeat', backgroundSize: '600px' }} />

      <div className="max-w-md md:max-w-lg mx-auto w-full relative z-10">
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl font-bold text-center">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Button type="button" variant="outline" className="w-full flex items-center justify-center gap-3 h-11" onClick={handleGoogleLogin}>
                <Chrome className="w-5 h-5" />
                Continue with Google
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
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-600 dark:text-[#EBF2FA]">
              Don't have an account?{' '}
              <button className="text-[#342e37] dark:text-white hover:underline text-[14px] underline" onClick={onNavigateToSignUp}>Sign up</button>
            </div>
            {onNavigateToForgotPassword && (
              <div className="mt-3 text-center text-sm text-gray-600 dark:text-[#EBF2FA]">
                Forgot your password?{' '}
                <button className="text-[#342e37] dark:text-white hover:underline text-[14px] underline" onClick={onNavigateToForgotPassword}>Reset password</button>
              </div>
            )}
          </CardContent>
        </Card>

        {onNavigateToHelp && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-[#EBF2FA]">
              Need help?{' '}<button className="text-[#342E37] dark:text-white hover:underline font-medium" onClick={onNavigateToHelp}>Contact Support</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}