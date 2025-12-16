/**
 * OSCAL System Security Plan (SSP) TypeScript Interfaces
 * Based on NIST OSCAL 1.1.3 specification
 */

// ============================================================================
// Base OSCAL Types
// ============================================================================

export interface Property {
  name: string;
  value: string;
  ns?: string;
  uuid?: string;
  class?: string;
}

export interface Link {
  href: string;
  rel?: string;
  'media-type'?: string;
  text?: string;
}

export interface Annotation {
  name: string;
  uuid?: string;
  ns?: string;
  value?: string;
  remarks?: string;
}

// ============================================================================
// Metadata Types
// ============================================================================

export interface Role {
  id: string;
  title: string;
  description?: string;
  props?: Property[];
  links?: Link[];
}

export interface Address {
  type?: string;
  'addr-lines'?: string[];
  city?: string;
  state?: string;
  'postal-code'?: string;
  country?: string;
}

export interface Location {
  uuid: string;
  title?: string;
  address?: Address;
  props?: Property[];
  links?: Link[];
  remarks?: string;
}

export interface Party {
  uuid: string;
  type: number | 'organization' | 'person';
  name?: string;
  'short-name'?: string;
  'email-addresses'?: string[];
  'telephone-numbers'?: { type?: string; number: string }[];
  addresses?: Address[];
  'location-uuids'?: string[];
  props?: Property[];
  links?: Link[];
  remarks?: string;
}

export interface ResponsibleParty {
  'role-id': string;
  'party-uuids': string[];
  props?: Property[];
  links?: Link[];
  remarks?: string;
}

export interface OscalMetadata {
  title: string;
  'last-modified': string;
  version: string;
  'oscal-version': string;
  props?: Property[];
  links?: Link[];
  roles?: Role[];
  locations?: Location[];
  parties?: Party[];
  'responsible-parties'?: ResponsibleParty[];
  remarks?: string;
}

// ============================================================================
// System Characteristics Types
// ============================================================================

export interface SystemId {
  id: string;
  'identifier-type'?: string;
}

export interface InformationType {
  uuid?: string;
  title?: string;
  description?: string;
  'information-type-ids'?: { id: string; system?: string }[];
  'confidentiality-impact'?: SecurityImpact;
  'integrity-impact'?: SecurityImpact;
  'availability-impact'?: SecurityImpact;
  props?: Property[];
}

export interface SecurityImpact {
  base?: string;
  selected?: string;
  'adjustment-justification'?: string;
}

export interface SystemInformation {
  props?: Property[];
  links?: Link[];
  'information-types'?: InformationType[];
}

export interface SecurityImpactLevel {
  'security-objective-confidentiality'?: string;
  'security-objective-integrity'?: string;
  'security-objective-availability'?: string;
}

export interface AuthorizationBoundary {
  description?: string;
  props?: Property[];
  links?: Link[];
  diagrams?: Diagram[];
  remarks?: string;
}

export interface Diagram {
  uuid: string;
  description?: string;
  props?: Property[];
  links?: Link[];
  caption?: string;
  remarks?: string;
}

export interface SystemCharacteristics {
  'system-ids': SystemId[];
  'system-name': string;
  'system-name-short'?: string;
  description?: string;
  props?: Property[];
  links?: Link[];
  'date-authorized'?: string;
  'security-sensitivity-level'?: string;
  'system-information'?: SystemInformation;
  'security-impact-level'?: SecurityImpactLevel;
  status?: { state: string; remarks?: string };
  'authorization-boundary'?: AuthorizationBoundary;
  'network-architecture'?: AuthorizationBoundary;
  'data-flow'?: AuthorizationBoundary;
  'responsible-parties'?: ResponsibleParty[];
  remarks?: string;
}

// ============================================================================
// System Implementation Types
// ============================================================================

export interface Component {
  uuid: string;
  type: string;
  title: string;
  description?: string;
  purpose?: string;
  props?: Property[];
  links?: Link[];
  status?: { state: string; remarks?: string };
  'responsible-roles'?: ResponsibleRole[];
  protocols?: Protocol[];
  remarks?: string;
}

export interface Protocol {
  uuid?: string;
  name: string;
  title?: string;
  'port-ranges'?: PortRange[];
}

export interface PortRange {
  start?: number;
  end?: number;
  transport?: 'TCP' | 'UDP';
}

export interface User {
  uuid: string;
  title?: string;
  description?: string;
  props?: Property[];
  links?: Link[];
  'role-ids'?: string[];
  'authorized-privileges'?: AuthorizedPrivilege[];
  remarks?: string;
}

export interface AuthorizedPrivilege {
  title: string;
  description?: string;
  'functions-performed': string[];
}

export interface InventoryItem {
  uuid: string;
  description: string;
  props?: Property[];
  links?: Link[];
  'responsible-parties'?: ResponsibleParty[];
  'implemented-components'?: ImplementedComponent[];
  remarks?: string;
}

export interface ImplementedComponent {
  'component-uuid': string;
  props?: Property[];
  links?: Link[];
  'responsible-parties'?: ResponsibleParty[];
  remarks?: string;
}

export interface SystemImplementation {
  props?: Property[];
  links?: Link[];
  'leveraged-authorizations'?: LeveragedAuthorization[];
  users?: User[];
  components?: Component[];
  'inventory-items'?: InventoryItem[];
  remarks?: string;
}

export interface LeveragedAuthorization {
  uuid: string;
  title: string;
  props?: Property[];
  links?: Link[];
  'party-uuid': string;
  'date-authorized'?: string;
  remarks?: string;
}

// ============================================================================
// Control Implementation Types
// ============================================================================

export interface ResponsibleRole {
  'role-id': string;
  props?: Property[];
  links?: Link[];
  'party-uuids'?: string[];
  remarks?: string;
}

export interface Statement {
  'statement-id': string;
  uuid: string;
  description?: string;
  props?: Property[];
  links?: Link[];
  'responsible-roles'?: ResponsibleRole[];
  'by-components'?: ByComponent[];
  remarks?: string;
}

export interface ByComponent {
  'component-uuid': string;
  uuid: string;
  description?: string;
  props?: Property[];
  links?: Link[];
  'set-parameters'?: SetParameter[];
  'implementation-status'?: ImplementationStatus;
  'export'?: Export;
  inherited?: Inherited[];
  satisfied?: Satisfied[];
  'responsible-roles'?: ResponsibleRole[];
  remarks?: string;
}

export interface SetParameter {
  'param-id': string;
  values: string[];
  remarks?: string;
}

export interface ImplementationStatus {
  state: 'implemented' | 'partial' | 'planned' | 'alternative' | 'not-applicable';
  remarks?: string;
}

export interface Export {
  description?: string;
  props?: Property[];
  links?: Link[];
  provided?: Provided[];
  responsibilities?: Responsibility[];
  remarks?: string;
}

export interface Provided {
  uuid: string;
  description: string;
  props?: Property[];
  links?: Link[];
  'responsible-roles'?: ResponsibleRole[];
  remarks?: string;
}

export interface Responsibility {
  uuid: string;
  'provided-uuid'?: string;
  description: string;
  props?: Property[];
  links?: Link[];
  'responsible-roles'?: ResponsibleRole[];
  remarks?: string;
}

export interface Inherited {
  uuid: string;
  'provided-uuid'?: string;
  description: string;
  props?: Property[];
  links?: Link[];
  'responsible-roles'?: ResponsibleRole[];
}

export interface Satisfied {
  uuid: string;
  'responsibility-uuid'?: string;
  description: string;
  props?: Property[];
  links?: Link[];
  'responsible-roles'?: ResponsibleRole[];
  remarks?: string;
}

export interface ImplementedRequirement {
  uuid: string;
  'control-id': string;
  props?: Property[];
  links?: Link[];
  'set-parameters'?: SetParameter[];
  'responsible-roles'?: ResponsibleRole[];
  statements?: Statement[];
  'by-components'?: ByComponent[];
  remarks?: string;
}

export interface ControlImplementation {
  description?: string;
  'set-parameters'?: SetParameter[];
  'implemented-requirements': ImplementedRequirement[];
}

// ============================================================================
// Import Profile Types
// ============================================================================

export interface ImportProfile {
  href: string;
  remarks?: string;
}

// ============================================================================
// Back Matter Types
// ============================================================================

export interface Resource {
  uuid: string;
  title?: string;
  description?: string;
  props?: Property[];
  'document-ids'?: { scheme?: string; identifier: string }[];
  citation?: Citation;
  rlinks?: Rlink[];
  'base64'?: Base64Content;
  remarks?: string;
}

export interface Citation {
  text: string;
  props?: Property[];
  links?: Link[];
}

export interface Rlink {
  href: string;
  'media-type'?: string;
  hashes?: Hash[];
}

export interface Hash {
  algorithm: string;
  value: string;
}

export interface Base64Content {
  filename?: string;
  'media-type'?: string;
  value: string;
}

export interface BackMatter {
  resources?: Resource[];
}

// ============================================================================
// Main SSP Document Type
// ============================================================================

export interface SystemSecurityPlan {
  uuid: string;
  metadata: OscalMetadata;
  'import-profile'?: ImportProfile;
  'system-characteristics': SystemCharacteristics;
  'system-implementation'?: SystemImplementation;
  'control-implementation': ControlImplementation;
  'back-matter'?: BackMatter;
}

export interface OscalSSPDocument {
  'system-security-plan': SystemSecurityPlan;
}

// ============================================================================
// Editor State Types
// ============================================================================

export type TreeNodeType =
  | 'root'
  | 'metadata'
  | 'metadata-info'
  | 'roles'
  | 'role'
  | 'locations'
  | 'location'
  | 'parties'
  | 'party'
  | 'system-characteristics'
  | 'system-implementation'
  | 'control-implementation'
  | 'control';

export interface TreeNode {
  id: string;
  type: TreeNodeType;
  label: string;
  path: string[];
  icon?: string;
  badge?: string | number;
  status?: 'complete' | 'incomplete' | 'error' | 'warning';
  children?: TreeNode[];
  expanded?: boolean;
}

export interface ValidationError {
  path: string[];
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface EditorTab {
  id: 'form' | 'json' | 'preview';
  label: string;
  icon: string;
}

export interface SaveStatus {
  status: 'saved' | 'saving' | 'modified' | 'error';
  lastSaved?: Date;
  error?: string;
}

// ============================================================================
// API Types
// ============================================================================

export interface SSPListItem {
  id: string;
  title: string;
  lastModified: string;
  version: string;
  controlCount: number;
}

export interface SSPHistoryEntry {
  id: string;
  timestamp: string;
  version: string;
  author?: string;
  changes?: string;
}
