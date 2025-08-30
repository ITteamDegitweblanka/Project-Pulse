const Leave = require('../models/leave');

exports.getAllLeaves = (req, res) => {
  Leave.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.getLeaveById = (req, res) => {
  Leave.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result.length) return res.status(404).json({ error: 'Leave not found' });
    res.json(result[0]);
  });
};

exports.createLeave = (req, res) => {
  Leave.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ id: result.insertId, ...req.body });
  });
};

exports.updateLeave = (req, res) => {
  Leave.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Leave updated' });
  });
};

exports.deleteLeave = (req, res) => {
  Leave.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Leave deleted' });
  });
};
