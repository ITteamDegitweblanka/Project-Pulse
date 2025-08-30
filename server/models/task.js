const db = require('../config/db');

const Task = {
  getAll: (cb) => db.query('SELECT * FROM tasks', cb),
  getById: (id, cb) => db.query('SELECT * FROM tasks WHERE id = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO tasks SET ?', data, cb),
  update: (id, data, cb) => db.query('UPDATE tasks SET ? WHERE id = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM tasks WHERE id = ?', [id], cb),
};

module.exports = Task;
