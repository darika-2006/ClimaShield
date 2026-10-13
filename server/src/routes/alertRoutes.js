const express = require('express');
const router = express.Router();
const { getActiveAlerts, dispatchAlert } = require('../controllers/alertController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Public route for citizens to fetch active alerts for their location
router.get('/active', getActiveAlerts);

// Protected route for Admins/Officers to dispatch alerts
router.post('/dispatch', authMiddleware, requireRole(['ADMIN', 'DISTRICT_OFFICER']), dispatchAlert);

module.exports = router;
