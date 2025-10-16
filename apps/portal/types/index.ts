export interface Project {
  id: string;
  name: string;
  gitlab_project_id?: number;
  repo_url?: string;
  default_branch?: string;
  last_pipeline?: string;
  sync_state: string;
}

export interface Vulnerability {
  id: string;
  vuln_id: string;
  severity: string;
  status: string;
  gitlab_project_id?: number;
  pipeline_id?: number;
  sha?: string;
  discovered: string;
}

export interface SBOMDocument {
  id: string;
  format: string;
  components_count: number;
  gitlab_project_id?: number;
  pipeline_id?: number;
  sha?: string;
  created_at: string;
}

