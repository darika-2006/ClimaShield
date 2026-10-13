const db = require('../config/db');

/**
 * GET /api/v1/climate/historical
 * Query Parameters:
 *   - district / district_name (default: 'Chennai')
 *   - start_year (default: 1990)
 *   - end_year (default: 2024)
 * Returns yearly aggregated climate metrics for time series charts.
 */
async function getHistoricalClimate(req, res, next) {
  try {
    const districtName = req.query.district || req.query.district_name || 'Chennai';
    const startYear = parseInt(req.query.start_year, 10) || 1990;
    const endYear = parseInt(req.query.end_year, 10) || 2024;

    const sql = `
      SELECT 
        hc.year,
        ROUND(AVG(hc.avg_temp_c), 2)::float AS mean_temp,
        ROUND(SUM(hc.rainfall_mm), 2)::float AS total_rainfall,
        SUM(hc.extreme_heat_days)::int AS extreme_heat_days
      FROM historical_climate hc
      JOIN districts d ON hc.district_id = d.id
      WHERE LOWER(d.name) = LOWER($1)
        AND hc.year BETWEEN $2 AND $3
      GROUP BY hc.year
      ORDER BY hc.year ASC;
    `;

    const result = await db.query(sql, [districtName, startYear, endYear]);

    return res.status(200).json({
      success: true,
      district: districtName,
      startYear,
      endYear,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHistoricalClimate,
};
