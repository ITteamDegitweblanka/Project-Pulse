const db = require('../config/db');

const Team = {
  getAll: (cb) => db.query('SELECT * FROM teams', cb),
  getById: (id, cb) => db.query('SELECT * FROM teams WHERE id = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO teams SET ?', data, cb),
  update: (id, data, cb) => db.query('UPDATE teams SET ? WHERE id = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM teams WHERE id = ?', [id], cb),
};

module.exports = Team;
