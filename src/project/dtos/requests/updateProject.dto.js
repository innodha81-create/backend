/**
 * Request DTO for updating an existing Project
 * Captures only fields that are explicitly provided
 */
export class UpdateProjectDTO {
  constructor(data = {}) {
    if (data.project_name !== undefined || data.projectName !== undefined) {
      this.projectName = (data.project_name || data.projectName || '').trim();
    }
    if (data.project_code !== undefined || data.projectCode !== undefined) {
      this.projectCode = (data.project_code || data.projectCode || '').trim();
    }
    if (data.client !== undefined || data.client_name !== undefined || data.clientName !== undefined) {
      this.client = (data.client || data.client_name || data.clientName || '').trim();
    }
    if (data.risk_level !== undefined || data.riskLevel !== undefined) {
      this.riskLevel = (data.risk_level || data.riskLevel || '').trim().toLowerCase();
    }
    if (data.description !== undefined) {
      this.description = data.description ? data.description.trim() : null;
    }
    if (data.status !== undefined) {
      this.status = data.status.trim();
    }
  }
}
