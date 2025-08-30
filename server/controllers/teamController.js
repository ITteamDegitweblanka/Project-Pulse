// ...existing code...

// Controller for team members
exports.getAllTeamMembers = (req, res) => {
  // Example: fetch all users as team members
  const User = require('../models/user');
  User.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};
const Team = require('../models/team');

exports.getAllTeams = (req, res) => {
  Team.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.getTeamById = (req, res) => {
  Team.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result.length) return res.status(404).json({ error: 'Team not found' });
    res.json(result[0]);
  });
};

exports.createTeam = (req, res) => {
  Team.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ id: result.insertId, ...req.body });
  });
};

exports.updateTeam = (req, res) => {
  Team.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Team updated' });
  });
};

exports.deleteTeam = (req, res) => {
  Team.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Team deleted' });
  });
};
