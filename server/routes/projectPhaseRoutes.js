const express = require('express');
const router = express.Router();
const projectPhaseController = require('../controllers/projectPhaseController');

router.get('/', projectPhaseController.getProjectPhases);
router.post('/', projectPhaseController.addProjectPhase);
router.delete('/:id', projectPhaseController.deleteProjectPhase);

module.exports = router;
