import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const testimonials = [
  {
    quote: "We went from 3 weeks of security review to same-day deployments. Optimal just handles it.",
    author: "Platform Engineering Lead",
    company: "Fortune 500 Financial Services",
    metric: "95%",
    metricLabel: "faster deployments"
  },
  {
    quote: "Our auditors were impressed. Every compliance question had a built-in answer.",
    author: "CISO",
    company: "Healthcare Technology Company",
    metric: "100%",
    metricLabel: "audit pass rate"
  },
  {
    quote: "No more chasing developers about security fixes. Policies enforce themselves.",
    author: "Security Architect",
    company: "Defense Contractor",
    metric: "Zero",
    metricLabel: "manual interventions"
  },
];

const personas = [
  {
    role: "Platform Teams",
    headline: "Stop being the bottleneck",
    description: "Your developers want to ship. Security wants to block. You're stuck in the middle. Optimal gives you guardrails that work—deploy confidently without playing traffic cop.",
    benefits: ["Self-service deployments with built-in policies", "No more tickets for security approvals", "Works in any environment: cloud, on-prem, airgap"],
  },
  {
    role: "Security Teams",
    headline: "Enforcement without friction",
    description: "You're tired of being the 'no' department. Tired of chasing engineers. Tired of audit season panic. Optimal embeds security into the platform—it just works.",
    benefits: ["Kyverno policies block bad deploys automatically", "Falco catches threats in real-time", "Continuous scanning, not point-in-time audits"],
  },
  {
    role: "Leadership",
    headline: "Sleep better at night",
    description: "Compliance deadlines. Board questions. Breach headlines. You need a platform that handles security by default, with proof to back it up.",
    benefits: ["Automatic SBOM generation for every release", "Built-in compliance for FedRAMP, NIST, DoD IL", "Complete audit trail, always ready"],
  },
];

function AnimatedSection({ children, delay = 0, className }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={clsx(className, styles.animated, isVisible && styles.visible)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function HomepageHeader() {
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroBackground}>
        <div className={styles.heroGlow}></div>
      </div>
      <div className="container">
        <div className={styles.heroContent}>
          <AnimatedSection delay={0}>
            <p className={styles.heroEyebrow}>Enterprise DevSecOps Platform</p>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <h1 className={styles.heroTitle}>
              Security shouldn't slow you down.
              <span className={styles.heroTitleAccent}> It won't.</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <p className={styles.heroSubtitle}>
              Optimal is the platform that makes secure software delivery automatic.
              Deploy to cloud, on-prem, or airgap environments with compliance built in—not bolted on.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <div className={styles.heroButtons}>
              <Link
                className={clsx('button button--lg', styles.primaryButton)}
                to="/docs/getting-started/quickstart">
                Get a Demo
              </Link>
              <Link
                className={clsx('button button--lg', styles.secondaryButton)}
                to="/docs/getting-started/overview">
                See How It Works
              </Link>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={400}>
            <div className={styles.heroProof}>
              <p className={styles.heroProofText}>
                Trusted by platform teams at companies who can't afford security incidents.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </header>
  );
}

function ProblemSection() {
  return (
    <section className={styles.problemSection}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.problemContent}>
            <h2 className={styles.problemTitle}>The old way is broken</h2>
            <div className={styles.problemGrid}>
              <div className={styles.problemItem}>
                <span className={styles.problemIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </span>
                <p>Security teams block releases, developers get frustrated</p>
              </div>
              <div className={styles.problemItem}>
                <span className={styles.problemIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </span>
                <p>Manual compliance checks before every deployment</p>
              </div>
              <div className={styles.problemItem}>
                <span className={styles.problemIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </span>
                <p>Scrambling to gather evidence during audits</p>
              </div>
              <div className={styles.problemItem}>
                <span className={styles.problemIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </span>
                <p>Different security posture in each environment</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section className={styles.solutionSection}>
      <div className="container">
        <div className={styles.solutionContent}>
          <AnimatedSection>
            <p className={styles.solutionEyebrow}>The Optimal Approach</p>
            <h2 className={styles.solutionTitle}>
              Security that enforces itself
            </h2>
            <p className={styles.solutionSubtitle}>
              Policies run at deploy time. Threats are caught in real-time.
              Compliance evidence is generated automatically. You ship software.
              <strong> That's it.</strong>
            </p>
          </AnimatedSection>

          <div className={styles.solutionFeatures}>
            <AnimatedSection delay={100} className={styles.solutionFeature}>
              <div className={styles.solutionFeatureIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <h3>Policy Enforcement</h3>
              <p>Kyverno blocks misconfigurations before they reach production. No approvals needed—bad deploys simply don't happen.</p>
            </AnimatedSection>

            <AnimatedSection delay={200} className={styles.solutionFeature}>
              <div className={styles.solutionFeatureIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <h3>Runtime Detection</h3>
              <p>Falco watches every container. Suspicious behavior triggers instant alerts—not next-day reports from a scan.</p>
            </AnimatedSection>

            <AnimatedSection delay={300} className={styles.solutionFeature}>
              <div className={styles.solutionFeatureIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <h3>Automatic Compliance</h3>
              <p>SBOMs generated for every build. Audit trails always current. When auditors ask, you have answers—immediately.</p>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonaSection() {
  return (
    <section className={styles.personaSection}>
      <div className="container">
        <AnimatedSection>
          <h2 className={styles.sectionTitle}>Built for the people who build platforms</h2>
        </AnimatedSection>

        <div className={styles.personaGrid}>
          {personas.map((persona, idx) => (
            <AnimatedSection key={idx} delay={idx * 150} className={styles.personaCard}>
              <span className={styles.personaRole}>{persona.role}</span>
              <h3 className={styles.personaHeadline}>{persona.headline}</h3>
              <p className={styles.personaDescription}>{persona.description}</p>
              <ul className={styles.personaBenefits}>
                {persona.benefits.map((benefit, bidx) => (
                  <li key={bidx}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialSection() {
  return (
    <section className={styles.testimonialSection}>
      <div className="container">
        <AnimatedSection>
          <p className={styles.testimonialEyebrow}>Results That Matter</p>
          <h2 className={styles.sectionTitle}>Teams ship faster with Optimal</h2>
        </AnimatedSection>

        <div className={styles.testimonialGrid}>
          {testimonials.map((testimonial, idx) => (
            <AnimatedSection key={idx} delay={idx * 150} className={styles.testimonialCard}>
              <div className={styles.testimonialMetric}>
                <span className={styles.metricValue}>{testimonial.metric}</span>
                <span className={styles.metricLabel}>{testimonial.metricLabel}</span>
              </div>
              <blockquote className={styles.testimonialQuote}>
                "{testimonial.quote}"
              </blockquote>
              <div className={styles.testimonialAuthor}>
                <span className={styles.authorRole}>{testimonial.author}</span>
                <span className={styles.authorCompany}>{testimonial.company}</span>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function EnvironmentSection() {
  return (
    <section className={styles.environmentSection}>
      <div className="container">
        <AnimatedSection>
          <h2 className={styles.sectionTitle}>One platform. Every environment.</h2>
          <p className={styles.sectionSubtitle}>
            Cloud, on-prem, or completely disconnected—same security posture everywhere.
          </p>
        </AnimatedSection>

        <div className={styles.environmentGrid}>
          <AnimatedSection delay={100} className={styles.environmentCard}>
            <div className={styles.environmentIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
              </svg>
            </div>
            <h3>Cloud</h3>
            <p>Terraform modules for AWS, GCP, and Azure. Integrate with managed services or run fully self-contained.</p>
            <Link to="/docs/deployment/cloud/aws" className={styles.environmentLink}>
              Deploy to Cloud →
            </Link>
          </AnimatedSection>

          <AnimatedSection delay={200} className={styles.environmentCard}>
            <div className={styles.environmentIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                <line x1="6" y1="6" x2="6.01" y2="6"/>
                <line x1="6" y1="18" x2="6.01" y2="18"/>
              </svg>
            </div>
            <h3>On-Premise</h3>
            <p>Full control over your infrastructure. Bring your own Kubernetes or use our hardened distribution.</p>
            <Link to="/docs/deployment/on-premise" className={styles.environmentLink}>
              Deploy On-Prem →
            </Link>
          </AnimatedSection>

          <AnimatedSection delay={300} className={styles.environmentCard}>
            <div className={styles.environmentIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h3>Airgap</h3>
            <p>Outpost packages everything for IL4/IL5/IL6. No internet required—ever.</p>
            <Link to="/docs/deployment/outpost/overview" className={styles.environmentLink}>
              Deploy Airgap →
            </Link>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <AnimatedSection>
          <div className={styles.ctaContent}>
            <h2>Ready to stop fighting security?</h2>
            <p>Get a demo and see how Optimal makes secure software delivery automatic.</p>
            <div className={styles.ctaButtons}>
              <Link
                className={clsx('button button--lg', styles.primaryButton)}
                to="/docs/getting-started/quickstart">
                Get a Demo
              </Link>
              <Link
                className={clsx('button button--lg', styles.ghostButton)}
                to="/docs/getting-started/overview">
                Read the Docs
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Secure Software Delivery Platform"
      description="Optimal - The DevSecOps platform that makes secure software delivery automatic. Deploy to cloud, on-prem, or airgap with compliance built in.">
      <HomepageHeader />
      <main>
        <ProblemSection />
        <SolutionSection />
        <PersonaSection />
        <TestimonialSection />
        <EnvironmentSection />
        <CtaSection />
      </main>
    </Layout>
  );
}
