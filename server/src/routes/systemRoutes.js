const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

// GET /api/v1/system/status
router.get('/status', systemController.getSystemStatus);

module.exports = router;

