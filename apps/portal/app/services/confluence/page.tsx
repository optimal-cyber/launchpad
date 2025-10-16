"use client";

import { useRouter } from 'next/navigation';
import { 
  FileText, 
  ArrowLeft,
  Home,
  ArrowRight,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  Tag,
  BookOpen,
  FolderOpen,
  Clock
} from 'lucide-react';

export default function Confluence() {
  const router = useRouter();

  const spaces = [
    {
      id: 'space-001',
      name: 'DevSecOps',
      key: 'DEVSEC',
      description: 'Development, Security, and Operations documentation',
      pageCount: 45,
      lastUpdated: '2 hours ago',
      type: 'team'
    },
    {
      id: 'space-002',
      name: 'Infrastructure',
      key: 'INFRA',
      description: 'Infrastructure and deployment documentation',
      pageCount: 23,
      lastUpdated: '1 day ago',
      type: 'technical'
    },
    {
      id: 'space-003',
      name: 'Security',
      key: 'SEC',
      description: 'Security policies and procedures',
      pageCount: 67,
      lastUpdated: '3 hours ago',
      type: 'team'
    }
  ];

  const recentPages = [
    {
      id: 'page-001',
      title: 'Vulnerability Management Process',
      space: 'DevSecOps',
      author: 'Security Team',
      lastModified: '2 hours ago',
      views: 156
    },
    {
      id: 'page-002',
      title: 'Container Security Best Practices',
      space: 'Security',
      author: 'DevOps Team',
      lastModified: '4 hours ago',
      views: 89
    },
    {
      id: 'page-003',
      title: 'SBOM Analysis Workflow',
      space: 'DevSecOps',
      author: 'Security Team',
      lastModified: '1 day ago',
      views: 234
    }
  ];

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
          <span className="text-gray-900 font-medium">Confluence</span>
        </nav>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Confluence</h1>
        <p className="text-xl text-gray-600">Documentation and Knowledge Management</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-sm text-gray-600">Spaces</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <div className="text-2xl font-bold text-gray-900">135</div>
              <div className="text-sm text-gray-600">Pages</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500 mr-4" />
            <div>
              <div className="text-2xl font-bold text-gray-900">12</div>
              <div className="text-sm text-gray-600">Contributors</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-500 mr-4" />
            <div>
              <div className="text-2xl font-bold text-gray-900">2h</div>
              <div className="text-sm text-gray-600">Last Update</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search pages, spaces, and people..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </button>
        </div>
      </div>

      {/* Spaces */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Spaces</h2>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            New Space
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <div key={space.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{space.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  space.type === 'team' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {space.type}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{space.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Key: {space.key}</span>
                <span>{space.pageCount} pages</span>
              </div>
              <div className="text-xs text-gray-400">
                Last updated: {space.lastUpdated}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Pages */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Pages</h2>
          <button className="text-blue-600 hover:text-blue-700 transition-colors">
            View All Pages
          </button>
        </div>
        
        <div className="space-y-4">
          {recentPages.map((page) => (
            <div key={page.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="font-medium text-gray-900">{page.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{page.space}</span>
                    <span>by {page.author}</span>
                    <span>{page.lastModified}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{page.views} views</span>
                <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                  <Edit className="h-4 w-4" />
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
              <FileText className="h-5 w-5 text-blue-500 mr-3" />
              <span className="font-medium">Create Page</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </button>
          
          <button className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors">
            <div className="flex items-center">
              <FolderOpen className="h-5 w-5 text-green-500 mr-3" />
              <span className="font-medium">New Space</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </button>
          
          <button className="flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-purple-500 mr-3" />
              <span className="font-medium">Invite Users</span>
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
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Service: Online</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Storage: Healthy</span>
            </div>
          </div>
          <div className="text-gray-500">
            "Your word is a lamp to my feet" - Psalm 119:105
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
    </div>
  );
}
