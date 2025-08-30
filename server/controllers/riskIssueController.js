const RiskIssue = require('../models/riskIssue');

exports.getAllRiskIssues = (req, res) => {
  RiskIssue.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.getRiskIssueById = (req, res) => {
  RiskIssue.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result.length) return res.status(404).json({ error: 'Risk/Issue not found' });
    res.json(result[0]);
  });
};

exports.createRiskIssue = (req, res) => {
  RiskIssue.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ id: result.insertId, ...req.body });
  });
};

exports.updateRiskIssue = (req, res) => {
  RiskIssue.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Risk/Issue updated' });
  });
};

exports.deleteRiskIssue = (req, res) => {
  RiskIssue.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Risk/Issue deleted' });
  });
};
