const express = require('express');
const router = express.Router();
const shelterController = require('../controllers/shelterController');

// GET /api/v1/shelters/nearby
router.get('/nearby', shelterController.getNearbyShelters);

module.exports = router;
