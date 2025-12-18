import { NextRequest, NextResponse } from 'next/server';
import type {
  Entity,
  Relationship,
  Community,
  GraphStats,
  SearchResult,
  KnowledgeGraphResponse,
  GraphNode,
  GraphEdge,
  EntityType,
  RelationshipType,
  SearchMode
} from '@/lib/graph-rag-types';

// Demo data for the knowledge graph
const demoEntities: Entity[] = [
  {
    id: 'vuln-1',
    name: 'CVE-2024-1234',
    type: 'vulnerability',
    description: 'Remote code execution vulnerability in log4j library',
    properties: { severity: 'critical', cvss: 9.8, published: '2024-01-15' },
    aliases: ['Log4Shell variant'],
    communityId: 'comm-logging',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pkg-1',
    name: 'log4j-core',
    type: 'package',
    description: 'Apache Log4j Core logging library',
    properties: { version: '2.14.0', ecosystem: 'maven' },
    aliases: ['log4j', 'apache-log4j'],
    communityId: 'comm-logging',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pkg-2',
    name: 'spring-boot-starter',
    type: 'package',
    description: 'Spring Boot starter dependency',
    properties: { version: '2.7.0', ecosystem: 'maven' },
    aliases: ['spring-boot'],
    communityId: 'comm-spring',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'container-1',
    name: 'api-gateway-prod',
    type: 'container',
    description: 'Production API Gateway container',
    properties: { image: 'optimal/api-gateway:1.2.0', runtime: 'containerd' },
    aliases: [],
    communityId: 'comm-prod',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'container-2',
    name: 'portal-prod',
    type: 'container',
    description: 'Production Portal container',
    properties: { image: 'optimal/portal:2.1.0', runtime: 'containerd' },
    aliases: [],
    communityId: 'comm-prod',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cwe-1',
    name: 'CWE-502',
    type: 'cwe',
    description: 'Deserialization of Untrusted Data',
    properties: { category: 'Data Processing Errors' },
    aliases: ['Insecure Deserialization'],
    communityId: 'comm-cwe',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'agent-1',
    name: 'Security Scanner Agent',
    type: 'agent',
    description: 'Automated vulnerability scanning agent',
    properties: { status: 'active', scansCompleted: 1247 },
    aliases: ['vuln-scanner'],
    communityId: 'comm-agents',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'threat-1',
    name: 'APT29',
    type: 'threat_actor',
    description: 'Advanced persistent threat group',
    properties: { country: 'Unknown', motivation: 'Espionage' },
    aliases: ['Cozy Bear', 'The Dukes'],
    communityId: 'comm-threats',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'attack-1',
    name: 'JNDI Injection',
    type: 'attack_pattern',
    description: 'Java Naming and Directory Interface injection attack',
    properties: { mitre_id: 'T1190' },
    aliases: ['JNDI Lookup Attack'],
    communityId: 'comm-attacks',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'repo-1',
    name: 'optimal-platform',
    type: 'repository',
    description: 'Main Optimal Platform repository',
    properties: { url: 'https://github.com/optimal-cyber/launchpad', language: 'TypeScript' },
    aliases: ['launchpad'],
    communityId: 'comm-repos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const demoRelationships: Relationship[] = [
  {
    id: 'rel-1',
    sourceId: 'vuln-1',
    targetId: 'pkg-1',
    type: 'affects',
    properties: { severity: 'critical' },
    confidence: 0.99,
    weight: 1.0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rel-2',
    sourceId: 'pkg-2',
    targetId: 'pkg-1',
    type: 'depends_on',
    properties: { scope: 'compile' },
    confidence: 1.0,
    weight: 0.8,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rel-3',
    sourceId: 'container-1',
    targetId: 'pkg-2',
    type: 'contains',
    properties: {},
    confidence: 1.0,
    weight: 0.9,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rel-4',
    sourceId: 'container-2',
    targetId: 'pkg-2',
    type: 'contains',
    properties: {},
    confidence: 1.0,
    weight: 0.9,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rel-5',
    sourceId: 'vuln-1',
    targetId: 'cwe-1',
    type: 'related_to',
    properties: {},
    confidence: 0.95,
    weight: 0.7,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rel-6',
    sourceId: 'agent-1',
    targetId: 'container-1',
    type: 'managed_by',
    properties: {},
    confidence: 1.0,
    weight: 0.6,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rel-7',
    sourceId: 'threat-1',
    targetId: 'attack-1',
    type: 'exploits',
    properties: {},
    confidence: 0.85,
    weight: 0.9,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rel-8',
    sourceId: 'attack-1',
    targetId: 'vuln-1',
    type: 'exploits',
    properties: {},
    confidence: 0.92,
    weight: 1.0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rel-9',
    sourceId: 'repo-1',
    targetId: 'container-1',
    type: 'derives_from',
    properties: {},
    confidence: 1.0,
    weight: 0.8,
    createdAt: new Date().toISOString()
  }
];

const demoCommunities: Community[] = [
  {
    id: 'comm-logging',
    name: 'Logging Infrastructure',
    summary: 'Logging libraries and related vulnerabilities including Log4j ecosystem',
    entities: ['vuln-1', 'pkg-1'],
    keyNodes: ['pkg-1'],
    level: 0,
    childCommunityIds: []
  },
  {
    id: 'comm-spring',
    name: 'Spring Framework',
    summary: 'Spring Boot and related Java framework components',
    entities: ['pkg-2'],
    keyNodes: ['pkg-2'],
    level: 0,
    childCommunityIds: []
  },
  {
    id: 'comm-prod',
    name: 'Production Infrastructure',
    summary: 'Production containers and deployment infrastructure',
    entities: ['container-1', 'container-2'],
    keyNodes: ['container-1'],
    level: 0,
    childCommunityIds: []
  },
  {
    id: 'comm-threats',
    name: 'Threat Landscape',
    summary: 'Known threat actors and attack patterns',
    entities: ['threat-1', 'attack-1'],
    keyNodes: ['threat-1'],
    level: 0,
    childCommunityIds: []
  }
];

// GET - Retrieve knowledge graph data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'graph';
  const query = searchParams.get('query');
  const mode = (searchParams.get('mode') || 'hybrid') as SearchMode;
  const entityTypes = searchParams.get('entityTypes')?.split(',') as EntityType[] | undefined;

  try {
    switch (action) {
      case 'stats':
        return NextResponse.json(getGraphStats());

      case 'search':
        if (!query) {
          return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
        }
        return NextResponse.json(searchGraph(query, mode, entityTypes));

      case 'entities':
        return NextResponse.json({
          entities: filterEntities(entityTypes),
          total: demoEntities.length
        });

      case 'relationships':
        return NextResponse.json({
          relationships: demoRelationships,
          total: demoRelationships.length
        });

      case 'communities':
        return NextResponse.json({
          communities: demoCommunities,
          total: demoCommunities.length
        });

      case 'graph':
      default:
        return NextResponse.json(buildGraphResponse(entityTypes));
    }
  } catch (error) {
    console.error('Knowledge graph error:', error);
    return NextResponse.json(
      { error: 'Failed to process knowledge graph request' },
      { status: 500 }
    );
  }
}

// POST - Add entities/relationships or run complex queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'search':
        const { query, mode = 'hybrid', filters } = data;
        return NextResponse.json(searchGraph(query, mode, filters?.entityTypes));

      case 'traverse':
        const { startNodeId, endNodeId, maxHops = 3 } = data;
        return NextResponse.json(traverseGraph(startNodeId, endNodeId, maxHops));

      case 'patterns':
        return NextResponse.json(detectPatterns());

      case 'add_entity':
        // In production, this would persist to database
        return NextResponse.json({ success: true, message: 'Entity added (demo mode)' });

      case 'add_relationship':
        return NextResponse.json({ success: true, message: 'Relationship added (demo mode)' });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Knowledge graph POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function getGraphStats(): GraphStats {
  const entityTypeDistribution: Record<string, number> = {};
  const relationshipTypeDistribution: Record<string, number> = {};

  demoEntities.forEach(e => {
    entityTypeDistribution[e.type] = (entityTypeDistribution[e.type] || 0) + 1;
  });

  demoRelationships.forEach(r => {
    relationshipTypeDistribution[r.type] = (relationshipTypeDistribution[r.type] || 0) + 1;
  });

  return {
    totalEntities: demoEntities.length,
    totalRelationships: demoRelationships.length,
    totalCommunities: demoCommunities.length,
    entityTypeDistribution: entityTypeDistribution as Record<EntityType, number>,
    relationshipTypeDistribution: relationshipTypeDistribution as Record<RelationshipType, number>,
    averageDegree: (demoRelationships.length * 2) / demoEntities.length,
    density: (2 * demoRelationships.length) / (demoEntities.length * (demoEntities.length - 1)),
    lastUpdated: new Date().toISOString()
  };
}

function filterEntities(types?: EntityType[]): Entity[] {
  if (!types || types.length === 0) return demoEntities;
  return demoEntities.filter(e => types.includes(e.type));
}

function searchGraph(query: string, mode: SearchMode, entityTypes?: EntityType[]): SearchResult {
  const startTime = Date.now();
  const lowerQuery = query.toLowerCase();

  // Simple search implementation - in production would use embeddings
  const matchingEntities = demoEntities.filter(e =>
    e.name.toLowerCase().includes(lowerQuery) ||
    e.description?.toLowerCase().includes(lowerQuery) ||
    e.aliases.some(a => a.toLowerCase().includes(lowerQuery))
  );

  const entityIds = new Set(matchingEntities.map(e => e.id));
  const matchingRelationships = demoRelationships.filter(r =>
    entityIds.has(r.sourceId) || entityIds.has(r.targetId)
  );

  const communityIds = new Set(matchingEntities.map(e => e.communityId).filter(Boolean));
  const matchingCommunities = demoCommunities.filter(c => communityIds.has(c.id));

  // Generate answer based on findings
  let answer = '';
  if (matchingEntities.length > 0) {
    const vulns = matchingEntities.filter(e => e.type === 'vulnerability');
    const packages = matchingEntities.filter(e => e.type === 'package');

    if (vulns.length > 0) {
      answer = `Found ${vulns.length} vulnerability(ies) matching "${query}". `;
      vulns.forEach(v => {
        answer += `${v.name}: ${v.description}. `;
      });
    }
    if (packages.length > 0) {
      answer += `Found ${packages.length} package(s) related to the query. `;
    }
  } else {
    answer = `No entities found matching "${query}". Try broadening your search terms.`;
  }

  return {
    query,
    answer,
    confidence: matchingEntities.length > 0 ? 0.85 : 0.3,
    sources: matchingEntities.slice(0, 3).map(e => ({
      documentId: e.id,
      title: e.name,
      snippet: e.description || '',
      relevanceScore: 0.9,
      entityIds: [e.id]
    })),
    entities: matchingEntities,
    relationships: matchingRelationships,
    communities: matchingCommunities,
    searchMode: mode,
    processingTimeMs: Date.now() - startTime
  };
}

function buildGraphResponse(entityTypes?: EntityType[]): KnowledgeGraphResponse {
  const startTime = Date.now();
  const filteredEntities = filterEntities(entityTypes);
  const entityIds = new Set(filteredEntities.map(e => e.id));

  const nodes: GraphNode[] = filteredEntities.map((entity, index) => ({
    id: entity.id,
    label: entity.name,
    type: entity.type,
    data: entity,
    position: {
      x: Math.cos(index * 2 * Math.PI / filteredEntities.length) * 300 + 400,
      y: Math.sin(index * 2 * Math.PI / filteredEntities.length) * 300 + 300
    },
    style: getNodeStyle(entity.type)
  }));

  const edges: GraphEdge[] = demoRelationships
    .filter(r => entityIds.has(r.sourceId) && entityIds.has(r.targetId))
    .map(rel => ({
      id: rel.id,
      source: rel.sourceId,
      target: rel.targetId,
      label: rel.type.replace(/_/g, ' '),
      type: rel.type,
      data: rel,
      animated: rel.type === 'affects' || rel.type === 'exploits'
    }));

  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      queryTimeMs: Date.now() - startTime
    }
  };
}

function getNodeStyle(type: EntityType): Record<string, unknown> {
  const styles: Record<string, Record<string, unknown>> = {
    vulnerability: { background: '#ef4444', color: '#fff' },
    package: { background: '#3b82f6', color: '#fff' },
    container: { background: '#10b981', color: '#fff' },
    cve: { background: '#f59e0b', color: '#000' },
    cwe: { background: '#8b5cf6', color: '#fff' },
    agent: { background: '#06b6d4', color: '#fff' },
    threat_actor: { background: '#dc2626', color: '#fff' },
    attack_pattern: { background: '#ea580c', color: '#fff' },
    repository: { background: '#6366f1', color: '#fff' },
    system: { background: '#64748b', color: '#fff' },
    image: { background: '#0891b2', color: '#fff' },
    service: { background: '#059669', color: '#fff' },
    person: { background: '#7c3aed', color: '#fff' },
    organization: { background: '#2563eb', color: '#fff' },
    tool: { background: '#475569', color: '#fff' },
    malware: { background: '#b91c1c', color: '#fff' }
  };
  return styles[type] || { background: '#6b7280', color: '#fff' };
}

function traverseGraph(startId: string, endId: string, maxHops: number) {
  // BFS traversal - simplified implementation
  const visited = new Set<string>();
  const queue: { nodeId: string; path: string[] }[] = [{ nodeId: startId, path: [startId] }];

  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!;

    if (nodeId === endId) {
      return {
        found: true,
        path: path.map(id => demoEntities.find(e => e.id === id)),
        hops: path.length - 1
      };
    }

    if (path.length > maxHops) continue;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    // Find connected nodes
    const connectedRels = demoRelationships.filter(
      r => r.sourceId === nodeId || r.targetId === nodeId
    );

    for (const rel of connectedRels) {
      const nextNode = rel.sourceId === nodeId ? rel.targetId : rel.sourceId;
      if (!visited.has(nextNode)) {
        queue.push({ nodeId: nextNode, path: [...path, nextNode] });
      }
    }
  }

  return { found: false, path: [], hops: -1 };
}

function detectPatterns() {
  // Detect vulnerability propagation patterns
  const patterns = [];

  // Pattern: Vulnerability -> Package -> Container chain
  const vulnPackageContainer = demoRelationships
    .filter(r => r.type === 'affects')
    .map(affectsRel => {
      const containsRels = demoRelationships.filter(
        r => r.type === 'contains' || r.type === 'depends_on'
      );
      return { vulnerability: affectsRel.sourceId, propagation: containsRels };
    });

  if (vulnPackageContainer.length > 0) {
    patterns.push({
      id: 'pattern-vuln-propagation',
      name: 'Vulnerability Propagation',
      description: 'Vulnerabilities that propagate through dependency chains to containers',
      occurrences: vulnPackageContainer.length,
      severity: 'high',
      recommendedActions: [
        'Update affected packages to patched versions',
        'Rebuild and redeploy affected containers',
        'Enable runtime protection for affected workloads'
      ]
    });
  }

  // Pattern: Threat Actor -> Attack Pattern -> Vulnerability chain
  const threatChain = demoRelationships.filter(r => r.type === 'exploits');
  if (threatChain.length > 0) {
    patterns.push({
      id: 'pattern-threat-chain',
      name: 'Active Threat Chain',
      description: 'Known threat actors exploiting vulnerabilities in your environment',
      occurrences: threatChain.length,
      severity: 'critical',
      recommendedActions: [
        'Implement additional monitoring for affected systems',
        'Enable threat intelligence feeds',
        'Review incident response procedures'
      ]
    });
  }

  return { patterns, totalPatterns: patterns.length };
}

export const dynamic = 'force-dynamic';
