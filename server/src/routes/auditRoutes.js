const express = require('express');
const router = express.Router();
const { getRecentAudit } = require('../controllers/auditController');

// GET /api/v1/audit/recent
router.get('/recent', getRecentAudit);

module.exports = router;
