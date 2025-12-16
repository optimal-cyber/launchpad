'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
  retrievePKCEParams,
  exchangeCodeForTokens,
  storeAuthData,
  isSSORFlowExpired,
} from '@/lib/keycloak-sso';

export const dynamic = 'force-dynamic';

type Step = 'pending' | 'loading' | 'complete' | 'error';

interface AuthSteps {
  auth: Step;
  verify: Step;
  load: Step;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Authenticating...');
  const [steps, setSteps] = useState<AuthSteps>({
    auth: 'loading',
    verify: 'pending',
    load: 'pending',
  });

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get OAuth parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth errors from Keycloak
        if (errorParam) {
          throw new Error(errorDescription || `OAuth error: ${errorParam}`);
        }

        if (!code) {
          throw new Error('Missing authorization code');
        }

        // Check if SSO flow has expired
        if (isSSORFlowExpired()) {
          throw new Error('SSO session expired. Please try again.');
        }

        // Retrieve stored PKCE parameters
        const { codeVerifier, state: storedState, provider } = retrievePKCEParams();

        // Validate state parameter to prevent CSRF attacks
        if (state && storedState && state !== storedState) {
          throw new Error('Invalid state parameter. Possible CSRF attack.');
        }

        // Mark auth step as complete
        setSteps((s) => ({ ...s, auth: 'complete' }));
        setStatus('Exchanging tokens...');
        setSteps((s) => ({ ...s, verify: 'loading' }));

        // Exchange authorization code for tokens
        if (codeVerifier) {
          // Full PKCE flow
          const tokenData = await exchangeCodeForTokens(code, codeVerifier);

          // Store authentication data
          storeAuthData({
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            expiresIn: tokenData.expiresIn,
            userInfo: tokenData.userInfo,
          });

          setSteps((s) => ({ ...s, verify: 'complete' }));
        } else {
          // Fallback: No PKCE verifier (shouldn't happen, but handle gracefully)
          // Call API without code verifier
          const response = await fetch('/api/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Token exchange failed');
          }

          const tokenData = await response.json();

          // Store authentication data
          localStorage.setItem('auth_token', tokenData.access_token);
          localStorage.setItem('refresh_token', tokenData.refresh_token || '');
          localStorage.setItem('user_info', JSON.stringify(tokenData.user_info || {}));
          localStorage.setItem(
            'token_expires_at',
            String(Date.now() + (tokenData.expires_in || 3600) * 1000)
          );

          setSteps((s) => ({ ...s, verify: 'complete' }));
        }

        setStatus('Loading platform...');
        setSteps((s) => ({ ...s, load: 'loading' }));

        // Brief delay to show success state
        await new Promise((resolve) => setTimeout(resolve, 500));

        setSteps((s) => ({ ...s, load: 'complete' }));

        // Redirect to Launch Pad after SSO login
        router.push('/launchpad');
      } catch (err) {
        console.error('Authentication error:', err);
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setError(message);

        // Update steps to show error state
        setSteps((s) => ({
          auth: s.auth === 'complete' ? 'complete' : 'error',
          verify: s.verify === 'complete' ? 'complete' : 'error',
          load: 'error',
        }));

        // Redirect back to login after delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  const getStepIcon = (step: Step) => {
    switch (step) {
      case 'complete':
        return (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle className="w-3.5 h-3.5 text-white" />
          </div>
        );
      case 'loading':
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
      case 'error':
        return (
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <XCircle className="w-3.5 h-3.5 text-white" />
          </div>
        );
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-600" />;
    }
  };

  const getStepTextColor = (step: Step) => {
    switch (step) {
      case 'complete':
        return 'text-green-400';
      case 'loading':
        return 'text-cyan-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-500';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1221] via-[#0F1929] to-[#0B1221] flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Failed</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>

          {/* Progress bar */}
          <div className="mt-4 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-3000"
              style={{
                animation: 'shrink 3s linear forwards',
              }}
            />
          </div>

          <style jsx>{`
            @keyframes shrink {
              from {
                width: 100%;
              }
              to {
                width: 0%;
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1221] via-[#0F1929] to-[#0B1221] flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.15) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <div
            className="absolute inset-2 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1s' }}
          />
          <Shield className="absolute inset-0 m-auto h-6 w-6 text-cyan-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Secure Sign-In</h2>
        <p className="text-gray-400 mb-6">{status}</p>

        {/* Progress steps */}
        <div className="space-y-3 text-left">
          <div className="flex items-center space-x-3">
            {getStepIcon(steps.auth)}
            <span className={`text-sm ${getStepTextColor(steps.auth)}`}>
              Keycloak authentication
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {getStepIcon(steps.verify)}
            <span className={`text-sm ${getStepTextColor(steps.verify)}`}>
              Verifying credentials
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {getStepIcon(steps.load)}
            <span className={`text-sm ${getStepTextColor(steps.load)}`}>
              Loading platform
            </span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-gray-500">Protected by Keycloak SSO with PKCE</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#0B1221] via-[#0F1929] to-[#0B1221] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-white">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
