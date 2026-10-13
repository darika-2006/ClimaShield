const db = require('../config/db');

/**
 * POST /api/v1/incidents
 * Saves a new community incident report
 */
async function createIncident(req, res, next) {
  try {
    const { district, district_name, place_name, hazard_type, incident_type, description, image_url, reported_lat, reported_lon, lat, lon } = req.body;
    const finalLat = parseFloat(reported_lat !== undefined ? reported_lat : lat);
    const finalLon = parseFloat(reported_lon !== undefined ? reported_lon : lon);

    if (isNaN(finalLat) || isNaN(finalLon)) {
      return res.status(400).json({ success: false, error: 'Latitude and Longitude are required numbers.' });
    }

    const userId = req.user ? req.user.id : null;
    const finalDistrict = place_name || district_name || district || 'Chennai';
    const finalHazard = hazard_type || incident_type || 'Flood';

    const sql = `
      INSERT INTO citizen_reports (user_id, district, hazard_type, description, image_url, reported_lat, reported_lon, lat, lon, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $6, $7, 'PENDING_REVIEW')
      RETURNING id, user_id, district, hazard_type, description, image_url, reported_lat::float AS lat, reported_lon::float AS lon, status, created_at;
    `;

    const result = await db.query(sql, [
      userId,
      finalDistrict,
      finalHazard,
      description || 'Citizen community incident report',
      image_url || null,
      finalLat,
      finalLon,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Citizen incident report recorded successfully and sent for review.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/incidents/public (and GET /api/v1/incidents)
 * Fetches verified active incident reports for public map rendering
 */
async function getPublicIncidents(req, res, next) {
  try {
    const sql = `
      SELECT id, user_id, district, hazard_type, description, image_url, 
             COALESCE(reported_lat, lat)::float AS lat, 
             COALESCE(reported_lon, lon)::float AS lon, 
             status, created_at
      FROM citizen_reports
      WHERE status = 'VERIFIED_ACTIVE' OR status IS NULL
      ORDER BY created_at DESC
      LIMIT 100;
    `;
    const result = await db.query(sql);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/incidents/pending
 * Protected for ADMIN & DISTRICT_OFFICER: Lists pending incident reports
 */
async function getPendingIncidents(req, res, next) {
  try {
    const sql = `
      SELECT r.id, r.user_id, r.district, r.hazard_type, r.description, r.image_url, 
             COALESCE(r.reported_lat, r.lat)::float AS lat, 
             COALESCE(r.reported_lon, r.lon)::float AS lon, 
             r.status, r.created_at, u.full_name AS reporter_name, u.email AS reporter_email
      FROM citizen_reports r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.status = 'PENDING_REVIEW' OR r.status IS NULL
      ORDER BY r.created_at DESC;
    `;
    const result = await db.query(sql);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/incidents/:id/verify
 * Protected for ADMIN & DISTRICT_OFFICER: Verify or Reject report
 */
async function verifyIncident(req, res, next) {
  try {
    const { id } = req.params;
    const { action, status } = req.body;

    const targetStatus = status || ((action === 'REJECT' || action === 'REJECTED') ? 'REJECTED' : 'VERIFIED_ACTIVE');
    const verifierId = req.user ? req.user.id : null;

    const sql = `
      UPDATE citizen_reports
      SET status = $1, verified_by = $2, verified_at = NOW()
      WHERE id = $3
      RETURNING id, district, hazard_type, status, verified_at;
    `;
    const result = await db.query(sql, [targetStatus, verifierId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Incident report not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Incident report marked as ${targetStatus}`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createIncident,
  getPublicIncidents,
  getPendingIncidents,
  verifyIncident,
};
