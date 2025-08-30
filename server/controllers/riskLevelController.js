const RiskLevel = require('../models/riskLevel');

exports.getAllRiskLevels = (req, res) => {
	RiskLevel.getAll((err, results) => {
		if (err) return res.status(500).json({ error: err });
		res.json(results);
	});
};

exports.getRiskLevelById = (req, res) => {
	RiskLevel.getById(req.params.id, (err, result) => {
		if (err) return res.status(500).json({ error: err });
		if (!result.length) return res.status(404).json({ error: 'Not found' });
		res.json(result[0]);
	});
};

exports.createRiskLevel = (req, res) => {
	RiskLevel.create(req.body, (err, result) => {
		if (err) return res.status(500).json({ error: err });
		res.status(201).json({ id: result.insertId, ...req.body });
	});
};

exports.updateRiskLevel = (req, res) => {
	RiskLevel.update(req.params.id, req.body, (err) => {
		if (err) return res.status(500).json({ error: err });
		res.json({ id: req.params.id, ...req.body });
	});
};

exports.deleteRiskLevel = (req, res) => {
	RiskLevel.delete(req.params.id, (err) => {
		if (err) return res.status(500).json({ error: err });
		res.status(204).end();
	});
};
