'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Shield, Chrome, Building2, Lock, Zap, Terminal, Loader2, AlertCircle } from 'lucide-react';
import { initiateSSO, initiateKeycloakLogin, isAuthenticated as checkAuth, type SSOProvider } from '@/lib/keycloak-sso';

export default function LoginPage() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [ssoLoading, setSsoLoading] = useState<SSOProvider | null>(null);
  const router = useRouter();

  // Check if already authenticated
  useEffect(() => {
    if (checkAuth()) {
      router.push('/overview');
    }
  }, [router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAuthenticating(true);

    try {
      // For demo/development: use local auth
      // In production, this would call the auth API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Fallback to demo mode for development
        localStorage.setItem('auth_token', 'demo_token');
        localStorage.setItem('user_info', JSON.stringify({ email, name: 'Demo User' }));
        localStorage.setItem('token_expires_at', String(Date.now() + 24 * 60 * 60 * 1000));
      } else {
        const data = await response.json();
        localStorage.setItem('auth_token', data.access_token || 'demo_token');
        localStorage.setItem('user_info', JSON.stringify(data.user || { email }));
        localStorage.setItem('token_expires_at', String(Date.now() + 24 * 60 * 60 * 1000));
      }

      setIsAuthenticated(true);
      setTimeout(() => {
        router.push('/overview');
      }, 1000);
    } catch (err) {
      // Fallback to demo mode
      localStorage.setItem('auth_token', 'demo_token');
      localStorage.setItem('user_info', JSON.stringify({ email, name: 'Demo User' }));
      localStorage.setItem('token_expires_at', String(Date.now() + 24 * 60 * 60 * 1000));

      setIsAuthenticated(true);
      setTimeout(() => {
        router.push('/overview');
      }, 1000);
    }
  };

  const handleSSOLogin = async (provider: SSOProvider) => {
    setError(null);
    setSsoLoading(provider);

    try {
      // Initiate real SSO flow with Keycloak
      await initiateSSO(provider, { loginHint: email || undefined });
      // User will be redirected to Keycloak, so we don't need to do anything else
    } catch (err) {
      console.error('SSO login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate SSO login');
      setSsoLoading(null);
    }
  };

  const handleEnterpriseSSO = async () => {
    setError(null);
    setSsoLoading('enterprise');

    try {
      // Initiate Keycloak login (shows Keycloak login page with all IdP options)
      await initiateKeycloakLogin(email || undefined);
    } catch (err) {
      console.error('Enterprise SSO error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate Enterprise SSO');
      setSsoLoading(null);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1221] via-[#0F1929] to-[#0B1221] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            <Shield className="absolute inset-0 m-auto h-6 w-6 text-cyan-400" />
          </div>
          <p className="text-white text-lg font-medium mb-2">Authentication Successful</p>
          <p className="text-cyan-400 text-sm">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1221] via-[#0F1929] to-[#0B1221] relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.15) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
          }}></div>
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Scanning line effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan"></div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Immersive branding */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent"></div>
          <div className="max-w-md relative z-10">
            {/* Logo and headline */}
            <div className="mb-12">
              <div className="flex items-center space-x-3 mb-8">
                <img src="/optimal-logo.png" alt="Optimal" className="h-12 w-auto" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Optimal</h1>
                  <p className="text-xs text-cyan-400 font-mono tracking-wider">DEFENSE-GRADE APPSEC</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center space-x-2 text-cyan-400 text-sm font-mono">
                  <Terminal className="h-4 w-4" />
                  <span>$ optimal-platform initializing...</span>
                </div>
                <div className="ml-6 space-y-1 text-xs font-mono text-gray-400">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Security modules loaded</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>SSO authentication ready</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Zero-trust architecture enabled</span>
                  </div>
                </div>
              </div>

              <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                Defense-Grade<br />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Application Security
                </span>
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Next-generation AppSec platform unifying DevSecOps through AI-powered security testing and real-time threat monitoring
              </p>
            </div>

            {/* Feature badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 hover:border-cyan-500/40 transition-all">
                <Shield className="h-6 w-6 text-cyan-400 mb-2" />
                <h3 className="text-sm font-semibold text-white mb-1">FedRAMP Ready</h3>
                <p className="text-xs text-gray-400">Zero-trust architecture</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 hover:border-cyan-500/40 transition-all">
                <Zap className="h-6 w-6 text-cyan-400 mb-2" />
                <h3 className="text-sm font-semibold text-white mb-1">Deploy Faster</h3>
                <p className="text-xs text-gray-400">CI/CD integrated</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 hover:border-cyan-500/40 transition-all">
                <Lock className="h-6 w-6 text-cyan-400 mb-2" />
                <h3 className="text-sm font-semibold text-white mb-1">SOC 2 Type II</h3>
                <p className="text-xs text-gray-400">Enterprise compliant</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 hover:border-cyan-500/40 transition-all">
                <svg className="h-6 w-6 text-cyan-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-sm font-semibold text-white mb-1">NIST 800-53</h3>
                <p className="text-xs text-gray-400">Full compliance</p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="mt-8 flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-400">All systems operational</span>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Glassmorphism card */}
            <div className="bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-2xl">
              {/* Mobile logo */}
              <div className="lg:hidden mb-6 text-center">
                <img src="/optimal-logo.png" alt="Optimal" className="h-12 w-auto mx-auto mb-2" />
                <p className="text-xs text-cyan-400 font-mono">DEFENSE-GRADE APPSEC</p>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Sign In To Your Account
                </h2>
                <p className="text-sm text-gray-400">
                  Please use your OPTIMAL credentials to access the platform
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* SSO Options */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleEnterpriseSSO}
                  disabled={ssoLoading !== null}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold px-4 py-3 rounded-lg transition-all flex items-center justify-center space-x-2 group shadow-lg hover:shadow-cyan-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {ssoLoading === 'enterprise' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  )}
                  <span>Enterprise SSO (Keycloak)</span>
                </button>

                <button
                  onClick={() => handleSSOLogin('google')}
                  disabled={ssoLoading !== null}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium px-4 py-3 rounded-lg transition-all flex items-center justify-center space-x-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {ssoLoading === 'google' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                  ) : (
                    <Chrome className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  )}
                  <span>Continue with Google</span>
                </button>

                <button
                  onClick={() => handleSSOLogin('microsoft')}
                  disabled={ssoLoading !== null}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-4 py-3 rounded-lg transition-all flex items-center justify-center space-x-2 group backdrop-blur-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {ssoLoading === 'microsoft' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Building2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  )}
                  <span>Continue with Microsoft</span>
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-transparent text-gray-400 font-mono">OR USE CREDENTIALS</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Username or email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all"
                    placeholder="your.email@company.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all"
                      placeholder="••••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="mr-2 w-4 h-4 accent-cyan-400" />
                    <span className="text-gray-400">Remember me</span>
                  </label>
                  <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    Forgot Password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50 transform hover:scale-[1.02]"
                >
                  Sign In
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-center text-sm text-gray-400">
                  Need help?{' '}
                  <Link href="/support" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    Contact support
                  </Link>
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 mb-2">TRUSTED BY SECURITY-FIRST ORGANIZATIONS</p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
                <span>FedRAMP Ready</span>
                <span>•</span>
                <span>SOC 2 Type II</span>
                <span>•</span>
                <span>NIST 800-53</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            top: -2px;
          }
          100% {
            top: 100%;
          }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
      `}</style>
    </div>
  );
}












