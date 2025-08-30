const db = require('../config/db');

const Todo = {
  getAll: (cb) => db.query('SELECT * FROM todos', cb),
  getById: (id, cb) => db.query('SELECT * FROM todos WHERE id = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO todos SET ?', data, cb),
  update: (id, data, cb) => db.query('UPDATE todos SET ? WHERE id = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM todos WHERE id = ?', [id], cb),
};

module.exports = Todo;
