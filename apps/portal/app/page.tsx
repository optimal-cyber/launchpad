"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Cpu, ArrowRight, Lock, User, Building2, Zap, Globe, Server, Layers, Database } from 'lucide-react';

export default function LandingPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to launchpad after 3 seconds
    const timer = setTimeout(() => {
      setIsRedirecting(true);
      router.push('/launchpad');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleGetStarted = () => {
    setIsRedirecting(true);
    router.push('/launchpad');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Cpu className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Optimal</h1>
              <p className="text-sm text-blue-200">DevSecOps Platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGetStarted}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-2 rounded-lg hover:bg-white/20 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-200 text-sm font-medium mb-6">
              <Zap className="h-4 w-4 mr-2" />
              OPTIMAL APPLICATION DELIVERY ENVIRONMENT
            </div>
            
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              ACCELERATE BUILDS,<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                DEPLOYMENT, AND MONITORING
              </span>
            </h1>
            
            <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
              The advanced development platform providing solutions in secure, cloud-native environments for optimal delivery.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                disabled={isRedirecting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isRedirecting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Redirecting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    GET STARTED
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </button>
              
              <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold py-4 px-8 rounded-lg hover:bg-white/20 transition-all duration-200">
                <div className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Watch Demo
                </div>
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
              <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Layers className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Cloud-Native</h3>
              <p className="text-blue-200 text-sm">Built for modern cloud environments with Kubernetes and microservices</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
              <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Database className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure by Design</h3>
              <p className="text-blue-200 text-sm">Enterprise-grade security with built-in vulnerability management</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
              <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">DevSecOps Ready</h3>
              <p className="text-blue-200 text-sm">Integrated CI/CD pipelines with security scanning and compliance</p>
            </div>
          </div>

          {/* Auto-redirect notice */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-200 text-sm">
              {isRedirecting ? 'Redirecting to dashboard...' : 'Auto-redirecting to dashboard in 3 seconds'}
            </p>
          </div>
        </div>
      </main>

        {/* Footer */}
        <footer className="relative z-10 p-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-blue-300 text-sm">
              © 2025 Optimal. All rights reserved. | 
              <span className="ml-2">Faster • Smarter • More Secure</span>
            </p>
          </div>
        </footer>
    </div>
  );
}