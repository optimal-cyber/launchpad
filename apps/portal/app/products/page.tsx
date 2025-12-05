'use client';

import { ExternalLink, GitBranch, Database, MessageSquare, BarChart3, Archive, Shield, Waypoints, FolderKanban, FileText, Brain, TrendingUp } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  icon: any;
  category: string;
  description: string;
  features: string[];
  status: 'integrated' | 'available' | 'coming-soon';
  launchUrl?: string;
}

export default function ProductsPage() {
  const products: Product[] = [
    {
      id: 'launchpad',
      name: 'Launchpad Hub',
      icon: Waypoints,
      category: 'Project Management',
      description: 'Centralized project and user management for mission owners, manages software vulnerabilities. Monitoring & Alerting.',
      features: ['Project Management', 'Monitoring & Alerting'],
      status: 'integrated',
      launchUrl: '/launchpad'
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      icon: GitBranch,
      category: 'Collaborative Development',
      description: 'Unify source code, pipelines, and image builds in a single application. GitLab accelerates package-approval and integrates with Argo to streamline production deployments.',
      features: ['Source code management', 'CI/CD', 'Collaborative Development'],
      status: 'integrated',
      launchUrl: 'https://gitlab.com'
    },
    {
      id: 'harbor',
      name: 'Harbor',
      icon: Archive,
      category: 'Artifacts',
      description: 'Ensure deployment integrity with a trusted image registry. Harbor certifies container images and separates staging from production to reduce risk and enforce security.',
      features: ['Secure container registry', 'Artifacts'],
      status: 'integrated',
      launchUrl: 'https://goharbor.io'
    },
    {
      id: 'argo',
      name: 'Argo CD',
      icon: GitBranch,
      category: 'Collaborative Development',
      description: 'Maintain deployment consistency with GitOps-driven automation. Argo CD syncs Kubernetes manifests to prevent drift and support reliable, scalable application releases.',
      features: ['Collaborative Development', 'GitOps'],
      status: 'integrated',
      launchUrl: 'https://argo-cd.readthedocs.io'
    },
    {
      id: 'grafana',
      name: 'Grafana',
      icon: BarChart3,
      category: 'Monitoring & Alerting',
      description: 'Query, visualize, track, alert on, and understand and set alerts on your data no matter where it is stored. With Grafana you can create, explore, and share all of your data through beautiful, flexible dashboards.',
      features: ['Performance dashboard', 'Monitoring & Alerting'],
      status: 'integrated',
      launchUrl: '/monitoring/grafana'
    },
    {
      id: 'kubecost',
      name: 'Kubecost',
      icon: TrendingUp,
      category: 'Monitoring & Alerting',
      description: 'Gain real-time visibility into Kubernetes resource usage and cloud spend. Kubecost helps teams manage budgets and optimize infrastructure for cost-efficient scaling.',
      features: ['Kubernetes cost tracking', 'Monitoring & Alerting'],
      status: 'integrated',
      launchUrl: 'https://kubecost.com'
    },
    {
      id: 'confluence',
      name: 'Confluence',
      icon: FileText,
      category: 'Knowledge Management',
      description: 'Keep teams aligned with centralized documentation and shared workspace. Confluence streamlines collaboration and supports faster, more informed decision-making.',
      features: ['Collaboration and knowledge organization', 'Knowledge Management'],
      status: 'integrated',
      launchUrl: '/services/confluence'
    },
    {
      id: 'jira',
      name: 'Jira',
      icon: FolderKanban,
      category: 'Project Management',
      description: 'Translate strategic goals into executable work with agile project management and roadmapping. Jira enables teams to break down initiatives, map dependencies, and link contributions to objectives.',
      features: ['Project and task management', 'Project Management'],
      status: 'integrated',
      launchUrl: 'https://www.atlassian.com/software/jira'
    },
    {
      id: 'rocketchat',
      name: 'Rocket.chat',
      icon: MessageSquare,
      category: 'Communication',
      description: 'Enable secure, real-time communication across teams and stakeholders. Rocket.chat integrates with webhooks to surface critical alerts and support rapid response.',
      features: ['Team communication and alerts', 'Communication'],
      status: 'integrated',
      launchUrl: 'https://rocket.chat'
    },
    {
      id: 'vault',
      name: 'Vault',
      icon: Shield,
      category: 'Artifacts',
      description: 'Protect sensitive data with identity-based access and automated secrets management. Vault simplifies security workflows and ensures trusted, scalable protection.',
      features: ['Secrets management', 'Artifacts'],
      status: 'integrated',
      launchUrl: 'https://www.vaultproject.io'
    },
    {
      id: 'ai-security',
      name: 'AI Security Benchmarks',
      icon: Brain,
      category: 'AI/ML Security',
      description: 'Comprehensive AI/ML model security assessment with OWASP AISVS, NIST AI RMF, and MITRE ATLAS benchmarking for secure model deployment.',
      features: ['AI model security', 'Compliance benchmarking', 'Threat assessment'],
      status: 'integrated',
      launchUrl: '/ai-security'
    }
  ];

  const categories = [
    'Project Management',
    'Collaborative Development',
    'Knowledge Management',
    'Communication',
    'Monitoring & Alerting',
    'Artifacts',
    'AI/ML Security'
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'integrated':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800';
      case 'available':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      case 'coming-soon':
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-800';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">LAUNCHPAD PROVIDES THE TOOLS TO HELP PRODUCT TEAMS DELIVER</h1>
            <p className="text-lg text-teal-100">
              Launchpad is the secure, mission-ready purpose-built application that streamlines development and delivery. 
              With integrated pipelines and centralized oversight, it enables fast, scalable, and compliant software deployment across complex environments.
            </p>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">LAUNCHPAD PRODUCTS</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access all integrated tools and services in one unified platform for seamless development, security, and operations.
          </p>
        </div>

        {/* Category Sections */}
        {categories.map((category) => {
          const categoryProducts = products.filter(p => p.category === category);
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category} className="mb-12">
              <div className="border-b border-border pb-3 mb-6">
                <h3 className="text-xl font-semibold text-foreground">{category.toUpperCase()}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {category === 'Project Management' && 'Plan, track and direct projects in an organized platform with real-time data integration. Manage user access with role alignment for efficient project execution.'}
                  {category === 'Collaborative Development' && 'Implement collaborative workflows in the development pipeline, sourcing synchronized and audited input from developers and AI models.'}
                  {category === 'Knowledge Management' && 'Efficiently share content and gather information from verifiable sources.'}
                  {category === 'Communication' && 'Connect with your team in secure messaging channels.'}
                  {category === 'Monitoring & Alerting' && 'Track expenses, reduce costs and visualize metrics. Monitor resources, costs, and project goals with performance insights for successful project delivery.'}
                  {category === 'Artifacts' && 'Access and store secrets in secure, controlled environments with simple security management.'}
                  {category === 'AI/ML Security' && 'Ensure AI/ML models meet security benchmarks and compliance standards for safe deployment.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryProducts.map((product) => {
                  const Icon = product.icon;
                  return (
                    <div
                      key={product.id}
                      className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg group"
                    >
                      <div className="bg-gradient-to-br from-teal-900 to-cyan-900 p-6 flex items-center justify-center">
                        <Icon className="h-16 w-16 text-white" />
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-lg font-semibold text-foreground">{product.name}</h4>
                          <a
                            href={product.launchUrl || '#'}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            target={product.launchUrl?.startsWith('http') ? '_blank' : undefined}
                            rel={product.launchUrl?.startsWith('http') ? 'noopener noreferrer' : undefined}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {product.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          {product.features.map((feature, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground">
                              • {feature}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(product.status)}`}>
                            {product.status === 'integrated' && 'INTEGRATED'}
                            {product.status === 'available' && 'AVAILABLE'}
                            {product.status === 'coming-soon' && 'COMING SOON'}
                          </span>
                          
                          {product.launchUrl && (
                            <a
                              href={product.launchUrl}
                              target={product.launchUrl.startsWith('http') ? '_blank' : undefined}
                              rel={product.launchUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                              className="inline-flex items-center px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-xs font-medium"
                            >
                              LAUNCH
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">EMPOWERING TEAMS THAT MOVE MISSIONS FORWARD</h2>
          <p className="text-lg text-teal-100 mb-8 max-w-3xl mx-auto">
            Launchpad empowers product development teams to deliver mission-critical outcomes with speed, security, and efficiency. 
            Its cloud-native platform streamlines development and deployment, offering built-in scalability, automation, and disaster recovery—so you can move fast, collaborate seamlessly, and operate with confidence.
          </p>
          <button className="bg-white text-teal-900 font-semibold px-8 py-3 rounded-lg hover:bg-teal-50 transition-colors">
            GET STARTED
          </button>
        </div>
      </div>
    </div>
  );
}

