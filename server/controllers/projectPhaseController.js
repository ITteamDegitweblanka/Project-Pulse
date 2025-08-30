// Delete a project phase
exports.deleteProjectPhase = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM project_phases WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Phase not found' });
    res.json({ id });
  });
};
const db = require('../config/db');


exports.getProjectPhases = (req, res) => {
  db.query('SELECT id, name, description FROM project_phases', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
};

// Add a new project phase
exports.addProjectPhase = (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Phase name is required' });
  }
  db.query(
    'INSERT INTO project_phases (name, description, status) VALUES (?, ?, ?)',
    [name, description || '', 'Active'],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ id: result.insertId, name, description });
    }
  );
};
