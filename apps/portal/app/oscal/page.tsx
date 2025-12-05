'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Download, 
  RefreshCw,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Users,
  Building,
  Lock,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface OSCALMetadata {
  title: string;
  lastModified: string;
  version: string;
  oscalVersion: string;
  marking?: string;
}

interface Role {
  id: string;
  title: string;
}

interface Location {
  uuid: string;
  title: string;
  address: {
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface Party {
  uuid: string;
  type: string;
  name: string;
  emailAddresses?: string[];
}

interface SystemCharacteristics {
  systemName: string;
  systemId: string;
  description: string;
  securitySensitivityLevel: string;
  systemInformation: {
    informationType: string;
    confidentialityImpact: string;
    integrityImpact: string;
    availabilityImpact: string;
  }[];
}

interface ControlImplementation {
  controlId: string;
  title: string;
  implementationStatus: string;
  description: string;
}

export default function OSCALPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [oscalData, setOSCALData] = useState<any>(null);
  const [metadata, setMetadata] = useState<OSCALMetadata | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [controls, setControls] = useState<ControlImplementation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadOSCALData();
  }, []);

  const loadOSCALData = async () => {
    try {
      const response = await fetch('/eMASS_OSCAL_SSP.json');
      const data = await response.json();
      
      console.log('Loaded OSCAL data:', data);
      setOSCALData(data);

      // Extract metadata
      if (data['system-security-plan']?.metadata) {
        const meta = data['system-security-plan'].metadata;
        setMetadata({
          title: meta.title || 'Unknown',
          lastModified: meta['last-modified'] || '',
          version: meta.version || '',
          oscalVersion: meta['oscal-version'] || '',
          marking: meta.props?.find((p: any) => p.name === 'marking')?.value
        });
        
        // Extract roles
        if (meta.roles) {
          setRoles(meta.roles.map((r: any) => ({
            id: r.id,
            title: r.title
          })));
        }

        // Extract locations
        if (meta.locations) {
          setLocations(meta.locations.slice(0, 10).map((l: any) => ({
            uuid: l.uuid,
            title: l.title,
            address: {
              city: l.address?.city || '',
              state: l.address?.state || '',
              postalCode: l.address?.['postal-code'] || '',
              country: l.address?.country || ''
            }
          })));
        }

        // Extract parties
        if (meta.parties) {
          setParties(meta.parties.slice(0, 20).map((p: any) => ({
            uuid: p.uuid,
            type: p.type || 'organization',
            name: p.name || p['party-name'] || 'Unknown',
            emailAddresses: p['email-addresses'] || []
          })));
        }
      }

      // Extract control implementations
      if (data['system-security-plan']?.['control-implementation']?.['implemented-requirements']) {
        const controlReqs = data['system-security-plan']['control-implementation']['implemented-requirements'];
        const controlsData = controlReqs.slice(0, 50).map((req: any, idx: number) => ({
          controlId: req['control-id'] || `CTRL-${idx}`,
          title: req.props?.find((p: any) => p.name === 'label')?.value || req['control-id'] || `Control ${idx}`,
          implementationStatus: req.props?.find((p: any) => p.name === 'implementation-status')?.value || 'implemented',
          description: req.statements?.[0]?.description || req.description || 'No description available'
        }));
        setControls(controlsData);
      }

    } catch (error) {
      console.error('Error loading OSCAL data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getImplementationStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'implemented':
        return 'bg-green-100 text-green-800';
      case 'partially-implemented':
        return 'bg-yellow-100 text-yellow-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'not-applicable':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredControls = controls.filter(control =>
    searchTerm === '' ||
    control.controlId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    control.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    control.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground text-lg">Loading OSCAL SSP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="apollo-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">OSCAL System Security Plan</h1>
            <p className="text-sm text-muted-foreground">Open Security Controls Assessment Language Documentation</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadOSCALData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Tabs */}
        <div className="apollo-tabs mb-6">
          <button 
            className={`apollo-tab ${activeTab === 'overview' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`apollo-tab ${activeTab === 'controls' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('controls')}
          >
            Controls <span className="apollo-badge apollo-badge-info ml-1">{controls.length}</span>
          </button>
          <button 
            className={`apollo-tab ${activeTab === 'roles' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            Roles
          </button>
          <button 
            className={`apollo-tab ${activeTab === 'locations' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            Locations
          </button>
          <button 
            className={`apollo-tab ${activeTab === 'parties' ? 'apollo-tab-active' : ''}`}
            onClick={() => setActiveTab('parties')}
          >
            Parties
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && metadata && (
          <div className="space-y-6">
            {/* System Information Card */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{metadata.title}</h2>
                  <p className="text-sm text-muted-foreground">OSCAL Version {metadata.oscalVersion}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">System Version</label>
                  <p className="text-sm text-foreground font-mono">{metadata.version}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Last Modified</label>
                  <p className="text-sm text-foreground">{formatDate(metadata.lastModified)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Classification</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {metadata.marking || 'UNCLASSIFIED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="apollo-metric-card">
                <div className="apollo-metric-value text-primary">{controls.length}</div>
                <div className="apollo-metric-label">Total Controls</div>
              </div>
              <div className="apollo-metric-card">
                <div className="apollo-metric-value text-green-500">
                  {controls.filter(c => c.implementationStatus === 'implemented').length}
                </div>
                <div className="apollo-metric-label">Implemented</div>
              </div>
              <div className="apollo-metric-card">
                <div className="apollo-metric-value text-blue-500">{roles.length}</div>
                <div className="apollo-metric-label">Defined Roles</div>
              </div>
              <div className="apollo-metric-card">
                <div className="apollo-metric-value text-purple-500">{locations.length}</div>
                <div className="apollo-metric-label">Locations</div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Implementation Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Implemented</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-48 bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(controls.filter(c => c.implementationStatus === 'implemented').length / controls.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-foreground w-12 text-right">
                      {Math.round((controls.filter(c => c.implementationStatus === 'implemented').length / controls.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls Tab */}
        {activeTab === 'controls' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-4">
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search controls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">
                  {filteredControls.length} of {controls.length}
                </span>
              </div>
            </div>

            {/* Controls List */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-medium text-foreground">
                  Control Implementations ({filteredControls.length})
                </h3>
              </div>
              
              <div className="divide-y divide-border">
                {filteredControls.map((control) => (
                  <div key={control.controlId} className="p-6 hover:bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary font-mono">
                            {control.controlId}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImplementationStatusColor(control.implementationStatus)}`}>
                            {control.implementationStatus.replace(/-/g, ' ')}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-foreground mb-2">{control.title}</h4>
                        <p className="text-sm text-muted-foreground">{control.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">System Roles ({roles.length})</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <Users className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{role.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{role.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">System Locations ({locations.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {locations.map((location) => (
                <div key={location.uuid} className="p-6 hover:bg-muted/50">
                  <div className="flex items-start space-x-4">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground mb-2">{location.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {location.address.city}, {location.address.state} {location.address.postalCode}
                      </p>
                      <p className="text-sm text-muted-foreground">{location.address.country}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-2">{location.uuid}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parties Tab */}
        {activeTab === 'parties' && (
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">Responsible Parties ({parties.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {parties.map((party) => (
                <div key={party.uuid} className="p-6 hover:bg-muted/50">
                  <div className="flex items-start space-x-4">
                    <Building className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium text-foreground">{party.name}</h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {party.type}
                        </span>
                      </div>
                      {party.emailAddresses && party.emailAddresses.length > 0 && (
                        <p className="text-sm text-muted-foreground">{party.emailAddresses.join(', ')}</p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono mt-2">{party.uuid}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



