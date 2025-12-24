import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

const features = [
  {
    title: 'Security First',
    description: 'Built-in vulnerability scanning, SBOM management, Kyverno policies, and runtime security with Falco.',
    icon: '🛡️',
  },
  {
    title: 'Deploy Anywhere',
    description: 'Cloud (AWS, GCP, Azure), on-premise, or airgap environments with Outpost packaging.',
    icon: '🚀',
  },
  {
    title: 'Complete Observability',
    description: 'Prometheus metrics, Grafana dashboards, Loki logging, and intelligent alerting.',
    icon: '📊',
  },
  {
    title: 'Enterprise SSO',
    description: 'Keycloak integration with Google, Azure AD, Okta, and custom OIDC providers.',
    icon: '🔐',
  },
  {
    title: 'Backup & Recovery',
    description: 'Velero-based backup and disaster recovery with scheduled backups and cross-region restore.',
    icon: '💾',
  },
  {
    title: 'Airgap Ready',
    description: 'Outpost packages everything for disconnected environments with automatic SBOM generation.',
    icon: '✈️',
  },
];

function Feature({title, description, icon}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="card" style={{padding: '1.5rem', marginBottom: '1rem', height: '100%'}}>
        <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary')} style={{padding: '4rem 0'}}>
      <div className="container">
        <h1 className="hero__title" style={{fontSize: '3rem'}}>
          Optimal Launchpad
        </h1>
        <p className="hero__subtitle" style={{fontSize: '1.5rem', maxWidth: '600px', margin: '0 auto 2rem'}}>
          Secure Software Delivery Platform for Enterprise and Airgap Environments
        </p>
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started/overview">
            Get Started
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/docs/getting-started/quickstart"
            style={{color: 'white', borderColor: 'white'}}>
            Quick Start (5 min)
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Documentation"
      description="Optimal Platform - Enterprise DevSecOps Platform Documentation">
      <HomepageHeader />
      <main>
        <section style={{padding: '4rem 0'}}>
          <div className="container">
            <div className="row">
              {features.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        <section style={{padding: '4rem 0', background: 'var(--ifm-background-surface-color)'}}>
          <div className="container">
            <h2 style={{textAlign: 'center', marginBottom: '2rem'}}>Architecture Overview</h2>
            <pre style={{
              background: 'var(--ifm-code-background)',
              padding: '2rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.85rem'
            }}>
{`┌─────────────────────────────────────────────────────────────────────────────┐
│                     OPTIMAL PLATFORM (Kubernetes Cluster)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Ingress / Service Mesh                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Core Services Layer                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│   │
│  │  │  Keycloak   │  │  Grafana    │  │    Loki     │  │  Prometheus ││   │
│  │  │  (IAM/SSO)  │  │(Dashboards) │  │  (Logging)  │  │  (Metrics)  ││   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Policy & Security Layer                          │   │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────┐ │   │
│  │  │     Kyverno       │  │  Kyverno Policies │  │     Falco       │ │   │
│  │  │  (Policy Engine)  │  │  (Validating/     │  │(Runtime Security│ │   │
│  │  │                   │  │   Mutating)       │  │    Detection)   │ │   │
│  │  └───────────────────┘  └───────────────────┘  └─────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Optimal Application Layer                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│   │
│  │  │   Portal    │  │ API Gateway │  │    SBOM     │  │    Vuln     ││   │
│  │  │ (Next.js)   │  │ (FastAPI)   │  │   Service   │  │   Service   ││   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Data & Backup Layer                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │ PostgreSQL  │  │    Redis    │  │   Velero    │                 │   │
│  │  │ (Database)  │  │   (Cache)   │  │  (Backup)   │                 │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </section>

        <section style={{padding: '4rem 0'}}>
          <div className="container" style={{textAlign: 'center'}}>
            <h2>Ready to Get Started?</h2>
            <p style={{maxWidth: '600px', margin: '0 auto 2rem'}}>
              Deploy Optimal Platform in minutes with our quick start guide,
              or explore the full documentation for production deployments.
            </p>
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
              <Link
                className="button button--primary button--lg"
                to="/docs/getting-started/quickstart">
                Quick Start Guide
              </Link>
              <Link
                className="button button--secondary button--lg"
                to="/docs/deployment/outpost/overview">
                Airgap Deployment
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
