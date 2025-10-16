"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Server, 
  ArrowLeft,
  Home,
  ArrowRight,
  Package,
  Shield,
  Activity,
  Database,
  Settings,
  Users,
  Download,
  Upload,
  Trash2,
  Eye,
  Lock,
  ExternalLink,
  Play,
  Square,
  RefreshCw
} from 'lucide-react';

interface ContainerImage {
  id: string;
  name: string;
  tag: string;
  size: string;
  vulnerabilities: number;
  lastPushed: string;
  status: 'active' | 'scanning' | 'error';
  digest: string;
  architecture: string;
  os: string;
}

interface Repository {
  id: string;
  name: string;
  description: string;
  imageCount: number;
  lastActivity: string;
  access: 'private' | 'public';
  vulnerabilityCount: number;
  totalSize: string;
}

export default function Harbor() {
  const router = useRouter();
  const [harborStatus, setHarborStatus] = useState<'online' | 'offline' | 'starting'>('offline');
  const [containerImages, setContainerImages] = useState<ContainerImage[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ContainerImage | null>(null);
  const [showCreateRepo, setShowCreateRepo] = useState(false);

  useEffect(() => {
    // Simulate Harbor service startup
    const startHarbor = async () => {
      setHarborStatus('starting');
      // Simulate Harbor container startup
      setTimeout(() => {
        setHarborStatus('online');
        loadHarborData();
      }, 3000);
    };

    startHarbor();
  }, []);

  const loadHarborData = () => {
    // Load container images and repositories
    const mockImages: ContainerImage[] = [
      {
        id: 'img-001',
        name: 'flask-app',
        tag: 'latest',
        size: '156.2 MB',
        vulnerabilities: 2,
        lastPushed: '2 hours ago',
        status: 'active',
        digest: 'sha256:a1b2c3d4e5f6...',
        architecture: 'amd64',
        os: 'linux'
      },
      {
        id: 'img-002',
        name: 'nginx',
        tag: '1.21-alpine',
        size: '23.1 MB',
        vulnerabilities: 0,
        lastPushed: '1 day ago',
        status: 'active',
        digest: 'sha256:b2c3d4e5f6a7...',
        architecture: 'amd64',
        os: 'linux'
      },
      {
        id: 'img-003',
        name: 'postgres',
        tag: '13-alpine',
        size: '89.7 MB',
        vulnerabilities: 1,
        lastPushed: '3 days ago',
        status: 'active',
        digest: 'sha256:c3d4e5f6a7b8...',
        architecture: 'amd64',
        os: 'linux'
      }
    ];

    const mockRepos: Repository[] = [
      {
        id: 'repo-001',
        name: 'flask-container-test',
        description: 'Flask application container images',
        imageCount: 5,
        lastActivity: '2 hours ago',
        access: 'private',
        vulnerabilityCount: 3,
        totalSize: '245.3 MB'
      },
      {
        id: 'repo-002',
        name: 'infrastructure',
        description: 'Infrastructure and base images',
        imageCount: 12,
        lastActivity: '1 day ago',
        access: 'private',
        vulnerabilityCount: 8,
        totalSize: '1.2 GB'
      }
    ];

    setContainerImages(mockImages);
    setRepositories(mockRepos);
    setLoading(false);
  };

  const startHarborService = () => {
    setHarborStatus('starting');
    setTimeout(() => {
      setHarborStatus('online');
      loadHarborData();
    }, 2000);
  };

  const stopHarborService = () => {
    setHarborStatus('offline');
    setContainerImages([]);
    setRepositories([]);
  };

  const scanImage = (imageId: string) => {
    setContainerImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, status: 'scanning' } : img
    ));
    
    // Simulate scan completion
    setTimeout(() => {
      setContainerImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, status: 'active' } : img
      ));
    }, 5000);
  };

  const deleteImage = (imageId: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      setContainerImages(prev => prev.filter(img => img.id !== imageId));
    }
  };

  const openHarborUI = () => {
    // Open Harbor UI in new tab
    window.open('http://localhost:8080', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <button 
            onClick={() => router.push('/launchpad')}
            className="flex items-center hover:text-gray-700 transition-colors"
          >
            <Home className="h-4 w-4 mr-1" />
            Launchpad
          </button>
          <ArrowRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Harbor</span>
        </nav>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Harbor</h1>
            <p className="text-xl text-gray-600">Container Registry and Image Management</p>
          </div>
          <div className="flex items-center space-x-4">
            {harborStatus === 'online' ? (
              <>
                <button
                  onClick={openHarborUI}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Harbor UI
                </button>
                <button
                  onClick={stopHarborService}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Service
                </button>
              </>
            ) : (
              <button
                onClick={startHarborService}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Harbor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="mb-8">
        <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
          harborStatus === 'online' ? 'bg-green-100 text-green-800' :
          harborStatus === 'starting' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            harborStatus === 'online' ? 'bg-green-500' :
            harborStatus === 'starting' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}></div>
          <span className="font-medium">
            {harborStatus === 'online' ? 'Harbor Service: Online' :
             harborStatus === 'starting' ? 'Harbor Service: Starting...' :
             'Harbor Service: Offline'}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{containerImages.length}</div>
              <div className="text-sm text-gray-600">Active Images</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-500 mr-4" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {containerImages.reduce((sum, img) => sum + img.vulnerabilities, 0)}
              </div>
              <div className="text-sm text-gray-600">Vulnerabilities</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{repositories.length}</div>
              <div className="text-sm text-gray-600">Repositories</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-purple-500 mr-4" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {containerImages.reduce((sum, img) => {
                  const size = parseFloat(img.size.replace(' MB', ''));
                  return sum + size;
                }, 0).toFixed(1)} MB
              </div>
              <div className="text-sm text-gray-600">Total Size</div>
            </div>
          </div>
        </div>
      </div>

      {/* Container Images */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Container Images</h2>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Upload className="h-4 w-4 mr-2" />
            Push Image
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Image</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Tag</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Size</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Vulnerabilities</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Last Pushed</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {containerImages.map((image) => (
                <tr key={image.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-blue-500 mr-3" />
                      <span className="font-medium text-gray-900">{image.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {image.tag}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{image.size}</td>
                  <td className="py-3 px-4">
                    {image.vulnerabilities > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {image.vulnerabilities}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Clean
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      image.status === 'active' ? 'bg-green-100 text-green-800' :
                      image.status === 'scanning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {image.status === 'scanning' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                      {image.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{image.lastPushed}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setSelectedImage(image)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => scanImage(image.id)}
                        className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                        title="Scan for Vulnerabilities"
                        disabled={image.status === 'scanning'}
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => deleteImage(image.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repositories */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Repositories</h2>
          <button 
            onClick={() => setShowCreateRepo(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Database className="h-4 w-4 mr-2" />
            New Repository
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {repositories.map((repo) => (
            <div key={repo.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{repo.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  repo.access === 'private' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {repo.access}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{repo.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                <div>
                  <span className="font-medium">{repo.imageCount}</span> images
                </div>
                <div>
                  <span className="font-medium">{repo.vulnerabilityCount}</span> vulnerabilities
                </div>
                <div>
                  <span className="font-medium">{repo.totalSize}</span> total size
                </div>
                <div>
                  Last activity: {repo.lastActivity}
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Images
                </button>
                <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                  Manage Access
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-500 mr-3" />
              <span className="font-medium">Security Scan All</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </button>
          
          <button className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-green-500 mr-3" />
              <span className="font-medium">Registry Settings</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </button>
          
          <button className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-purple-500 mr-3" />
              <span className="font-medium">User Management</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Status Footer */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                harborStatus === 'online' ? 'bg-green-500' :
                harborStatus === 'starting' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
              <span className="text-gray-600">Registry: {harborStatus === 'online' ? 'Online' : harborStatus === 'starting' ? 'Starting' : 'Offline'}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Storage: Healthy</span>
            </div>
          </div>
          <div className="text-gray-500">
            Psalm 28:7
          </div>
        </div>
      </div>

      {/* Back to Launchpad */}
      <div className="text-center mt-8">
        <button
          onClick={() => router.push('/launchpad')}
          className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Launchpad
        </button>
      </div>

      {/* Image Details Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedImage.name}:{selectedImage.tag}</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Digest</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedImage.digest}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Size</label>
                  <p className="text-sm text-gray-900">{selectedImage.size}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Architecture</label>
                  <p className="text-sm text-gray-900">{selectedImage.architecture}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">OS</label>
                  <p className="text-sm text-gray-900">{selectedImage.os}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Vulnerabilities</label>
                <p className="text-sm text-gray-900">
                  {selectedImage.vulnerabilities > 0 
                    ? `${selectedImage.vulnerabilities} vulnerabilities found` 
                    : 'No vulnerabilities detected'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Pushed</label>
                <p className="text-sm text-gray-900">{selectedImage.lastPushed}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => scanImage(selectedImage.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={selectedImage.status === 'scanning'}
              >
                {selectedImage.status === 'scanning' ? 'Scanning...' : 'Scan for Vulnerabilities'}
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
