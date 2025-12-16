/**
 * Shared platform metrics hook
 * Single source of truth for all dashboard counts (Command Center, Hub, Sidebar)
 */

import { useState, useEffect } from 'react';
import { api } from './api';

export interface VulnerabilityMetrics {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface AgentMetrics {
  total: number;
  active: number;
  inactive: number;
}

export interface SbomMetrics {
  total: number;
  complete: number;
  pending: number;
}

export interface PlatformMetrics {
  vulnerabilities: VulnerabilityMetrics;
  agents: AgentMetrics;
  sboms: SbomMetrics;
  lastUpdated: string;
}

// In-memory cache shared across all components
let cachedMetrics: PlatformMetrics | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 30000; // 30 seconds

export function clearMetricsCache() {
  cachedMetrics = null;
  cacheTimestamp = 0;
}

/**
 * Fetch platform metrics from backend
 * Uses in-memory cache to prevent redundant requests
 * Now calls the aggregated /api/v1/metrics endpoint for consistency
 */
async function fetchPlatformMetrics(): Promise<PlatformMetrics> {
  // Check cache first
  const now = Date.now();
  if (cachedMetrics && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedMetrics;
  }

  try {
    // Fetch from aggregated v1 metrics endpoint
    const response = await api.get<{
      vulnerabilities: VulnerabilityMetrics;
      agents: AgentMetrics;
      sboms: SbomMetrics;
      scans: { total: number; last_24h: number; last_scan: string | null };
      last_updated: string;
    }>('/api/v1/metrics');

    const metrics: PlatformMetrics = {
      vulnerabilities: response.vulnerabilities,
      agents: response.agents,
      sboms: response.sboms,
      lastUpdated: response.last_updated,
    };

    // Update cache
    cachedMetrics = metrics;
    cacheTimestamp = now;

    return metrics;
  } catch (error) {
    console.error('Error fetching platform metrics from v1 API:', error);
    
    // Return cached data if available
    if (cachedMetrics) {
      console.warn('Using cached metrics due to API error');
      return cachedMetrics;
    }

    // Fallback to zeros
    console.warn('No cached data available, returning empty metrics');
    return {
      vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
      agents: { total: 0, active: 0, inactive: 0 },
      sboms: { total: 0, complete: 0, pending: 0 },
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * React hook for consuming platform metrics
 * Returns loading state, metrics, and refresh function
 */
export function usePlatformMetrics(autoRefresh: boolean = false, refreshInterval: number = 30000) {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    agents: { total: 0, active: 0, inactive: 0 },
    sboms: { total: 0, complete: 0, pending: 0 },
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPlatformMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();

    if (autoRefresh) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return {
    metrics,
    loading,
    error,
    refresh,
  };
}

