const Tool = require('../models/tool');

exports.getAllTools = (req, res) => {
  Tool.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.getToolById = (req, res) => {
  Tool.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result.length) return res.status(404).json({ error: 'Tool not found' });
    res.json(result[0]);
  });
};

exports.createTool = (req, res) => {
  Tool.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ id: result.insertId, ...req.body });
  });
};

exports.updateTool = (req, res) => {
  Tool.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Tool updated' });
  });
};

exports.deleteTool = (req, res) => {
  Tool.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Tool deleted' });
  });
};
