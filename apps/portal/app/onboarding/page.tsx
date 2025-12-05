'use client';

import { useState } from 'react';
import { Copy, Check, Terminal, Docker, Key, ArrowRight, Shield, Zap, Cloud, GitBranch, CheckCircle } from 'lucide-react';

type Step = 'welcome' | 'token' | 'install' | 'verify' | 'done';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [apiToken, setApiToken] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [installMethod, setInstallMethod] = useState<'docker' | 'script' | 'kubernetes'>('docker');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const generateToken = async () => {
    setIsGenerating(true);
    // Simulate API call to generate token
    await new Promise(resolve => setTimeout(resolve, 1500));
    const token = `opt_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiToken(token);
    setIsGenerating(false);
    setCurrentStep('token');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyConnection = async () => {
    setIsVerifying(true);
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 3000));
    setVerificationStatus('success');
    setIsVerifying(false);
    setCurrentStep('done');
  };

  const getInstallCommand = () => {
    const apiUrl = typeof window !== 'undefined' ? window.location.origin.replace('3000', '8000') : 'https://api.gooptimal.io';
    
    switch (installMethod) {
      case 'docker':
        return `docker run -d --name optimal-scanner \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  optimal/scanner:latest \\
  --api-url ${apiUrl} \\
  --token ${apiToken || 'YOUR_TOKEN'} \\
  --daemon --interval 300`;
      case 'script':
        return `curl -sSL https://get.gooptimal.io/scanner | bash -s -- ${apiToken || 'YOUR_TOKEN'}`;
      case 'kubernetes':
        return `helm install optimal-scanner optimal/scanner \\
  --set apiUrl=${apiUrl} \\
  --set apiToken=${apiToken || 'YOUR_TOKEN'} \\
  --namespace optimal-system \\
  --create-namespace`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Get Started with Optimal</h1>
          <p className="text-lg text-slate-300">
            Connect your infrastructure in minutes and start discovering vulnerabilities
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {['Generate Token', 'Install Agent', 'Verify', 'Complete'].map((label, idx) => {
            const steps: Step[] = ['welcome', 'token', 'install', 'verify', 'done'];
            const stepIndex = steps.indexOf(currentStep);
            const isCompleted = idx < stepIndex || (currentStep === 'done' && idx <= 3);
            const isCurrent = idx === stepIndex || (currentStep === 'token' && idx === 0);
            
            return (
              <div key={label} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted ? 'bg-teal-600 border-teal-600' :
                  isCurrent ? 'border-teal-500 text-teal-500' :
                  'border-slate-600 text-slate-600'
                }`}>
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <span className="text-sm font-medium">{idx + 1}</span>
                  )}
                </div>
                <span className={`ml-2 text-sm ${
                  isCompleted || isCurrent ? 'text-white' : 'text-slate-500'
                }`}>{label}</span>
                {idx < 3 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    isCompleted ? 'bg-teal-600' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-600/20 rounded-full mb-6">
                <Shield className="h-10 w-10 text-teal-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Welcome to Optimal Platform</h2>
              <p className="text-slate-300 mb-8 max-w-lg mx-auto">
                Let's set up your first vulnerability scanner. You'll be discovering security issues in your containers within minutes.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-900/50 rounded-lg p-4 text-left">
                  <Zap className="h-8 w-8 text-yellow-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">Fast Setup</h3>
                  <p className="text-sm text-slate-400">One command to install, immediate results</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 text-left">
                  <Cloud className="h-8 w-8 text-blue-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">Any Environment</h3>
                  <p className="text-sm text-slate-400">Docker, Kubernetes, CI/CD pipelines</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 text-left">
                  <GitBranch className="h-8 w-8 text-green-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">CI/CD Ready</h3>
                  <p className="text-sm text-slate-400">Integrate with GitLab, GitHub, Jenkins</p>
                </div>
              </div>

              <button
                onClick={generateToken}
                disabled={isGenerating}
                className="inline-flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Generating Token...</span>
                  </>
                ) : (
                  <>
                    <Key className="h-5 w-5" />
                    <span>Generate API Token</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Token Step */}
          {currentStep === 'token' && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <Key className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Your API Token</h2>
                  <p className="text-sm text-slate-400">Keep this secure - you won't see it again</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <code className="text-teal-400 font-mono text-lg">{apiToken}</code>
                  <button
                    onClick={() => copyToClipboard(apiToken)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-400" />
                    ) : (
                      <Copy className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-200 text-sm">
                  <strong>Important:</strong> Copy this token now. For security, we don't store it and can't show it again.
                </p>
              </div>

              <button
                onClick={() => setCurrentStep('install')}
                className="inline-flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                <span>Continue to Installation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Install Step */}
          {currentStep === 'install' && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Terminal className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Install the Scanner</h2>
                  <p className="text-sm text-slate-400">Choose your preferred installation method</p>
                </div>
              </div>

              {/* Installation Method Tabs */}
              <div className="flex space-x-2 mb-6">
                {[
                  { id: 'docker', label: 'Docker', icon: Docker },
                  { id: 'script', label: 'Quick Script', icon: Terminal },
                  { id: 'kubernetes', label: 'Kubernetes', icon: Cloud }
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setInstallMethod(method.id as typeof installMethod)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        installMethod === method.id
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Command Display */}
              <div className="bg-slate-900 rounded-lg overflow-hidden mb-6">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                  <span className="text-sm text-slate-400">
                    {installMethod === 'docker' && 'Docker Command'}
                    {installMethod === 'script' && 'Shell Script'}
                    {installMethod === 'kubernetes' && 'Helm Command'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(getInstallCommand())}
                    className="flex items-center space-x-1 text-sm text-teal-400 hover:text-teal-300"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-4 text-sm text-slate-300 overflow-x-auto">
                  <code>{getInstallCommand()}</code>
                </pre>
              </div>

              {/* Method-specific notes */}
              <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                {installMethod === 'docker' && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Docker Installation</h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Runs as a daemon, scanning every 5 minutes</li>
                      <li>• Mounts Docker socket to scan running containers</li>
                      <li>• Lightweight - uses minimal resources</li>
                    </ul>
                  </div>
                )}
                {installMethod === 'script' && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Quick Script</h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Installs the scanner CLI tool</li>
                      <li>• Works on Linux and macOS</li>
                      <li>• Requires Docker or Python 3.8+</li>
                    </ul>
                  </div>
                )}
                {installMethod === 'kubernetes' && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Kubernetes (Helm)</h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Deploys as a DaemonSet on all nodes</li>
                      <li>• Automatically scans all cluster containers</li>
                      <li>• Includes RBAC and service account setup</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep('token')}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep('verify')}
                  className="inline-flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  <span>I've Installed It</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Verify Step */}
          {currentStep === 'verify' && (
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                verificationStatus === 'success' ? 'bg-green-600/20' :
                verificationStatus === 'failed' ? 'bg-red-600/20' :
                'bg-blue-600/20'
              }`}>
                {isVerifying ? (
                  <div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full" />
                ) : verificationStatus === 'success' ? (
                  <CheckCircle className="h-10 w-10 text-green-400" />
                ) : (
                  <Shield className="h-10 w-10 text-blue-400" />
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                {isVerifying ? 'Checking Connection...' :
                 verificationStatus === 'success' ? 'Agent Connected!' :
                 'Verify Your Agent'}
              </h2>
              
              <p className="text-slate-300 mb-8 max-w-lg mx-auto">
                {isVerifying ? 'Looking for your scanner agent...' :
                 verificationStatus === 'success' ? 'Your scanner is connected and sending data.' :
                 'Click below to verify your scanner is connected and sending data.'}
              </p>

              {!isVerifying && verificationStatus === 'pending' && (
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setCurrentStep('install')}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={verifyConnection}
                    className="inline-flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    <span>Verify Connection</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep('done')}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Skip for Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Done Step */}
          {currentStep === 'done' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600/20 rounded-full mb-6">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">You're All Set!</h2>
              
              <p className="text-slate-300 mb-8 max-w-lg mx-auto">
                Your Optimal Platform is ready. Start exploring your vulnerability data.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
                <a
                  href="/vulnerabilities"
                  className="flex items-center space-x-3 p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors text-left"
                >
                  <Shield className="h-8 w-8 text-red-400" />
                  <div>
                    <h3 className="font-semibold text-white">View Vulnerabilities</h3>
                    <p className="text-sm text-slate-400">See discovered security issues</p>
                  </div>
                </a>
                <a
                  href="/hub"
                  className="flex items-center space-x-3 p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors text-left"
                >
                  <Cloud className="h-8 w-8 text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-white">Optimal Hub</h3>
                    <p className="text-sm text-slate-400">Manage your environments</p>
                  </div>
                </a>
              </div>

              <a
                href="/launchpad"
                className="inline-flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Need help? Check our{' '}
            <a href="/docs" className="text-teal-400 hover:text-teal-300">documentation</a>
            {' '}or{' '}
            <a href="mailto:support@gooptimal.io" className="text-teal-400 hover:text-teal-300">contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}

