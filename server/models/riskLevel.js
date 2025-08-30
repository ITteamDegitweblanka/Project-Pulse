const db = require('../config/db');

const RiskLevel = {
  getAll: (cb) => db.query('SELECT * FROM risk_levels', cb),
  getById: (id, cb) => db.query('SELECT * FROM risk_levels WHERE id = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO risk_levels SET ?', data, cb),
  update: (id, data, cb) => db.query('UPDATE risk_levels SET ? WHERE id = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM risk_levels WHERE id = ?', [id], cb),
};

module.exports = RiskLevel;
