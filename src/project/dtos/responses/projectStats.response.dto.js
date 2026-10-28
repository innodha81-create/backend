/**
 * Response DTO for Project Analytics / Stats
 */
export class ProjectStatsDTO {
  constructor({ total = 0, breakdown = {}, generatedAt = new Date().toISOString() }) {
    this.totalProjects = total;
    this.riskBreakdown = {
      easy: breakdown.easy || 0,
      medium: breakdown.medium || 0,
      high: breakdown.high || 0
    };
    this.generatedAt = generatedAt;
  }
}
