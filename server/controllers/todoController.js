const Todo = require('../models/todo');

exports.getAllTodos = (req, res) => {
  Todo.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.getTodoById = (req, res) => {
  Todo.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result.length) return res.status(404).json({ error: 'Todo not found' });
    res.json(result[0]);
  });
};

exports.createTodo = (req, res) => {
  Todo.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ id: result.insertId, ...req.body });
  });
};

exports.updateTodo = (req, res) => {
  Todo.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Todo updated' });
  });
};

exports.deleteTodo = (req, res) => {
  Todo.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Todo deleted' });
  });
};
