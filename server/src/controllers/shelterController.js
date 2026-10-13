const db = require('../config/db');

/**
 * GET /api/v1/shelters/nearby
 * Query Parameters:
 *   - lat (float, required) e.g., 13.0827
 *   - lon (float, required) e.g., 80.2707
 *   - radius_km (float, default: 15)
 * Returns nearest disaster relief shelters using PostGIS ST_DistanceSphere.
 */
async function getNearbyShelters(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radiusKm = parseFloat(req.query.radius_km) || 15.0;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing query parameters: lat and lon must be numbers.',
      });
    }

    const sql = `
      SELECT 
        s.id,
        s.name,
        s.capacity,
        s.current_occupancy,
        (s.capacity - s.current_occupancy) AS available_beds,
        s.lat::float,
        s.lon::float,
        s.contact_phone,
        d.name AS district_name,
        ROUND((ST_DistanceSphere(s.geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)) / 1000)::numeric, 2)::float AS distance_km
      FROM shelters s
      LEFT JOIN districts d ON s.district_id = d.id
      WHERE ST_DistanceSphere(s.geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)) <= ($3 * 1000)
      ORDER BY distance_km ASC
      LIMIT 10;
    `;

    const result = await db.query(sql, [lat, lon, radiusKm]);

    return res.status(200).json({
      success: true,
      center: { lat, lon },
      radiusKm,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNearbyShelters,
};
