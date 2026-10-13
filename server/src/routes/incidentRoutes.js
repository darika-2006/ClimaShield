const express = require('express');
const router = express.Router();
const {
  createIncident,
  getPublicIncidents,
  getPendingIncidents,
  verifyIncident,
} = require('../controllers/incidentController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Public endpoints
router.get('/public', getPublicIncidents);
router.get('/', getPublicIncidents);

// Citizens (or optional auth) submit reports
router.post('/', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  next();
}, createIncident);

// Protected Admin / Officer endpoints
router.get('/pending', authMiddleware, requireRole(['ADMIN', 'DISTRICT_OFFICER']), getPendingIncidents);
router.patch('/:id/verify', authMiddleware, requireRole(['ADMIN', 'DISTRICT_OFFICER']), verifyIncident);

module.exports = router;
