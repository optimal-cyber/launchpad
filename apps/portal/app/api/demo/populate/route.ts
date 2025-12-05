import { NextResponse } from 'next/server';

// Demo data generator for trial users
const demoProjects = [
  {
    name: 'frontend-web-app',
    environment: 'production',
    image: 'ghcr.io/acme/frontend:v2.3.1'
  },
  {
    name: 'api-gateway',
    environment: 'production',
    image: 'ghcr.io/acme/api-gateway:v1.8.0'
  },
  {
    name: 'auth-service',
    environment: 'staging',
    image: 'ghcr.io/acme/auth-service:v3.0.0-beta'
  },
  {
    name: 'payment-processor',
    environment: 'production',
    image: 'ghcr.io/acme/payments:v4.1.2'
  },
  {
    name: 'notification-service',
    environment: 'development',
    image: 'ghcr.io/acme/notifications:v1.2.0'
  }
];

const demoVulnerabilities = [
  {
    vuln_id: 'CVE-2024-21626',
    severity: 'CRITICAL',
    package: 'runc',
    version: '1.1.4',
    fixed_version: '1.1.12',
    description: 'Container breakout vulnerability in runc allowing host filesystem access via WORKDIR manipulation',
    cvss_score: 9.8,
    epss_score: 0.85,
    status: 'OPEN',
    urls: ['https://nvd.nist.gov/vuln/detail/CVE-2024-21626']
  },
  {
    vuln_id: 'CVE-2024-3094',
    severity: 'CRITICAL',
    package: 'xz-utils',
    version: '5.6.0',
    fixed_version: '5.6.2',
    description: 'Malicious code in XZ Utils affecting SSH authentication through liblzma',
    cvss_score: 10.0,
    epss_score: 0.92,
    status: 'OPEN',
    urls: ['https://nvd.nist.gov/vuln/detail/CVE-2024-3094']
  },
  {
    vuln_id: 'CVE-2023-44487',
    severity: 'HIGH',
    package: 'golang.org/x/net',
    version: '0.15.0',
    fixed_version: '0.17.0',
    description: 'HTTP/2 Rapid Reset Attack allows denial of service (DDoS)',
    cvss_score: 7.5,
    epss_score: 0.78,
    status: 'IN_PROGRESS',
    urls: ['https://nvd.nist.gov/vuln/detail/CVE-2023-44487']
  },
  {
    vuln_id: 'CVE-2023-4863',
    severity: 'HIGH',
    package: 'libwebp',
    version: '1.2.4',
    fixed_version: '1.3.2',
    description: 'Heap buffer overflow in WebP image processing leads to code execution',
    cvss_score: 8.8,
    epss_score: 0.72,
    status: 'OPEN',
    urls: ['https://nvd.nist.gov/vuln/detail/CVE-2023-4863']
  },
  {
    vuln_id: 'CVE-2023-38545',
    severity: 'HIGH',
    package: 'curl',
    version: '8.3.0',
    fixed_version: '8.4.0',
    description: 'SOCKS5 heap buffer overflow in curl allowing code execution',
    cvss_score: 9.8,
    epss_score: 0.65,
    status: 'RESOLVED',
    urls: ['https://nvd.nist.gov/vuln/detail/CVE-2023-38545']
  },
  {
    vuln_id: 'CVE-2023-36665',
    severity: 'MEDIUM',
    package: 'protobufjs',
    version: '6.11.3',
    fixed_version: '7.2.5',
    description: 'Prototype pollution in protobufjs allows property injection',
    cvss_score: 6.5,
    epss_score: 0.32,
    status: 'OPEN',
    urls: ['https://nvd.nist.gov/vuln/detail/CVE-2023-36665']
  },
  {
    vuln_id: 'CVE-2023-2650',
    severity: 'MEDIUM',
    package: 'openssl',
    version: '3.0.8',
    fixed_version: '3.0.9',
    description: 'Denial of Service via ASN.1 Object Identifiers processing',
    cvss_score: 5.3,
    epss_score: 0.18,
    status: 'IN_PROGRESS',
    urls: ['https://nvd.nist.gov/vuln/detail/CVE-2023-2650']
  },
  {
    vuln_id: 'CVE-2023-45853',
    severity: 'MEDIUM',
    package: 'zlib',
    version: '1.2.13',
    fixed_version: '1.3',
    description: 'Integer overflow in MiniZip library leading to heap corruption',
    cvss_score: 5.9,
    epss_score: 0.15,
    status: 'OPEN',
    urls: ['https://nvd.nist.gov/vuln/detail/CVE-2023-45853']
  },
  {
    vuln_id: 'CVE-2022-40897',
    severity: 'LOW',
    package: 'setuptools',
    version: '65.3.0',
    fixed_version: '65.5.1',
    description: 'Regular Expression Denial of Service in package_index.py',
    cvss_score: 3.7,
    epss_score: 0.05,
    status: 'SUPPRESSED',
    urls: ['https://nvd.nist.gov/vuln/detail/CVE-2022-40897']
  },
  {
    vuln_id: 'CVE-2023-29491',
    severity: 'LOW',
    package: 'ncurses',
    version: '6.3',
    fixed_version: '6.4',
    description: 'Memory corruption when processing malformed terminfo data',
    cvss_score: 4.3,
    epss_score: 0.08,
    status: 'OPEN',
    urls: ['https://nvd.nist.gov/vuln/detail/CVE-2023-29491']
  }
];

const demoSbomComponents = [
  { name: 'react', version: '18.2.0', type: 'npm', license: 'MIT' },
  { name: 'next', version: '14.0.4', type: 'npm', license: 'MIT' },
  { name: 'fastapi', version: '0.104.1', type: 'pypi', license: 'MIT' },
  { name: 'express', version: '4.18.2', type: 'npm', license: 'MIT' },
  { name: 'lodash', version: '4.17.21', type: 'npm', license: 'MIT' },
  { name: 'axios', version: '1.6.2', type: 'npm', license: 'MIT' },
  { name: 'python', version: '3.11.6', type: 'binary', license: 'PSF' },
  { name: 'node', version: '20.10.0', type: 'binary', license: 'MIT' },
  { name: 'openssl', version: '3.0.8', type: 'apk', license: 'Apache-2.0' },
  { name: 'curl', version: '8.3.0', type: 'apk', license: 'MIT' },
  { name: 'zlib', version: '1.2.13', type: 'apk', license: 'Zlib' },
  { name: 'glibc', version: '2.38', type: 'apk', license: 'LGPL-2.1' }
];

export async function POST(request: Request) {
  try {
    const { org_id, user_email } = await request.json();

    // Generate demo scan data
    const scans = [];
    const allFindings: any[] = [];

    for (const project of demoProjects) {
      // Select a subset of vulnerabilities for each project
      const numVulns = 3 + Math.floor(Math.random() * 8);
      const shuffled = [...demoVulnerabilities].sort(() => Math.random() - 0.5);
      const projectVulns = shuffled.slice(0, numVulns);

      const scan = {
        scan_id: `demo-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        agent_id: 'demo-agent',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        target_type: 'image',
        target: project.image,
        project: {
          name: project.name,
          environment: project.environment,
          gitlab_project_id: Math.floor(Math.random() * 100000)
        },
        findings: projectVulns.map(v => ({
          ...v,
          id: `finding-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          project_name: project.name,
          environment: project.environment,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        })),
        summary: {
          critical: projectVulns.filter(v => v.severity === 'CRITICAL').length,
          high: projectVulns.filter(v => v.severity === 'HIGH').length,
          medium: projectVulns.filter(v => v.severity === 'MEDIUM').length,
          low: projectVulns.filter(v => v.severity === 'LOW').length,
          total: projectVulns.length
        },
        sbom: {
          components: demoSbomComponents.slice(0, 6 + Math.floor(Math.random() * 6)),
          total_components: 6 + Math.floor(Math.random() * 6)
        }
      };

      scans.push(scan);
      allFindings.push(...scan.findings);
    }

    // Calculate totals
    const totalSummary = {
      critical: allFindings.filter(f => f.severity === 'CRITICAL').length,
      high: allFindings.filter(f => f.severity === 'HIGH').length,
      medium: allFindings.filter(f => f.severity === 'MEDIUM').length,
      low: allFindings.filter(f => f.severity === 'LOW').length,
      total: allFindings.length,
      open: allFindings.filter(f => f.status === 'OPEN').length,
      in_progress: allFindings.filter(f => f.status === 'IN_PROGRESS').length,
      resolved: allFindings.filter(f => f.status === 'RESOLVED').length
    };

    console.log(`Demo data populated for ${org_id || 'anonymous'}: ${scans.length} scans, ${allFindings.length} findings`);

    return NextResponse.json({
      success: true,
      message: 'Demo data populated successfully',
      data: {
        scans_created: scans.length,
        findings_created: allFindings.length,
        summary: totalSummary,
        projects: demoProjects.map(p => p.name)
      }
    });

  } catch (error) {
    console.error('Error populating demo data:', error);
    return NextResponse.json(
      { error: 'Failed to populate demo data' },
      { status: 500 }
    );
  }
}

// Get demo data status
export async function GET(request: Request) {
  return NextResponse.json({
    success: true,
    demo_available: true,
    sample_projects: demoProjects.length,
    sample_vulnerabilities: demoVulnerabilities.length,
    sample_components: demoSbomComponents.length,
    message: 'POST to this endpoint to populate demo data'
  });
}

