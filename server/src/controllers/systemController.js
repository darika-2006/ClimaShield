const db = require('../config/db');

/**
 * GET /api/v1/system/status
 * Dynamic introspection endpoint that queries row counts for districts,
 * historical_climate, and shelters to verify database state.
 */
async function getSystemStatus(req, res, next) {
  try {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM districts) AS total_districts,
        (SELECT COUNT(*) FROM historical_climate) AS total_climate_records,
        (SELECT COUNT(*) FROM shelters) AS total_shelters;
    `;

    const result = await db.query(sql);
    const row = result.rows[0] || {};

    const districts = parseInt(row.total_districts || 0, 10);
    const climateRecords = parseInt(row.total_climate_records || 0, 10);
    const shelters = parseInt(row.total_shelters || 0, 10);

    const isSeeded = districts > 0 && climateRecords > 0 && shelters > 0;

    return res.status(200).json({
      success: true,
      isSeeded,
      counts: {
        districts,
        historical_climate: climateRecords,
        shelters,
      },
      database: 'Connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSystemStatus,
};

