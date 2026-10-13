const express = require('express');
const router = express.Router();
const { getAdminMetrics, updateShelterOccupancy, dispatchBroadcastAlert } = require('../controllers/adminController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);
router.use(requireRole(['ADMIN', 'DISTRICT_OFFICER']));

router.get('/metrics', getAdminMetrics);
router.patch('/shelters/:id', updateShelterOccupancy);
router.post('/broadcast', dispatchBroadcastAlert);

module.exports = router;
