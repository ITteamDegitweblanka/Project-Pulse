const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.post('/', teamController.createTeam);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

// New route for team members
router.get('/members', teamController.getAllTeamMembers);

module.exports = router;
