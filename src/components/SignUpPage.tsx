import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Eye, EyeOff, Chrome, ArrowRight, Loader2 } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); onSignUp(); }, 1000);
  };

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
              <Button type="button" variant="outline" className="w-full flex items-center justify-center gap-3 h-11" onClick={onSignUp}>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="absolute right-3 top-3 text-gray-500 hover:text-gray-700" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Must be at least 8 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
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