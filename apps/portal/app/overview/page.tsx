'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, TrendingUp, AlertTriangle, Package, Radio, Brain, GitBranch, Archive, BarChart3, CheckCircle, ArrowRight, Zap } from 'lucide-react';

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border-subtle)]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}></div>
        </div>
        
        <div className="relative z-10 px-8 py-20 max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 rounded-full text-[var(--accent-cyan)] text-sm font-medium mb-8">
              <CheckCircle className="h-4 w-4 mr-2" />
              ENTERPRISE DEVSECOPS PLATFORM
            </div>
            
            <h1 className="text-5xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
              Accelerate Deployment,<br />
              Enhance Security, Ensure Compliance
            </h1>
            
            <p className="text-xl text-[var(--text-secondary)] mb-10 leading-relaxed">
              The comprehensive platform providing solutions for secure development, deployment, and monitoring in cloud-native environments
            </p>

            <div className="flex justify-center space-x-4">
              <Link 
                href="/launchpad"
                className="enterprise-btn enterprise-btn-primary px-8 py-3 text-base font-semibold"
              >
                <span>Go to Launch Pad</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/onboarding"
                className="enterprise-btn enterprise-btn-secondary px-8 py-3 text-base font-semibold"
              >
                <Zap className="h-4 w-4" />
                <span>Quick Start Guide</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="px-8 py-20 bg-[var(--bg-void)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] text-center mb-4">
            DELIVER FASTER
          </h2>
          <p className="text-center text-[var(--text-secondary)] mb-16 max-w-3xl mx-auto">
            Accelerated development and deployment enables teams to rapidly deliver critical capabilities, ensuring mission success
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/10 rounded-full mb-4 relative">
                <div className="absolute inset-0 rounded-full border-2 border-purple-500/30"></div>
                <Shield className="h-10 w-10 text-purple-400" />
      </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">REQUIREMENT<br/>GATHERING</h3>
              <p className="text-sm text-[var(--text-muted)]">Consolidate and prioritize requirements from all stakeholders</p>
      </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-4 relative">
                <div className="absolute inset-0 rounded-full border-2 border-green-500/30"></div>
                <GitBranch className="h-10 w-10 text-green-400" />
                      </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">PRODUCTION</h3>
              <p className="text-sm text-[var(--text-muted)]">Develop with GitOps workflows and automated CI/CD pipelines</p>
                    </div>
                    
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-full mb-4 relative">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/30"></div>
                <CheckCircle className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">TESTING</h3>
              <p className="text-sm text-[var(--text-muted)]">Automated security scanning and vulnerability assessment</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-500/10 rounded-full mb-4 relative">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30"></div>
                <BarChart3 className="h-10 w-10 text-cyan-400" />
                    </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">MONITORING</h3>
              <p className="text-sm text-[var(--text-muted)]">Real-time observability and compliance tracking</p>
                    </div>
                  </div>
                  
          {/* Workflow visualization */}
          <div className="mt-16 relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-green-500 via-blue-500 to-cyan-500 opacity-30"></div>
            <div className="relative flex justify-between items-center">
              {['Scan', 'Package', 'Continuous Integration', 'Continuous Delivery', 'Generate', 'Lift'].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-[var(--bg-surface)] border-2 border-[var(--accent-cyan)] rounded-full flex items-center justify-center mb-2">
                    <div className="w-3 h-3 bg-[var(--accent-cyan)] rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="px-8 py-20 max-w-7xl mx-auto border-b border-[var(--border-subtle)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-6">
              ACCELERATE DEPLOYMENT WITH<br />
              SECURE, APPROVED CLOUD INFRASTRUCTURE
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">
              A secure, cloud-optimized solution that leverages an authorized environment to accelerate deployment while minimizing security and compliance issues.
            </p>

            <div className="space-y-4">
              <div className="enterprise-card p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-[var(--accent-cyan)]/10 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-[var(--accent-cyan)]" />
                    </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">Deploy Products Faster</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Pre-configured infrastructure and automated pipelines reduce deployment time from weeks to hours
                    </p>
                  </div>
                </div>
                  </div>
                  
              <div className="enterprise-card p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">Support When You Need It</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      24/7 platform support and security expertise to ensure mission-critical operations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="enterprise-card p-8 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-elevated)]">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Shield, label: 'Security', color: 'red' },
                  { icon: Package, label: 'SBOM', color: 'blue' },
                  { icon: AlertTriangle, label: 'Vulnerabilities', color: 'yellow' },
                  { icon: BarChart3, label: 'Monitoring', color: 'green' },
                  { icon: GitBranch, label: 'CI/CD', color: 'purple' },
                  { icon: Archive, label: 'Registry', color: 'cyan' }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="bg-[var(--bg-base)]/50 rounded-lg p-4 hover:bg-[var(--bg-hover)] transition-colors">
                      <Icon className={`h-8 w-8 text-${item.color}-400 mb-2`} />
                      <div className="text-sm font-medium text-[var(--text-primary)]">{item.label}</div>
                    </div>
                  );
                })}
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monitoring & Compliance */}
      <section className="px-8 py-20 bg-[var(--bg-void)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] text-center mb-4">
            MONITORING AND COMPLIANCE SIMPLIFIED
          </h2>
          <p className="text-center text-[var(--text-secondary)] mb-16 max-w-3xl mx-auto">
            Advanced CI/CD pipeline integrates continuous compliance, proactively monitoring to ensure products stay compliant. Automated scans identify vulnerabilities, while robust oversight capabilities prevent their recurrence.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="enterprise-card p-8">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
              <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Identify Vulnerabilities</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Continuous scanning across container images, dependencies, and infrastructure
              </p>
            </div>
          </div>

              <div className="grid grid-cols-4 gap-2">
                {['Critical', 'High', 'Medium', 'Low'].map((severity, idx) => (
                  <div key={idx} className="text-center p-3 bg-[var(--bg-base)] rounded-lg">
                    <div className={`text-2xl font-mono font-bold mb-1 ${
                      severity === 'Critical' ? 'text-red-400' :
                      severity === 'High' ? 'text-orange-400' :
                      severity === 'Medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {idx === 0 ? '7' : idx === 1 ? '23' : idx === 2 ? '86' : '109'}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">{severity}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="enterprise-card p-8">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Providing Oversight</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Real-time dashboards and automated compliance reporting for stakeholders
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Compliance Score', value: '94%', color: 'green' },
                  { label: 'Active Agents', value: '6/6', color: 'cyan' },
                  { label: 'Last Scan', value: '2m ago', color: 'blue' }
                ].map((metric, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-base)] rounded-lg">
                    <span className="text-sm text-[var(--text-secondary)]">{metric.label}</span>
                    <span className={`text-sm font-mono font-semibold text-${metric.color}-400`}>
                      {metric.value}
                    </span>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-8 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-6">
          Ready to Transform Your Development Workflow?
        </h2>
        <p className="text-lg text-[var(--text-secondary)] mb-10">
          Access all integrated tools and services from a single platform. Deploy with confidence, monitor with clarity.
        </p>
        
        <Link 
          href="/launchpad"
          className="enterprise-btn enterprise-btn-primary px-10 py-4 text-lg font-semibold inline-flex items-center"
        >
          <span>Launch Platform</span>
          <ArrowRight className="h-5 w-5 ml-2" />
        </Link>
      </section>
    </div>
  );
}
