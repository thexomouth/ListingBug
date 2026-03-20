import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Chrome, Apple, HelpCircle } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in real app this would validate credentials
    onLogin();
  };

  const handleSocialLogin = (provider: string) => {
    // Mock social login - in real app this would use OAuth
    console.log(`🔐 Sign in with ${provider}`);
    onLogin();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-2 pt-4 pb-6 md:pt-0 md:pb-0 md:flex md:items-center md:justify-center relative">
      {/* Background Pattern - Light Mode */}
      <div 
        className="absolute inset-0 opacity-[0.33] dark:opacity-0 pointer-events-none"
        style={{
          backgroundImage: `url(${patternBgLight})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '600px'
        }}
      />
      
      {/* Background Pattern - Dark Mode */}
      <div 
        className="absolute inset-0 opacity-0 dark:opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: `url(${patternBgDark})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '600px'
        }}
      />
      
      <div className="max-w-md md:max-w-lg mx-auto w-full relative z-10">
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl font-bold text-center">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Social Sign In Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-11"
                onClick={() => handleSocialLogin('Google')}
              >
                <Chrome className="w-5 h-5" />
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-11 bg-black text-white hover:bg-gray-800 hover:text-white border-black"
                onClick={() => handleSocialLogin('Apple')}
              >
                <Apple className="w-5 h-5" />
                Continue with Apple
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-11 bg-[#1877F2] text-white hover:bg-[#1565C0] hover:text-white border-[#1877F2]"
                onClick={() => handleSocialLogin('Facebook')}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-[#0F1115] text-gray-500 dark:text-[#EBF2FA]">Or continue with email</span>
              </div>
            </div>

            {/* Email Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-600 dark:text-[#EBF2FA]">
              Don't have an account?{' '}
              <button className="text-[#342e37] dark:text-white hover:underline text-[14px] underline" onClick={onNavigateToSignUp}>
                Sign up
              </button>
            </div>
            {onNavigateToForgotPassword && (
              <div className="mt-3 text-center text-sm text-gray-600 dark:text-[#EBF2FA]">
                Forgot your password?{' '}
                <button 
                  className="text-[#342e37] dark:text-white hover:underline text-[14px] underline" 
                  onClick={onNavigateToForgotPassword}
                  aria-label="Reset your password"
                >
                  Reset password
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section - Bottom Center */}
        {onNavigateToHelp && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-[#EBF2FA]">
              Need help?{' '}
              <button className="text-[#342E37] dark:text-white hover:underline font-medium" onClick={onNavigateToHelp}>
                Contact Support
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}