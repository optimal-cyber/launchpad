"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Shield, Zap, CheckCircle, ArrowRight, Chrome, Building2 } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [showSignUp, setShowSignUp] = useState(false);

  const handleSSOLogin = (provider: string) => {
    // In production, this would redirect to the actual SSO provider
    console.log(`Logging in with ${provider}`);
    // Auto-login: Immediately redirect to launchpad (simulating successful SSO)
    router.push('/launchpad');
  };

  const handleTryDemo = () => {
    // Populate demo data and go to onboarding
    fetch('/api/demo/populate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demo: true })
    }).then(() => {
      router.push('/onboarding');
    }).catch(() => {
      router.push('/onboarding');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="relative z-10 px-6 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/optimal-logo.png" alt="Optimal" className="h-10 w-auto" />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSignUp(true)}
              className="text-white hover:text-blue-300 px-4 py-2 text-sm font-medium transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowSignUp(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-600/20 border border-blue-500/40 rounded-full text-blue-200 text-sm font-medium mb-8">
            <Zap className="h-4 w-4 mr-2" />
            Developer Security Platform
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            Secure Software Delivery<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto">
            Connect with SSO, access integrated DevSecOps tools, and deploy secure applications faster. 
            Built for teams that need speed without compromising security.
          </p>

          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSignUp(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-4 rounded-lg text-lg transition-all hover:shadow-xl hover:shadow-blue-500/50 flex items-center space-x-2"
              >
                <span>Start Free Today</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={handleTryDemo}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all flex items-center space-x-2"
              >
                <Play className="h-5 w-5" />
                <span>Try Demo</span>
              </button>
            </div>
            <p className="text-sm text-slate-400">No credit card required • Sign up with SSO in seconds</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 px-6 py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Everything You Need in One Platform</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-500/50 transition-all">
              <div className="h-12 w-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Security First</h3>
              <p className="text-slate-300">
                Built-in vulnerability scanning, SBOM management, and compliance tracking. Meet security standards without slowing down.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-500/50 transition-all">
              <div className="h-12 w-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Deploy Faster</h3>
              <p className="text-slate-300">
                GitOps workflows, automated CI/CD pipelines, and Kubernetes-native deployment. Ship features, not friction.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-500/50 transition-all">
              <div className="h-12 w-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Simple SSO</h3>
              <p className="text-slate-300">
                Sign up with Google, Azure, or your enterprise IDP. One login for all your development tools.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-16">Get Started in Minutes</h2>
          
          <div className="space-y-12">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-white mb-2">Sign Up with SSO</h3>
                <p className="text-slate-300 text-lg">
                  Click "Get Started Free" and authenticate with your Google, Microsoft Azure, or enterprise identity provider. No forms, no friction.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-white mb-2">Access Your Dashboard</h3>
                <p className="text-slate-300 text-lg">
                  Instantly access integrated tools: GitLab, Harbor, Grafana, vulnerability scanning, SBOM analysis, and more.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-white mb-2">Deploy Securely</h3>
                <p className="text-slate-300 text-lg">
                  Connect your repos, run security scans, and deploy to Kubernetes. All services work together seamlessly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 px-6 py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Ship Secure Software Faster?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join teams using Launchpad to deploy with confidence. Start free, scale to Kubernetes when you're ready.
          </p>
          <button
            onClick={() => setShowSignUp(true)}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-10 py-4 rounded-lg text-lg transition-all hover:shadow-xl flex items-center space-x-2 mx-auto"
          >
            <span>Get Started Free</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400 text-sm">
            © 2025 Launchpad. Secure software delivery platform.
          </p>
        </div>
      </footer>

      {/* SSO Sign Up Modal */}
      {showSignUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowSignUp(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-8">
              <img src="/optimal-logo.png" alt="Optimal" className="h-16 w-auto mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Welcome to Launchpad</h2>
              <p className="text-slate-300">Sign up free with your existing account</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleSSOLogin('google')}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium px-6 py-4 rounded-lg transition-colors flex items-center justify-center space-x-3"
              >
                <Chrome className="h-5 w-5" />
                <span>Continue with Google</span>
              </button>

              <button
                onClick={() => handleSSOLogin('azure')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-4 rounded-lg transition-colors flex items-center justify-center space-x-3"
              >
                <Building2 className="h-5 w-5" />
                <span>Continue with Microsoft</span>
              </button>

              <button
                onClick={() => handleSSOLogin('enterprise')}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium px-6 py-4 rounded-lg transition-colors flex items-center justify-center space-x-3"
              >
                <Shield className="h-5 w-5" />
                <span>Enterprise SSO</span>
              </button>
            </div>

            <p className="text-center text-sm text-slate-400 mt-6">
              By signing up, you agree to our Terms of Service
            </p>

            <button
              onClick={() => setShowSignUp(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}