const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

router.get('/', auditLogController.getAllAuditLogs);
router.get('/:id', auditLogController.getAuditLogById);
router.post('/', auditLogController.createAuditLog);
router.delete('/:id', auditLogController.deleteAuditLog);

module.exports = router;
