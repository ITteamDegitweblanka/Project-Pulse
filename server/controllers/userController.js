const User = require('../models/user');
const db = require('../config/db');

exports.getAllUsers = (req, res) => {
  User.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.getUserById = (req, res) => {
  User.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result.length) return res.status(404).json({ error: 'User not found' });
    res.json(result[0]);
  });
};

exports.createUser = (req, res) => {
  User.create(req.body, (err, result) => {
    if (err) {
      console.error('Error creating user:', err);
      return res.status(500).json({ error: err.sqlMessage || err.message || err });
    }
    res.status(201).json({ id: result.insertId, ...req.body });
  });
};

exports.updateUser = (req, res) => {
  User.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'User updated' });
  });
};

exports.deleteUser = (req, res) => {
  User.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'User deleted' });
  });
};

// Lightweight performance summary for a member; returns a valid shape even if no data yet
exports.getMemberPerformance = (req, res) => {
  const userId = req.params.id;
  // Minimal baseline values; can be enhanced with real calculations later
  const performance = {
    projectSuccessRate: { value: 0, change: 0 },
    onTimeDelivery: { value: 0, change: 0 },
    stakeholderSatisfaction: { value: 0, change: 0 },
    efficiencyMetrics: {
      issueResolutionTimeDays: 0,
      resourceUtilization: 0,
      changeRequestEfficiency: 0,
      riskMitigationScore: 0,
    },
    overallPerformance: { score: 0, rating: 'N/A' },
    teamSatisfaction: 0,
    avgProjectDurationMonths: 0,
  };
  res.json(performance);
};
