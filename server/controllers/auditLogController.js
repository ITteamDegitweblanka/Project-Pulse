const AuditLog = require('../models/auditLog');

exports.getAllAuditLogs = (req, res) => {
  AuditLog.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.getAuditLogById = (req, res) => {
  AuditLog.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result.length) return res.status(404).json({ error: 'Audit log not found' });
    res.json(result[0]);
  });
};

exports.createAuditLog = (req, res) => {
  AuditLog.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ id: result.insertId, ...req.body });
  });
};

exports.deleteAuditLog = (req, res) => {
  AuditLog.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Audit log deleted' });
  });
};
