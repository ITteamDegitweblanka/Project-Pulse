const File = require('../models/file');

exports.getAllFiles = (req, res) => {
  File.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.getFileById = (req, res) => {
  File.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result.length) return res.status(404).json({ error: 'File not found' });
    res.json(result[0]);
  });
};

exports.createFile = (req, res) => {
  File.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ id: result.insertId, ...req.body });
  });
};

exports.deleteFile = (req, res) => {
  File.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'File deleted' });
  });
};
