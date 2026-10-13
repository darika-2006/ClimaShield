const db = require('../config/db');
const { dispatchAlert } = require('./alertController');

/**
 * GET /api/v1/admin/metrics
 * Protected: Returns system telemetry, active shelters, pending incidents, and registered citizens.
 */
async function getAdminMetrics(req, res, next) {
  try {
    const usersCountRes = await db.query('SELECT COUNT(*) FROM users;');
    const pendingIncidentsRes = await db.query("SELECT COUNT(*) FROM citizen_reports WHERE status = 'PENDING_REVIEW';");
    const verifiedIncidentsRes = await db.query("SELECT COUNT(*) FROM citizen_reports WHERE status = 'VERIFIED_ACTIVE';");
    const sheltersCountRes = await db.query('SELECT COUNT(*), SUM(capacity) AS total_capacity, SUM(current_occupancy) AS total_occupancy FROM shelters;');

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: parseInt(usersCountRes.rows[0].count),
        pendingIncidents: parseInt(pendingIncidentsRes.rows[0].count),
        verifiedIncidents: parseInt(verifiedIncidentsRes.rows[0].count),
        totalShelters: parseInt(sheltersCountRes.rows[0].count),
        totalCapacity: parseInt(sheltersCountRes.rows[0].total_capacity || 0),
        totalOccupancy: parseInt(sheltersCountRes.rows[0].total_occupancy || 0),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/shelters/:id
 * Protected: Update shelter capacity and occupancy
 */
async function updateShelterOccupancy(req, res, next) {
  try {
    const { id } = req.params;
    const { current_occupancy, capacity } = req.body;

    const sql = `
      UPDATE shelters
      SET current_occupancy = COALESCE($1, current_occupancy),
          capacity = COALESCE($2, capacity)
      WHERE id = $3
      RETURNING id, name, capacity, current_occupancy, (capacity - current_occupancy) AS available_beds;
    `;
    const result = await db.query(sql, [
      current_occupancy !== undefined ? parseInt(current_occupancy) : null,
      capacity !== undefined ? parseInt(capacity) : null,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Shelter not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Shelter occupancy updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/admin/broadcast
 * Protected: Dispatch emergency alert advisories
 */
async function dispatchBroadcastAlert(req, res, next) {
  return dispatchAlert(req, res, next);
}

module.exports = {
  getAdminMetrics,
  updateShelterOccupancy,
  dispatchBroadcastAlert,
};
