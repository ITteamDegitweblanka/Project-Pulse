const db = require('../config/db');

const RiskIssue = {
  getAll: (cb) => db.query('SELECT * FROM risks_issues', cb),
  getById: (id, cb) => db.query('SELECT * FROM risks_issues WHERE id = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO risks_issues SET ?', data, cb),
  update: (id, data, cb) => db.query('UPDATE risks_issues SET ? WHERE id = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM risks_issues WHERE id = ?', [id], cb),
};

module.exports = RiskIssue;
