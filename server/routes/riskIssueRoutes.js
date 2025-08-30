const express = require('express');
const router = express.Router();
const riskIssueController = require('../controllers/riskIssueController');

router.get('/', riskIssueController.getAllRiskIssues);
router.get('/:id', riskIssueController.getRiskIssueById);
router.post('/', riskIssueController.createRiskIssue);
router.put('/:id', riskIssueController.updateRiskIssue);
router.delete('/:id', riskIssueController.deleteRiskIssue);

module.exports = router;
