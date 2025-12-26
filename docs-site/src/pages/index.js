import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const features = [
  {
    title: 'Zero-Trust Security',
    description: 'Kyverno policy enforcement, Falco runtime detection, and continuous vulnerability scanning built into every deployment.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
  {
    title: 'Multi-Cloud & Airgap',
    description: 'Deploy to AWS, GCP, Azure, on-premise, or completely disconnected environments with Outpost packaging.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
      </svg>
    ),
  },
  {
    title: 'Full Observability',
    description: 'Prometheus metrics, Grafana dashboards, Loki logging, and intelligent alerting out of the box.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 00-8.953-8.951c-.55-.055-.997.398-.997.95v8a1 1 0 001 1h8z"/>
        <path d="M21.21 15.89A10 10 0 118.11 2.79"/>
      </svg>
    ),
  },
  {
    title: 'Enterprise SSO',
    description: 'Keycloak-powered authentication with Google, Azure AD, Okta, and custom OIDC/SAML providers.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    ),
  },
  {
    title: 'SBOM & Compliance',
    description: 'Automatic software bill of materials generation with NIST, FedRAMP, and DoD IL compliance support.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
  },
  {
    title: 'Disaster Recovery',
    description: 'Velero-powered backups with scheduled snapshots, cross-region restore, and point-in-time recovery.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="23,4 23,10 17,10"/>
        <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
      </svg>
    ),
  },
];

const stats = [
  { value: '30+', label: 'Security Policies' },
  { value: '5', label: 'Cloud Providers' },
  { value: '100%', label: 'Airgap Compatible' },
  { value: '< 5min', label: 'Local Deploy' },
];

function Feature({title, description, icon}) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

function HomepageHeader() {
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroBackground}>
        <div className={styles.heroGrid}></div>
      </div>
      <div className="container">
        <div className={styles.heroContent}>
          <img
            src="/img/logo.png"
            alt="Optimal"
            className={styles.heroLogo}
          />
          <h1 className={styles.heroTitle}>
            Secure Software Delivery
            <span className={styles.heroTitleAccent}> for the Enterprise</span>
          </h1>
          <p className={styles.heroSubtitle}>
            The complete DevSecOps platform for deploying secure applications
            to cloud, on-premise, and airgap environments. Built for platform teams
            who refuse to compromise on security.
          </p>
          <div className={styles.heroButtons}>
            <Link
              className={clsx('button button--lg', styles.primaryButton)}
              to="/docs/getting-started/overview">
              Get Started
            </Link>
            <Link
              className={clsx('button button--lg', styles.secondaryButton)}
              to="/docs/getting-started/quickstart">
              Quick Start (5 min)
            </Link>
          </div>
          <div className={styles.heroStats}>
            {stats.map((stat, idx) => (
              <div key={idx} className={styles.statItem}>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function TrustedBy() {
  return (
    <section className={styles.trustedSection}>
      <div className="container">
        <p className={styles.trustedLabel}>BUILT FOR REGULATED INDUSTRIES</p>
        <div className={styles.trustedLogos}>
          <span>Defense</span>
          <span>Finance</span>
          <span>Healthcare</span>
          <span>Government</span>
          <span>Energy</span>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section className={styles.useCasesSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Built for Your Environment</h2>
        <p className={styles.sectionSubtitle}>
          Whether you're deploying to the cloud or a submarine, Optimal has you covered.
        </p>
        <div className="row">
          <div className="col col--4">
            <div className={styles.useCaseCard}>
              <div className={styles.useCaseHeader}>
                <span className={styles.useCaseBadge}>CLOUD</span>
              </div>
              <h3>AWS / GCP / Azure</h3>
              <p>Terraform modules for EKS, GKE, and AKS with managed services integration.</p>
              <Link to="/docs/deployment/cloud/aws" className={styles.useCaseLink}>
                View Cloud Guides →
              </Link>
            </div>
          </div>
          <div className="col col--4">
            <div className={styles.useCaseCard}>
              <div className={styles.useCaseHeader}>
                <span className={styles.useCaseBadge}>ON-PREMISE</span>
              </div>
              <h3>Private Infrastructure</h3>
              <p>Full control deployment to your own Kubernetes clusters with enterprise support.</p>
              <Link to="/docs/deployment/on-premise" className={styles.useCaseLink}>
                View On-Premise Guide →
              </Link>
            </div>
          </div>
          <div className="col col--4">
            <div className={styles.useCaseCard}>
              <div className={styles.useCaseHeader}>
                <span className={clsx(styles.useCaseBadge, styles.useCaseBadgeHighlight)}>AIRGAP</span>
              </div>
              <h3>Disconnected Networks</h3>
              <p>Outpost packages everything for IL4/IL5/IL6 and completely disconnected environments.</p>
              <Link to="/docs/deployment/outpost/overview" className={styles.useCaseLink}>
                View Airgap Guide →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section className={styles.architectureSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Platform Architecture</h2>
        <p className={styles.sectionSubtitle}>
          A complete stack for secure software delivery, from ingress to backup.
        </p>
        <div className={styles.architectureDiagram}>
          <div className={styles.archLayer}>
            <div className={styles.archLayerLabel}>INGRESS</div>
            <div className={styles.archLayerContent}>
              <span>NGINX Ingress</span>
              <span>TLS Termination</span>
              <span>Rate Limiting</span>
            </div>
          </div>
          <div className={styles.archLayer}>
            <div className={styles.archLayerLabel}>APPLICATION</div>
            <div className={styles.archLayerContent}>
              <span>Portal (Next.js)</span>
              <span>API Gateway (FastAPI)</span>
              <span>SBOM Service</span>
              <span>Vuln Service</span>
            </div>
          </div>
          <div className={styles.archLayer}>
            <div className={styles.archLayerLabel}>SECURITY</div>
            <div className={styles.archLayerContent}>
              <span>Kyverno Policies</span>
              <span>Falco Runtime</span>
              <span>Network Policies</span>
            </div>
          </div>
          <div className={styles.archLayer}>
            <div className={styles.archLayerLabel}>OBSERVABILITY</div>
            <div className={styles.archLayerContent}>
              <span>Prometheus</span>
              <span>Grafana</span>
              <span>Loki</span>
              <span>Alertmanager</span>
            </div>
          </div>
          <div className={styles.archLayer}>
            <div className={styles.archLayerLabel}>DATA</div>
            <div className={styles.archLayerContent}>
              <span>PostgreSQL</span>
              <span>Redis</span>
              <span>Velero Backup</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <div className={styles.ctaContent}>
          <h2>Ready to secure your software delivery?</h2>
          <p>Deploy Optimal Platform in minutes and start shipping secure software today.</p>
          <div className={styles.ctaButtons}>
            <Link
              className={clsx('button button--lg', styles.primaryButton)}
              to="/docs/getting-started/quickstart">
              Start Free
            </Link>
            <Link
              className={clsx('button button--lg', styles.outlineButton)}
              to="/docs/getting-started/architecture">
              View Architecture
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Secure Software Delivery Platform"
      description="Optimal Platform - Enterprise DevSecOps platform for cloud, on-premise, and airgap deployments. Built-in security, observability, and compliance.">
      <HomepageHeader />
      <main>
        <TrustedBy />
        <section className={styles.featuresSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Everything You Need</h2>
            <p className={styles.sectionSubtitle}>
              Security, observability, and compliance built in from day one.
            </p>
            <div className="row">
              {features.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
        <UseCases />
        <Architecture />
        <CTA />
      </main>
    </Layout>
  );
}
