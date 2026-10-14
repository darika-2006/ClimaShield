const db = require('../config/db');

/**
 * GET /api/v1/audit/recent
 * Returns recent system & user telemetry queries / actions.
 */
async function getRecentAudit(req, res, next) {
  try {
    // 1. Fetch recent incidents or alerts as live audit events
    const incidentsRes = await db.query(`
      SELECT 
        id, 
        district, 
        hazard_type, 
        status, 
        created_at 
      FROM citizen_reports 
      ORDER BY created_at DESC 
      LIMIT 3;
    `);

    const alertsRes = await db.query(`
      SELECT 
        id, 
        target_district, 
        severity, 
        message, 
        created_at 
      FROM broadcast_alerts 
      ORDER BY created_at DESC 
      LIMIT 2;
    `).catch(() => ({ rows: [] }));

    const events = [];

    // Map recent broadcast alerts
    if (alertsRes.rows && alertsRes.rows.length > 0) {
      for (const a of alertsRes.rows) {
        events.push({
          id: `alert-${a.id}`,
          type: 'BROADCAST_ALERT',
          label: `${a.target_district} ${a.severity} Advisory Dispatched`,
          time: a.created_at || new Date().toISOString(),
        });
      }
    }

    // Map recent incident actions
    if (incidentsRes.rows && incidentsRes.rows.length > 0) {
      for (const inc of incidentsRes.rows) {
        events.push({
          id: `inc-${inc.id}`,
          type: 'INCIDENT_AUDIT',
          label: `${inc.district} ${inc.hazard_type} (${inc.status})`,
          time: inc.created_at || new Date().toISOString(),
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRecentAudit,
};
