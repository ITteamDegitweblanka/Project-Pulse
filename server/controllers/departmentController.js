// Delete a department
exports.deleteDepartment = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM departments WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Department not found' });
    res.json({ id });
  });
};
const db = require('../config/db');


exports.getDepartments = (req, res) => {
  db.query('SELECT id, name, description, status FROM departments', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
};

// Add a new department
exports.addDepartment = (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Department name is required' });
  }
  db.query(
    'INSERT INTO departments (name, description, status) VALUES (?, ?, ?)',
    [name, description || '', 'Active'],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ id: result.insertId, name, description, status: 'Active' });
    }
  );
};
