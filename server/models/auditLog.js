const db = require('../config/db');

const AuditLog = {
  getAll: (cb) => db.query('SELECT * FROM audit_logs', cb),
  getById: (id, cb) => db.query('SELECT * FROM audit_logs WHERE id = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO audit_logs SET ?', data, cb),
  delete: (id, cb) => db.query('DELETE FROM audit_logs WHERE id = ?', [id], cb),
};

module.exports = AuditLog;
