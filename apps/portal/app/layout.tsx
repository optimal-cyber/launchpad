'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import EnterpriseLayout from '../components/layout/EnterpriseLayout';

// Pages that use the full-width landing layout (no sidebar)
const landingPages = ['/', '/login', '/onboarding'];

// Pages that use the enterprise layout with sidebar
const enterprisePages = [
  '/command-center',
  '/hub',
  '/vulnerabilities', 
  '/sbom',
  '/agents',
  '/oscal',
  '/poam',
  '/authorization',
  '/diagrams',
  '/services',
  '/settings',
  '/launchpad'
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Determine layout type
  const isLandingPage = landingPages.includes(pathname);
  const useEnterpriseLayout = enterprisePages.some(p => pathname === p || pathname?.startsWith(p + '/'));

  // Landing pages (login, onboarding) - full width, no chrome
  if (isLandingPage) {
    return (
      <html lang="en" className="dark">
        <head>
          <link rel="icon" href="/optimal-logo.png" type="image/png" />
          <title>Optimal Platform</title>
          <meta name="description" content="Enterprise DevSecOps Platform" />
        </head>
        <body className="min-h-screen">
          {children}
        </body>
      </html>
    );
  }

  // Enterprise pages - full enterprise layout with sidebar
  if (useEnterpriseLayout) {
    return (
      <html lang="en" className="dark">
        <head>
          <link rel="icon" href="/optimal-logo.png" type="image/png" />
          <title>Optimal Platform</title>
          <meta name="description" content="Enterprise DevSecOps Platform" />
        </head>
        <body className="min-h-screen">
          <EnterpriseLayout>
            {children}
          </EnterpriseLayout>
        </body>
      </html>
    );
  }

  // Default fallback - minimal layout
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/optimal-logo.png" type="image/png" />
        <title>Optimal Platform</title>
        <meta name="description" content="Enterprise DevSecOps Platform" />
      </head>
      <body className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
