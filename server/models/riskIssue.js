const db = require('../config/db');

const RiskIssue = {
  getAll: (cb) => db.query('SELECT * FROM risks_issues', cb),
  getById: (id, cb) => db.query('SELECT * FROM risks_issues WHERE id = ?', [id], cb),
  create: (data, cb) => {
    // Map camelCase to snake_case for DB columns
    if (data.projectId) {
      data.project_id = data.projectId;
      delete data.projectId;
    }
    if (data.assigneeId) {
      data.assignee_id = data.assigneeId;
      delete data.assigneeId;
    }
    if (data.lastUpdated) {
      data.lastUpdated = new Date(data.lastUpdated);
    }
    if (data.deadline) {
      data.deadline = new Date(data.deadline);
    }
    db.query('INSERT INTO risks_issues SET ?', data, cb);
  },
  update: (id, data, cb) => db.query('UPDATE risks_issues SET ? WHERE id = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM risks_issues WHERE id = ?', [id], cb),
};

module.exports = RiskIssue;
