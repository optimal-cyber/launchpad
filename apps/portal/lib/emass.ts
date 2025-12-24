/**
 * eMASS API Client
 * 
 * This module provides a client for interacting with the eMASS API
 * for DoD/DoW ATO (Authority to Operate) workflows.
 * 
 * Based on eMASS API Documentation November 2024
 */

export interface EmassConfig {
  baseUrl: string;
  apiKey: string;
  userId?: string;
  userUid?: string;
}

export interface EmassSystem {
  systemId: number;
  systemName: string;
  systemAcronym: string;
  systemOwnerName: string;
  systemOwnerEmail: string;
  systemOwnerPhone: string;
  systemOwnerTitle: string;
  aoName: string;
  aoEmail: string;
  aoTitle: string;
  aoPhone: string;
  isrmName: string;
  isrmEmail: string;
  isrmTitle: string;
  isrmPhone: string;
  systemType: string;
  registrationType: string;
  systemLifeCycleStatus: string;
  systemDescription: string;
  environment: string;
  authorizationStatus: string;
  authorizationDate?: string;
  authorizationExpirationDate?: string;
  lastAssessmentDate?: string;
  nextAssessmentDate?: string;
  lastControlAssessmentDate?: string;
  nextControlAssessmentDate?: string;
  lastPenTestDate?: string;
  nextPenTestDate?: string;
  lastSARDate?: string;
  nextSARDate?: string;
  lastContinuityDate?: string;
  nextContinuityDate?: string;
  lastDisasterRecoveryTestDate?: string;
  nextDisasterRecoveryTestDate?: string;
  lastBusinessContinuityTestDate?: string;
  nextBusinessContinuityTestDate?: string;
  lastFISMAInventoryDate?: string;
  nextFISMAInventoryDate?: string;
  lastIncidentResponseTestDate?: string;
  nextIncidentResponseTestDate?: string;
  lastSecurityReviewDate?: string;
  nextSecurityReviewDate?: string;
  lastRiskAssessmentDate?: string;
  nextRiskAssessmentDate?: string;
  lastRulesOfEngagementDate?: string;
  nextRulesOfEngagementDate?: string;
  lastHardwareInventoryDate?: string;
  nextHardwareInventoryDate?: string;
  lastSoftwareInventoryDate?: string;
  nextSoftwareInventoryDate?: string;
  lastVulnerabilityAssessmentDate?: string;
  nextVulnerabilityAssessmentDate?: string;
  lastPIAUpdateDate?: string;
  nextPIAUpdateDate?: string;
  lastInterconnectionAgreementDate?: string;
  nextInterconnectionAgreementDate?: string;
  lastHardwareInventoryScanDate?: string;
  nextHardwareInventoryScanDate?: string;
  lastSoftwareInventoryScanDate?: string;
  nextSoftwareInventoryScanDate?: string;
  lastContingencyPlanDate?: string;
  nextContingencyPlanDate?: string;
  lastSecurityPlanDate?: string;
  nextSecurityPlanDate?: string;
  lastIncidentResponsePlanDate?: string;
  nextIncidentResponsePlanDate?: string;
  lastConfigurationManagementPlanDate?: string;
  nextConfigurationManagementPlanDate?: string;
  lastRulesOfBehaviorDate?: string;
  nextRulesOfBehaviorDate?: string;
  lastAccessControlPolicyDate?: string;
  nextAccessControlPolicyDate?: string;
  lastBusinessImpactAnalysisDate?: string;
  nextBusinessImpactAnalysisDate?: string;
  lastPenetrationTestDate?: string;
  nextPenetrationTestDate?: string;
  lastRiskAssessmentDate2?: string;
  nextRiskAssessmentDate2?: string;
  lastSecurityAssessmentDate?: string;
  nextSecurityAssessmentDate?: string;
  lastSecurityAuthorizationDate?: string;
  nextSecurityAuthorizationDate?: string;
  lastPlanOfActionMilestonesDate?: string;
  nextPlanOfActionMilestonesDate?: string;
  lastContinuousMonitoringStrategyDate?: string;
  nextContinuousMonitoringStrategyDate?: string;
  lastIncidentResponsePlanTestDate?: string;
  nextIncidentResponsePlanTestDate?: string;
  lastContingencyPlanTestDate?: string;
  nextContingencyPlanTestDate?: string;
  lastBusinessContinuityPlanDate?: string;
  nextBusinessContinuityPlanDate?: string;
  lastInterconnectionSecurityAgreementDate?: string;
  nextInterconnectionSecurityAgreementDate?: string;
  lastMemorandumOfAgreementDate?: string;
  nextMemorandumOfAgreementDate?: string;
  lastMemorandumOfUnderstandingDate?: string;
  nextMemorandumOfUnderstandingDate?: string;
  lastServiceLevelAgreementDate?: string;
  nextServiceLevelAgreementDate?: string;
  lastInterconnectionAgreementDate2?: string;
  nextInterconnectionAgreementDate2?: string;
  lastBusinessImpactAnalysisDate2?: string;
  nextBusinessImpactAnalysisDate2?: string;
  lastPrivacyImpactAssessmentDate?: string;
  nextPrivacyImpactAssessmentDate?: string;
  lastSystemSecurityPlanDate?: string;
  nextSystemSecurityPlanDate?: string;
  lastRulesOfBehaviorDate2?: string;
  nextRulesOfBehaviorDate2?: string;
  lastAccessControlPolicyDate2?: string;
  nextAccessControlPolicyDate2?: string;
  lastConfigurationManagementPlanDate2?: string;
  nextConfigurationManagementPlanDate2?: string;
  lastIncidentResponsePlanDate2?: string;
  nextIncidentResponsePlanDate2?: string;
  lastContingencyPlanDate2?: string;
  nextContingencyPlanDate2?: string;
  lastSecurityPlanDate2?: string;
  nextSecurityPlanDate2?: string;
  lastHardwareInventoryDate2?: string;
  nextHardwareInventoryDate2?: string;
  lastSoftwareInventoryDate2?: string;
  nextSoftwareInventoryDate2?: string;
  lastVulnerabilityAssessmentDate2?: string;
  nextVulnerabilityAssessmentDate2?: string;
  lastPenetrationTestDate2?: string;
  nextPenetrationTestDate2?: string;
  lastRiskAssessmentDate3?: string;
  nextRiskAssessmentDate3?: string;
  lastSecurityAssessmentDate2?: string;
  nextSecurityAssessmentDate2?: string;
  lastSecurityAuthorizationDate2?: string;
  nextSecurityAuthorizationDate2?: string;
  lastPlanOfActionMilestonesDate2?: string;
  nextPlanOfActionMilestonesDate2?: string;
  lastContinuousMonitoringStrategyDate2?: string;
  nextContinuousMonitoringStrategyDate2?: string;
  lastIncidentResponsePlanTestDate2?: string;
  nextIncidentResponsePlanTestDate2?: string;
  lastContingencyPlanTestDate2?: string;
  nextContingencyPlanTestDate2?: string;
  lastBusinessContinuityPlanDate2?: string;
  nextBusinessContinuityPlanDate2?: string;
  lastInterconnectionSecurityAgreementDate2?: string;
  nextInterconnectionSecurityAgreementDate2?: string;
  lastMemorandumOfAgreementDate2?: string;
  nextMemorandumOfAgreementDate2?: string;
  lastMemorandumOfUnderstandingDate2?: string;
  nextMemorandumOfUnderstandingDate2?: string;
  lastServiceLevelAgreementDate2?: string;
  nextServiceLevelAgreementDate2?: string;
  lastInterconnectionAgreementDate3?: string;
  nextInterconnectionAgreementDate3?: string;
  lastBusinessImpactAnalysisDate3?: string;
  nextBusinessImpactAnalysisDate3?: string;
  lastPrivacyImpactAssessmentDate2?: string;
  nextPrivacyImpactAssessmentDate2?: string;
  lastSystemSecurityPlanDate2?: string;
  nextSystemSecurityPlanDate2?: string;
  lastRulesOfBehaviorDate3?: string;
  nextRulesOfBehaviorDate3?: string;
  lastAccessControlPolicyDate3?: string;
  nextAccessControlPolicyDate3?: string;
  lastConfigurationManagementPlanDate3?: string;
  nextConfigurationManagementPlanDate3?: string;
  lastIncidentResponsePlanDate3?: string;
  nextIncidentResponsePlanDate3?: string;
  lastContingencyPlanDate3?: string;
  nextContingencyPlanDate3?: string;
  lastSecurityPlanDate3?: string;
  nextSecurityPlanDate3?: string;
  lastHardwareInventoryDate3?: string;
  nextHardwareInventoryDate3?: string;
  lastSoftwareInventoryDate3?: string;
  nextSoftwareInventoryDate3?: string;
  lastVulnerabilityAssessmentDate3?: string;
  nextVulnerabilityAssessmentDate3?: string;
  lastPenetrationTestDate3?: string;
  nextPenetrationTestDate3?: string;
  lastRiskAssessmentDate4?: string;
  nextRiskAssessmentDate4?: string;
  lastSecurityAssessmentDate3?: string;
  nextSecurityAssessmentDate3?: string;
  lastSecurityAuthorizationDate3?: string;
  nextSecurityAuthorizationDate3?: string;
  lastPlanOfActionMilestonesDate3?: string;
  nextPlanOfActionMilestonesDate3?: string;
  lastContinuousMonitoringStrategyDate3?: string;
  nextContinuousMonitoringStrategyDate3?: string;
  lastIncidentResponsePlanTestDate3?: string;
  nextIncidentResponsePlanTestDate3?: string;
  lastContingencyPlanTestDate3?: string;
  nextContingencyPlanTestDate3?: string;
  lastBusinessContinuityPlanDate3?: string;
  nextBusinessContinuityPlanDate3?: string;
  lastInterconnectionSecurityAgreementDate3?: string;
  nextInterconnectionSecurityAgreementDate3?: string;
  lastMemorandumOfAgreementDate3?: string;
  nextMemorandumOfAgreementDate3?: string;
  lastMemorandumOfUnderstandingDate3?: string;
  nextMemorandumOfUnderstandingDate3?: string;
  lastServiceLevelAgreementDate3?: string;
  nextServiceLevelAgreementDate3?: string;
  lastInterconnectionAgreementDate4?: string;
  nextInterconnectionAgreementDate4?: string;
  lastBusinessImpactAnalysisDate4?: string;
  nextBusinessImpactAnalysisDate4?: string;
  lastPrivacyImpactAssessmentDate3?: string;
  nextPrivacyImpactAssessmentDate3?: string;
  lastSystemSecurityPlanDate3?: string;
  nextSystemSecurityPlanDate3?: string;
  lastRulesOfBehaviorDate4?: string;
  nextRulesOfBehaviorDate4?: string;
  lastAccessControlPolicyDate4?: string;
  nextAccessControlPolicyDate4?: string;
  lastConfigurationManagementPlanDate4?: string;
  nextConfigurationManagementPlanDate4?: string;
  lastIncidentResponsePlanDate4?: string;
  nextIncidentResponsePlanDate4?: string;
  lastContingencyPlanDate4?: string;
  nextContingencyPlanDate4?: string;
  lastSecurityPlanDate4?: string;
  nextSecurityPlanDate4?: string;
  lastHardwareInventoryDate4?: string;
  nextHardwareInventoryDate4?: string;
  lastSoftwareInventoryDate4?: string;
  nextSoftwareInventoryDate4?: string;
  lastVulnerabilityAssessmentDate4?: string;
  nextVulnerabilityAssessmentDate4?: string;
  lastPenetrationTestDate4?: string;
  nextPenetrationTestDate4?: string;
  lastRiskAssessmentDate5?: string;
  nextRiskAssessmentDate5?: string;
  lastSecurityAssessmentDate4?: string;
  nextSecurityAssessmentDate4?: string;
  lastSecurityAuthorizationDate4?: string;
  nextSecurityAuthorizationDate4?: string;
  lastPlanOfActionMilestonesDate4?: string;
  nextPlanOfActionMilestonesDate4?: string;
  lastContinuousMonitoringStrategyDate4?: string;
  nextContinuousMonitoringStrategyDate4?: string;
  lastIncidentResponsePlanTestDate4?: string;
  nextIncidentResponsePlanTestDate4?: string;
  lastContingencyPlanTestDate4?: string;
  nextContingencyPlanTestDate4?: string;
  lastBusinessContinuityPlanDate4?: string;
  nextBusinessContinuityPlanDate4?: string;
  lastInterconnectionSecurityAgreementDate4?: string;
  nextInterconnectionSecurityAgreementDate4?: string;
  lastMemorandumOfAgreementDate4?: string;
  nextMemorandumOfAgreementDate4?: string;
  lastMemorandumOfUnderstandingDate4?: string;
  nextMemorandumOfUnderstandingDate4?: string;
  lastServiceLevelAgreementDate4?: string;
  nextServiceLevelAgreementDate4?: string;
  lastInterconnectionAgreementDate5?: string;
  nextInterconnectionAgreementDate5?: string;
  lastBusinessImpactAnalysisDate5?: string;
  nextBusinessImpactAnalysisDate5?: string;
  lastPrivacyImpactAssessmentDate4?: string;
  nextPrivacyImpactAssessmentDate4?: string;
  lastSystemSecurityPlanDate4?: string;
  nextSystemSecurityPlanDate4?: string;
  lastRulesOfBehaviorDate5?: string;
  nextRulesOfBehaviorDate5?: string;
  lastAccessControlPolicyDate5?: string;
  nextAccessControlPolicyDate5?: string;
  lastConfigurationManagementPlanDate5?: string;
  nextConfigurationManagementPlanDate5?: string;
  lastIncidentResponsePlanDate5?: string;
  nextIncidentResponsePlanDate5?: string;
  lastContingencyPlanDate5?: string;
  nextContingencyPlanDate5?: string;
  lastSecurityPlanDate5?: string;
  nextSecurityPlanDate5?: string;
  lastHardwareInventoryDate5?: string;
  nextHardwareInventoryDate5?: string;
  lastSoftwareInventoryDate5?: string;
  nextSoftwareInventoryDate5?: string;
  lastVulnerabilityAssessmentDate5?: string;
  nextVulnerabilityAssessmentDate5?: string;
  lastPenetrationTestDate5?: string;
  nextPenetrationTestDate5?: string;
  lastRiskAssessmentDate6?: string;
  nextRiskAssessmentDate6?: string;
  lastSecurityAssessmentDate5?: string;
  nextSecurityAssessmentDate5?: string;
  lastSecurityAuthorizationDate5?: string;
  nextSecurityAuthorizationDate5?: string;
  lastPlanOfActionMilestonesDate5?: string;
  nextPlanOfActionMilestonesDate5?: string;
  lastContinuousMonitoringStrategyDate5?: string;
  nextContinuousMonitoringStrategyDate5?: string;
  lastIncidentResponsePlanTestDate5?: string;
  nextIncidentResponsePlanTestDate5?: string;
  lastContingencyPlanTestDate5?: string;
  nextContingencyPlanTestDate5?: string;
  lastBusinessContinuityPlanDate5?: string;
  nextBusinessContinuityPlanDate5?: string;
  lastInterconnectionSecurityAgreementDate5?: string;
  nextInterconnectionSecurityAgreementDate5?: string;
  lastMemorandumOfAgreementDate5?: string;
  nextMemorandumOfAgreementDate5?: string;
  lastMemorandumOfUnderstandingDate5?: string;
  nextMemorandumOfUnderstandingDate5?: string;
  lastServiceLevelAgreementDate5?: string;
  nextServiceLevelAgreementDate5?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmassPOAM {
  poamId: number;
  systemId: number;
  controlAcronym: string;
  weaknessName: string;
  weaknessDescription: string;
  severity: string;
  remediation: string;
  resources: string;
  milestones: EmassMilestone[];
  scheduledCompletionDate: string;
  status: string;
  comments?: string;
  rawSeverity?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmassMilestone {
  milestoneId: number;
  description: string;
  scheduledCompletionDate: string;
  actualCompletionDate?: string;
  status: string;
  comments?: string;
}

export interface EmassControl {
  controlId: string;
  controlAcronym: string;
  controlName: string;
  controlDescription: string;
  implementationStatus: string;
  commonControl: boolean;
  inherited: boolean;
  systemId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmassArtifact {
  artifactId: number;
  systemId: number;
  filename: string;
  fileType: string;
  category: string;
  description?: string;
  uploadDate: string;
  fileSize: number;
  checksum?: string;
}

export class EmassClient {
  private config: EmassConfig;
  private baseHeaders: Record<string, string>;

  constructor(config: EmassConfig) {
    this.config = config;
    this.baseHeaders = {
      'X-API-Key': config.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (config.userId) {
      this.baseHeaders['X-User-Id'] = config.userId;
    }
    
    if (config.userUid) {
      this.baseHeaders['X-User-Uid'] = config.userUid;
    }
  }

  /**
   * Get all systems
   */
  async getSystems(): Promise<EmassSystem[]> {
    const response = await fetch(`${this.config.baseUrl}/api/systems`, {
      headers: this.baseHeaders,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch systems: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get a specific system by ID
   */
  async getSystem(systemId: number): Promise<EmassSystem> {
    const response = await fetch(`${this.config.baseUrl}/api/systems/${systemId}`, {
      headers: this.baseHeaders,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch system: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Create a new system
   */
  async createSystem(system: Partial<EmassSystem>): Promise<EmassSystem> {
    const response = await fetch(`${this.config.baseUrl}/api/systems`, {
      method: 'POST',
      headers: this.baseHeaders,
      body: JSON.stringify(system),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create system: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Update a system
   */
  async updateSystem(systemId: number, updates: Partial<EmassSystem>): Promise<EmassSystem> {
    const response = await fetch(`${this.config.baseUrl}/api/systems/${systemId}`, {
      method: 'PUT',
      headers: this.baseHeaders,
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update system: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Get POA&M items for a system
   */
  async getPOAMs(systemId: number): Promise<EmassPOAM[]> {
    const response = await fetch(`${this.config.baseUrl}/api/systems/${systemId}/poams`, {
      headers: this.baseHeaders,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch POA&Ms: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Create a POA&M item
   */
  async createPOAM(systemId: number, poam: Partial<EmassPOAM>): Promise<EmassPOAM> {
    const response = await fetch(`${this.config.baseUrl}/api/systems/${systemId}/poams`, {
      method: 'POST',
      headers: this.baseHeaders,
      body: JSON.stringify(poam),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create POA&M: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Update a POA&M item
   */
  async updatePOAM(systemId: number, poamId: number, updates: Partial<EmassPOAM>): Promise<EmassPOAM> {
    const response = await fetch(`${this.config.baseUrl}/api/systems/${systemId}/poams/${poamId}`, {
      method: 'PUT',
      headers: this.baseHeaders,
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update POA&M: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Get controls for a system
   */
  async getControls(systemId: number): Promise<EmassControl[]> {
    const response = await fetch(`${this.config.baseUrl}/api/systems/${systemId}/controls`, {
      headers: this.baseHeaders,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch controls: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get artifacts for a system
   */
  async getArtifacts(systemId: number): Promise<EmassArtifact[]> {
    const response = await fetch(`${this.config.baseUrl}/api/systems/${systemId}/artifacts`, {
      headers: this.baseHeaders,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch artifacts: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Upload an artifact
   */
  async uploadArtifact(
    systemId: number,
    file: File,
    category: string,
    description?: string
  ): Promise<EmassArtifact> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (description) {
      formData.append('description', description);
    }

    const headers = { ...this.baseHeaders };
    delete headers['Content-Type']; // Let browser set multipart/form-data boundary

    const response = await fetch(`${this.config.baseUrl}/api/systems/${systemId}/artifacts`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.config.apiKey,
        ...(this.config.userId && { 'X-User-Id': this.config.userId }),
        ...(this.config.userUid && { 'X-User-Uid': this.config.userUid }),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to upload artifact: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Submit system for authorization
   */
  async submitForAuthorization(systemId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.config.baseUrl}/api/systems/${systemId}/submit`, {
      method: 'POST',
      headers: this.baseHeaders,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to submit for authorization: ${error.message || response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Get authorization status
   */
  async getAuthorizationStatus(systemId: number): Promise<{
    status: string;
    authorizationDate?: string;
    expirationDate?: string;
    nextAssessmentDate?: string;
  }> {
    const system = await this.getSystem(systemId);
    return {
      status: system.authorizationStatus,
      authorizationDate: system.authorizationDate,
      expirationDate: system.authorizationExpirationDate,
      nextAssessmentDate: system.nextAssessmentDate,
    };
  }
}


