'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Network,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Download,
  Info,
  AlertTriangle,
  Package,
  Box,
  Shield,
  Database,
  GitBranch,
  Users,
  Crosshair,
  Activity,
  Loader2
} from 'lucide-react';
import type {
  Entity,
  Relationship,
  GraphNode,
  GraphEdge,
  EntityType,
  SearchResult,
  GraphStats
} from '@/lib/graph-rag-types';

interface KnowledgeGraphViewerProps {
  initialEntityTypes?: EntityType[];
  showSearch?: boolean;
  showFilters?: boolean;
  height?: string;
}

const entityTypeConfig: Record<EntityType, { icon: typeof Shield; color: string; label: string }> = {
  vulnerability: { icon: AlertTriangle, color: '#ef4444', label: 'Vulnerability' },
  package: { icon: Package, color: '#3b82f6', label: 'Package' },
  cve: { icon: Shield, color: '#f59e0b', label: 'CVE' },
  cwe: { icon: Shield, color: '#8b5cf6', label: 'CWE' },
  system: { icon: Database, color: '#64748b', label: 'System' },
  container: { icon: Box, color: '#10b981', label: 'Container' },
  image: { icon: Box, color: '#0891b2', label: 'Image' },
  agent: { icon: Activity, color: '#06b6d4', label: 'Agent' },
  service: { icon: Network, color: '#059669', label: 'Service' },
  repository: { icon: GitBranch, color: '#6366f1', label: 'Repository' },
  person: { icon: Users, color: '#7c3aed', label: 'Person' },
  organization: { icon: Users, color: '#2563eb', label: 'Organization' },
  threat_actor: { icon: Crosshair, color: '#dc2626', label: 'Threat Actor' },
  attack_pattern: { icon: Crosshair, color: '#ea580c', label: 'Attack Pattern' },
  tool: { icon: Database, color: '#475569', label: 'Tool' },
  malware: { icon: AlertTriangle, color: '#b91c1c', label: 'Malware' }
};

export default function KnowledgeGraphViewer({
  initialEntityTypes,
  showSearch = true,
  showFilters = true,
  height = '600px'
}: KnowledgeGraphViewerProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedEntityTypes, setSelectedEntityTypes] = useState<EntityType[]>(
    initialEntityTypes || []
  );
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Fetch graph data
  const fetchGraphData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const typeParam = selectedEntityTypes.length > 0
        ? `&entityTypes=${selectedEntityTypes.join(',')}`
        : '';

      const [graphRes, statsRes] = await Promise.all([
        fetch(`/api/knowledge-graph?action=graph${typeParam}`),
        fetch('/api/knowledge-graph?action=stats')
      ]);

      if (!graphRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch graph data');
      }

      const graphData = await graphRes.json();
      const statsData = await statsRes.json();

      setNodes(graphData.nodes || []);
      setEdges(graphData.edges || []);
      setStats(statsData);
    } catch (err) {
      console.error('Graph fetch error:', err);
      setError('Failed to load knowledge graph');
    } finally {
      setIsLoading(false);
    }
  }, [selectedEntityTypes]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Search handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          data: { query: searchQuery, mode: 'hybrid' }
        })
      });

      if (!response.ok) throw new Error('Search failed');
      const result = await response.json();
      setSearchResult(result);

      // Highlight matching nodes
      if (result.entities?.length > 0) {
        const matchedIds = new Set(result.entities.map((e: Entity) => e.id));
        setNodes(prev => prev.map(n => ({
          ...n,
          style: {
            ...n.style,
            opacity: matchedIds.has(n.id) ? 1 : 0.3,
            transform: matchedIds.has(n.id) ? 'scale(1.2)' : 'scale(1)'
          }
        })));
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search highlights
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
    setNodes(prev => prev.map(n => ({
      ...n,
      style: { ...n.style, opacity: 1, transform: 'scale(1)' }
    })));
  };

  // Toggle entity type filter
  const toggleEntityType = (type: EntityType) => {
    setSelectedEntityTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Calculate node positions for circular layout
  const positionedNodes = useMemo(() => {
    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(200, 50 * Math.sqrt(nodes.length));

    return nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      return {
        ...node,
        position: node.position || {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        }
      };
    });
  }, [nodes]);

  const getNodePosition = (nodeId: string) => {
    const node = positionedNodes.find(n => n.id === nodeId);
    return node?.position || { x: 0, y: 0 };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)] mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading Knowledge Graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <button onClick={fetchGraphData} className="mt-4 enterprise-btn enterprise-btn-secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-cyan)]/10 flex items-center justify-center">
              <Network className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <h3 className="font-medium text-[var(--text-primary)]">Knowledge Graph</h3>
              <p className="text-xs text-[var(--text-muted)]">
                {stats?.totalEntities || 0} entities • {stats?.totalRelationships || 0} relationships
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
              className="p-2 hover:bg-[var(--bg-surface)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
              className="p-2 hover:bg-[var(--bg-surface)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-2 hover:bg-[var(--bg-surface)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={fetchGraphData}
              className="p-2 hover:bg-[var(--bg-surface)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-[var(--bg-surface)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search entities, relationships, patterns..."
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)]"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="enterprise-btn enterprise-btn-primary"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
            {searchResult && (
              <button onClick={clearSearch} className="enterprise-btn enterprise-btn-secondary">
                Clear
              </button>
            )}
          </div>
        )}

        {/* Search Result */}
        {searchResult && (
          <div className="p-3 bg-[var(--bg-surface)] rounded-lg mb-4">
            <p className="text-sm text-[var(--text-primary)] mb-2">{searchResult.answer}</p>
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span>Confidence: {Math.round(searchResult.confidence * 100)}%</span>
              <span>Found: {searchResult.entities.length} entities</span>
              <span>Time: {searchResult.processingTimeMs}ms</span>
            </div>
          </div>
        )}

        {/* Entity Type Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(entityTypeConfig).map(([type, config]) => {
              const count = nodes.filter(n => n.type === type).length;
              if (count === 0 && selectedEntityTypes.length === 0) return null;

              const isSelected = selectedEntityTypes.length === 0 || selectedEntityTypes.includes(type as EntityType);
              const Icon = config.icon;

              return (
                <button
                  key={type}
                  onClick={() => toggleEntityType(type as EntityType)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-all ${
                    isSelected
                      ? 'border-[var(--border-default)] bg-[var(--bg-surface)]'
                      : 'border-transparent bg-[var(--bg-elevated)] opacity-50'
                  }`}
                  style={{ borderColor: isSelected ? config.color : undefined }}
                >
                  <Icon className="w-3 h-3" style={{ color: config.color }} />
                  <span className="text-[var(--text-primary)]">{config.label}</span>
                  <span className="text-[var(--text-muted)]">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Graph Canvas */}
      <div className="relative" style={{ height }}>
        <svg
          className="w-full h-full bg-[var(--bg-primary)]"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center'
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-muted)" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map(edge => {
            const source = getNodePosition(edge.source);
            const target = getNodePosition(edge.target);
            return (
              <g key={edge.id}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="var(--border-subtle)"
                  strokeWidth={1}
                  markerEnd="url(#arrowhead)"
                  className={edge.animated ? 'animate-pulse' : ''}
                />
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - 5}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {positionedNodes.map(node => {
            const config = entityTypeConfig[node.type];
            const Icon = config?.icon || Shield;
            const color = config?.color || '#6b7280';
            const isSelected = selectedNode?.id === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.position?.x || 0}, ${node.position?.y || 0})`}
                onClick={() => setSelectedNode(isSelected ? null : node)}
                className="cursor-pointer"
                style={node.style as React.CSSProperties}
              >
                <circle
                  r={isSelected ? 28 : 24}
                  fill={color}
                  opacity={0.9}
                  className="transition-all"
                />
                <circle
                  r={isSelected ? 32 : 28}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  opacity={0.3}
                />
                <text
                  y={40}
                  fill="var(--text-primary)"
                  fontSize="11"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entityTypeConfig[selectedNode.type]?.color }}
                  />
                  <span className="text-xs text-[var(--text-muted)] uppercase">
                    {entityTypeConfig[selectedNode.type]?.label || selectedNode.type}
                  </span>
                </div>
                <h4 className="font-medium text-[var(--text-primary)]">{selectedNode.label}</h4>
                {selectedNode.data.description && (
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {selectedNode.data.description}
                  </p>
                )}
                {selectedNode.data.properties && Object.keys(selectedNode.data.properties).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(selectedNode.data.properties).slice(0, 4).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-2 py-0.5 bg-[var(--bg-surface)] rounded text-xs text-[var(--text-muted)]"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Drag to pan • Scroll to zoom • Click nodes for details</span>
          <span>
            GraphRAG Engine • {stats?.averageDegree?.toFixed(1) || 0} avg. connections
          </span>
        </div>
      </div>
    </div>
  );
}
