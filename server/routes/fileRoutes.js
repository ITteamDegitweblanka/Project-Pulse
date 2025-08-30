const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.get('/', fileController.getAllFiles);
router.get('/:id', fileController.getFileById);
router.post('/', fileController.createFile);
router.delete('/:id', fileController.deleteFile);

module.exports = router;
