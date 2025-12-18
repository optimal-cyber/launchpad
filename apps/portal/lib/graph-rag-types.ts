// GraphRAG Types - Inspired by JADE Platform
// Graph-based Retrieval Augmented Generation for security intelligence

export type SearchMode = 'global' | 'local' | 'hybrid';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  properties: Record<string, unknown>;
  aliases: string[];
  communityId?: string;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}

export type EntityType =
  | 'vulnerability'
  | 'package'
  | 'cve'
  | 'cwe'
  | 'system'
  | 'container'
  | 'image'
  | 'agent'
  | 'service'
  | 'repository'
  | 'person'
  | 'organization'
  | 'threat_actor'
  | 'attack_pattern'
  | 'tool'
  | 'malware';

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  properties: Record<string, unknown>;
  confidence: number;
  weight: number;
  createdAt: string;
}

export type RelationshipType =
  | 'depends_on'
  | 'affects'
  | 'mitigates'
  | 'exploits'
  | 'contains'
  | 'belongs_to'
  | 'communicates_with'
  | 'deployed_on'
  | 'managed_by'
  | 'related_to'
  | 'derives_from';

export interface Community {
  id: string;
  name: string;
  summary: string;
  entities: string[]; // Entity IDs
  keyNodes: string[]; // Top entities by centrality
  level: number;
  parentCommunityId?: string;
  childCommunityIds: string[];
  embedding?: number[];
}

export interface GraphDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  documentType: 'sbom' | 'scan_result' | 'policy' | 'report' | 'log';
  entities: Entity[];
  relationships: Relationship[];
  communities: Community[];
  metadata: Record<string, unknown>;
  processedAt: string;
}

export interface SearchResult {
  query: string;
  answer: string;
  confidence: number;
  sources: SearchSource[];
  entities: Entity[];
  relationships: Relationship[];
  communities: Community[];
  searchMode: SearchMode;
  processingTimeMs: number;
}

export interface SearchSource {
  documentId: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  entityIds: string[];
}

export interface GraphQuery {
  query: string;
  mode: SearchMode;
  filters?: GraphQueryFilters;
  maxResults?: number;
  includeRelationships?: boolean;
  includeCommunities?: boolean;
}

export interface GraphQueryFilters {
  entityTypes?: EntityType[];
  relationshipTypes?: RelationshipType[];
  dateRange?: {
    start: string;
    end: string;
  };
  severityLevels?: string[];
  projectIds?: string[];
}

// Entity Resolution for deduplication
export interface EntityResolution {
  canonicalId: string;
  mergedIds: string[];
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'alias' | 'abbreviation';
}

// Graph Statistics
export interface GraphStats {
  totalEntities: number;
  totalRelationships: number;
  totalCommunities: number;
  entityTypeDistribution: Record<EntityType, number>;
  relationshipTypeDistribution: Record<RelationshipType, number>;
  averageDegree: number;
  density: number;
  lastUpdated: string;
}

// Knowledge Graph Query Response
export interface KnowledgeGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    queryTimeMs: number;
  };
}

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  data: Entity;
  position?: { x: number; y: number };
  style?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: RelationshipType;
  data: Relationship;
  animated?: boolean;
  style?: Record<string, unknown>;
}

// Pattern Detection
export interface Pattern {
  id: string;
  name: string;
  description: string;
  entities: Entity[];
  relationships: Relationship[];
  occurrences: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  recommendedActions: string[];
}

// Graph Traversal
export interface TraversalPath {
  startNodeId: string;
  endNodeId: string;
  path: PathStep[];
  totalWeight: number;
  hopCount: number;
}

export interface PathStep {
  nodeId: string;
  entity: Entity;
  relationship?: Relationship;
  stepNumber: number;
}
