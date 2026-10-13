const express = require('express');
const router = express.Router();
const climateController = require('../controllers/climateController');

// GET /api/v1/climate/historical
router.get('/historical', climateController.getHistoricalClimate);

module.exports = router;
