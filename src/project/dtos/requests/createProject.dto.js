/**
 * Request DTO for creating a new Project
 * Sanitizes and encapsulates incoming client payload
 */
export class CreateProjectDTO {
  constructor(data = {}) {
    this.projectName = (data.project_name || data.projectName || '').trim();
    this.projectCode = (data.project_code || data.projectCode || '').trim();
    this.client = (data.client || data.client_name || data.clientName || '').trim();
    this.riskLevel = (data.risk_level || data.riskLevel || '').trim().toLowerCase();
    this.description = data.description ? data.description.trim() : null;
  }
}
