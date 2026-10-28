/**
 * Request DTO for querying projects (Pagination, Search, Filter & Sort)
 */
export class ProjectQueryDTO {
  constructor(query = {}) {
    const page = parseInt(query.page, 10);
    const limit = parseInt(query.limit, 10);

    this.page = !isNaN(page) && page > 0 ? page : 1;
    this.limit = !isNaN(limit) && limit > 0 ? Math.min(limit, 100) : 10;
    this.offset = (this.page - 1) * this.limit;
    this.search = query.search ? query.search.trim() : null;
    this.riskLevel = query.risk_level || query.riskLevel ? (query.risk_level || query.riskLevel).trim().toLowerCase() : null;
    this.sortBy = query.sortBy ? query.sortBy.trim().toLowerCase() : 'created_at';
    this.sortOrder = query.sortOrder && query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  }
}
