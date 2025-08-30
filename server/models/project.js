const db = require('../config/db');

const Project = {
  getAll: (cb) => db.query('SELECT * FROM projects', cb),
  getById: (id, cb) => db.query('SELECT * FROM projects WHERE id = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO projects SET ?', data, cb),
  update: (id, data, cb) => db.query('UPDATE projects SET ? WHERE id = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM projects WHERE id = ?', [id], cb),
  
};

module.exports = Project;
