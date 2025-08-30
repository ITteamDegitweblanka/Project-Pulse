const express = require('express');
const router = express.Router();
const riskLevelController = require('../controllers/riskLevelController');

router.get('/', riskLevelController.getAllRiskLevels);
router.get('/:id', riskLevelController.getRiskLevelById);
router.post('/', riskLevelController.createRiskLevel);
router.put('/:id', riskLevelController.updateRiskLevel);
router.delete('/:id', riskLevelController.deleteRiskLevel);

module.exports = router;
