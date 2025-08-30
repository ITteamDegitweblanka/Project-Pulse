const db = require('../config/db');

const Tool = {
  getAll: (cb) => db.query('SELECT * FROM tools', cb),
  getById: (id, cb) => db.query('SELECT * FROM tools WHERE id = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO tools SET ?', data, cb),
  update: (id, data, cb) => db.query('UPDATE tools SET ? WHERE id = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM tools WHERE id = ?', [id], cb),
};

module.exports = Tool;
