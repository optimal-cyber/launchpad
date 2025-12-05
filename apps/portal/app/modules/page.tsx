'use client';

import { useState } from 'react';
import { Search, Package, Star, Download, ChevronRight, Copy, Check, BookOpen, GitBranch, Calendar, User } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';

interface Module {
  id: string;
  name: string;
  provider: string;
  description: string;
  version: string;
  downloads: number;
  stars: number;
  lastUpdated: string;
  author: string;
  tags: string[];
  icon: string;
}

const modules: Module[] = [
  {
    id: 'aws-sqs',
    name: 'AWS SQS',
    provider: 'AWS',
    description: 'Terraform module which creates SQS resources on AWS.',
    version: 'v1.0.17',
    downloads: 15234,
    stars: 342,
    lastUpdated: 'Apr 15, 2025',
    author: 'Optimal',
    tags: ['aws', 'sqs', 'queue', 'messaging'],
    icon: '🟠'
  },
  {
    id: 'aws-eks',
    name: 'AWS EKS',
    provider: 'AWS',
    description: 'Terraform module to create an Elastic Kubernetes (EKS) cluster and associated resources.',
    version: 'v2.4.3',
    downloads: 42156,
    stars: 891,
    lastUpdated: 'Apr 12, 2025',
    author: 'Optimal',
    tags: ['aws', 'eks', 'kubernetes', 'container'],
    icon: '🟠'
  },
  {
    id: 'aws-vpc',
    name: 'AWS VPC',
    provider: 'AWS',
    description: 'Terraform module which creates VPC resources on AWS.',
    version: 'v3.2.1',
    downloads: 67823,
    stars: 1243,
    lastUpdated: 'Apr 10, 2025',
    author: 'Optimal',
    tags: ['aws', 'vpc', 'networking'],
    icon: '🟠'
  },
  {
    id: 'aws-rds',
    name: 'AWS RDS',
    provider: 'AWS',
    description: 'Terraform module which creates RDS resources on AWS.',
    version: 'v1.8.5',
    downloads: 34567,
    stars: 623,
    lastUpdated: 'Apr 8, 2025',
    author: 'Optimal',
    tags: ['aws', 'rds', 'database', 'postgresql'],
    icon: '🟠'
  },
  {
    id: 'azure-aks',
    name: 'Azure AKS',
    provider: 'Azure',
    description: 'Terraform module for deploying Azure Kubernetes Service (AKS).',
    version: 'v2.1.0',
    downloads: 23456,
    stars: 445,
    lastUpdated: 'Apr 14, 2025',
    author: 'Optimal',
    tags: ['azure', 'aks', 'kubernetes', 'container'],
    icon: '🔵'
  },
  {
    id: 'gcp-gke',
    name: 'GCP GKE',
    provider: 'GCP',
    description: 'Terraform module for Google Kubernetes Engine (GKE) cluster.',
    version: 'v1.9.2',
    downloads: 18934,
    stars: 367,
    lastUpdated: 'Apr 11, 2025',
    author: 'Optimal',
    tags: ['gcp', 'gke', 'kubernetes', 'container'],
    icon: '🔴'
  }
];

const usageExamples = {
  'aws-sqs': {
    fifo: `module "sqs" {
  source = "terraform-optimal-modules/sqs/aws"
  
  name = "fifo"
  
  fifo_queue = true
  
  tags = {
    Environment = "dev"
  }
}`,
    encrypted: `module "sqs" {
  source = "terraform-optimal-modules/sqs/aws"
  
  name = "cmk"
  
  kms_master_key_id                 = "0d1ba9e8-9421-498a-9c8a-01e9772b2924"
  kms_data_key_reuse_period_seconds = 3600
  
  tags = {
    Environment = "dev"
  }
}`,
    dlq: `module "sqs" {
  source = "terraform-optimal-modules/sqs/aws"
  
  name = "main-queue"
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 4
  })
  
  tags = {
    Environment = "dev"
  }
}`
  },
  'aws-eks': {
    basic: `module "eks" {
  source = "terraform-optimal-modules/eks/aws"
  
  cluster_name    = "my-cluster"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  eks_managed_node_groups = {
    main = {
      desired_size = 2
      min_size     = 1
      max_size     = 3
      
      instance_types = ["t3.medium"]
    }
  }
  
  tags = {
    Environment = "dev"
  }
}`,
    advanced: `module "eks" {
  source = "terraform-optimal-modules/eks/aws"
  
  cluster_name    = "production-cluster"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  cluster_endpoint_public_access  = false
  cluster_endpoint_private_access = true
  
  eks_managed_node_groups = {
    spot = {
      capacity_type  = "SPOT"
      instance_types = ["t3.large", "t3a.large"]
      desired_size   = 3
      min_size       = 2
      max_size       = 5
    }
  }
  
  tags = {
    Environment = "production"
  }
}`
  }
};

export default function ModulesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [selectedModule, setSelectedModule] = useState<Module | null>(modules[0]);
  const [selectedExample, setSelectedExample] = useState<string>('fifo');
  const [copiedCode, setCopiedCode] = useState(false);

  const providers = ['All', 'AWS', 'Azure', 'GCP'];

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesProvider = selectedProvider === 'All' || module.provider === selectedProvider;
    return matchesSearch && matchesProvider;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getExampleForModule = (moduleId: string) => {
    if (moduleId === 'aws-sqs') {
      return usageExamples['aws-sqs'][selectedExample as keyof typeof usageExamples['aws-sqs']];
    } else if (moduleId === 'aws-eks') {
      return usageExamples['aws-eks'][selectedExample as keyof typeof usageExamples['aws-eks']] || usageExamples['aws-eks'].basic;
    }
    return `module "${moduleId}" {
  source = "terraform-optimal-modules/${moduleId}/aws"
  
  # Configuration options
  name = "example"
  
  tags = {
    Environment = "dev"
  }
}`;
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <div className="border-b border-gray-700 bg-gray-900">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Module Registry</h1>
                <p className="text-gray-400">Streamline infrastructure management with pre-built Terraform modules</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                {providers.map((provider) => (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedProvider === provider
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {provider}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-200px)]">
          {/* Module List */}
          <div className="w-96 border-r border-gray-700 bg-gray-900 overflow-y-auto">
            <div className="p-4 space-y-2">
              {filteredModules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => {
                    setSelectedModule(module);
                    setSelectedExample(module.id === 'aws-sqs' ? 'fifo' : 'basic');
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedModule?.id === module.id
                      ? 'bg-gray-800 border-blue-500'
                      : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{module.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-white">{module.name}</h3>
                        <span className="text-xs text-gray-400">{module.version}</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{module.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Download className="h-3 w-3" />
                          <span>{(module.downloads / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>{module.stars}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Module Details */}
          {selectedModule && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Module Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{selectedModule.icon}</div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{selectedModule.name}</h2>
                        <p className="text-gray-400">{selectedModule.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg">
                        {selectedModule.version}
                      </span>
                    </div>
                  </div>

                  {/* Module Metadata */}
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm mb-1">
                        <User className="h-4 w-4" />
                        <span>Provider</span>
                      </div>
                      <div className="text-white font-medium">{selectedModule.provider}</div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm mb-1">
                        <Download className="h-4 w-4" />
                        <span>Downloads</span>
                      </div>
                      <div className="text-white font-medium">{selectedModule.downloads.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm mb-1">
                        <Star className="h-4 w-4" />
                        <span>Stars</span>
                      </div>
                      <div className="text-white font-medium">{selectedModule.stars}</div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Updated</span>
                      </div>
                      <div className="text-white font-medium">{selectedModule.lastUpdated}</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center space-x-2 mt-4">
                    {selectedModule.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded border border-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                  <div className="flex space-x-1 border-b border-gray-700">
                    <button className="px-4 py-2 text-sm font-medium text-blue-400 border-b-2 border-blue-400">
                      Readme
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">
                      Inputs
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">
                      Outputs
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">
                      Dependencies
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">
                      Resources
                    </button>
                  </div>
                </div>

                {/* Usage Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Usage</h3>

                    {/* Example Selector for SQS */}
                    {selectedModule.id === 'aws-sqs' && (
                      <div className="mb-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedExample('fifo')}
                            className={`px-3 py-1.5 text-sm rounded ${
                              selectedExample === 'fifo'
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            FIFO Queue
                          </button>
                          <button
                            onClick={() => setSelectedExample('encrypted')}
                            className={`px-3 py-1.5 text-sm rounded ${
                              selectedExample === 'encrypted'
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            Encrypted with CMK
                          </button>
                          <button
                            onClick={() => setSelectedExample('dlq')}
                            className={`px-3 py-1.5 text-sm rounded ${
                              selectedExample === 'dlq'
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            With Dead Letter Queue
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Example Selector for EKS */}
                    {selectedModule.id === 'aws-eks' && (
                      <div className="mb-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedExample('basic')}
                            className={`px-3 py-1.5 text-sm rounded ${
                              selectedExample === 'basic'
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            Basic
                          </button>
                          <button
                            onClick={() => setSelectedExample('advanced')}
                            className={`px-3 py-1.5 text-sm rounded ${
                              selectedExample === 'advanced'
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            Production
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Code Example */}
                    <div className="relative">
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          onClick={() => handleCopyCode(getExampleForModule(selectedModule.id))}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors"
                        >
                          {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                        <code className="text-sm text-gray-300">{getExampleForModule(selectedModule.id)}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Additional Documentation */}
                  <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <BookOpen className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-1">Documentation</h4>
                        <p className="text-sm text-gray-400 mb-2">
                          For detailed configuration options, inputs, outputs, and advanced usage examples, visit the module documentation.
                        </p>
                        <a href="#" className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                          View full documentation →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
