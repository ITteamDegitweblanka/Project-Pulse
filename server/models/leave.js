const db = require('../config/db');

const Leave = {
  getAll: (cb) => db.query('SELECT * FROM leaves', cb),
  getById: (id, cb) => db.query('SELECT * FROM leaves WHERE id = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO leaves SET ?', data, cb),
  update: (id, data, cb) => db.query('UPDATE leaves SET ? WHERE id = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM leaves WHERE id = ?', [id], cb),
};

module.exports = Leave;
