const db = require('../config/db');

const File = {
  getAll: (cb) => db.query('SELECT * FROM files', cb),
  getById: (id, cb) => db.query('SELECT * FROM files WHERE id = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO files SET ?', data, cb),
  delete: (id, cb) => db.query('DELETE FROM files WHERE id = ?', [id], cb),
};

module.exports = File;
