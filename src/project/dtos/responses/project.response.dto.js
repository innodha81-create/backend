/**
 * Response DTO for Project Entity
 * Projects clean data contract to clients, hiding internal DB details
 */
export class ProjectResponseDTO {
  constructor(entity = {}) {
    this.project_id = entity.project_id;
    this.project_name = entity.project_name;
    this.project_code = entity.project_code;
    this.client = entity.client;
    this.risk_level = entity.risk_level;
    this.description = entity.description || null;
    this.status = entity.status || 'ACTIVE';
    this.created_by = entity.created_by || null;
    this.created_at = entity.created_at;
    this.updated_at = entity.updated_at;
  }

  static fromEntity(entity) {
    if (!entity) return null;
    return new ProjectResponseDTO(entity);
  }

  static fromEntities(entities = []) {
    return entities.map(entity => new ProjectResponseDTO(entity));
  }
}
