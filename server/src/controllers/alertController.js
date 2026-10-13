const db = require('../config/db');

/**
 * Ensure alerts table exists
 */
async function ensureAlertsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS alerts (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL DEFAULT 'EMERGENCY DISASTER ADVISORY',
          severity VARCHAR(50) NOT NULL DEFAULT 'CRITICAL',
          target_district VARCHAR(100) NOT NULL DEFAULT 'Statewide',
          message TEXT NOT NULL,
          dispatched_by VARCHAR(150),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
      );
    `);
  } catch (err) {
    console.error('Error creating alerts table:', err.message);
  }
}
ensureAlertsTable();

/**
 * GET /api/v1/alerts/active
 * Fetches active alerts for a given district or statewide
 */
async function getActiveAlerts(req, res, next) {
  try {
    const { district } = req.query;
    const targetDistrict = district || 'Statewide';

    const sql = `
      SELECT id, title, severity, target_district, message, dispatched_by, created_at, expires_at
      FROM alerts
      WHERE is_active = TRUE
        AND (LOWER(target_district) = LOWER($1) OR target_district = 'Statewide' OR target_district = 'ALL')
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC;
    `;
    const result = await db.query(sql, [targetDistrict]);

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
 * POST /api/v1/alerts/dispatch (and /api/v1/admin/broadcast)
 * Dispatch emergency alert advisory (Admin / Officer Protected)
 */
async function dispatchAlert(req, res, next) {
  try {
    const {
      title,
      severity,
      district,
      target_district,
      alertDistrict,
      message,
      alertMessage,
      expires_at,
    } = req.body;

    const finalDistrict = alertDistrict || target_district || district || 'Statewide';
    const finalMessage = alertMessage || message;
    const finalSeverity = severity || 'CRITICAL';
    const finalTitle = title || (finalSeverity === 'CRITICAL' ? 'Flash Flood & Disaster Warning' : 'Emergency Advisory');
    const senderName = req.user ? req.user.full_name : 'State Disaster Command Cell';

    if (!finalMessage) {
      return res.status(400).json({ success: false, error: 'Alert message string is required.' });
    }

    const sql = `
      INSERT INTO alerts (title, severity, target_district, message, dispatched_by, is_active)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      RETURNING id, title, severity, target_district, message, dispatched_by, created_at;
    `;

    const result = await db.query(sql, [
      finalTitle,
      finalSeverity,
      finalDistrict,
      finalMessage,
      senderName,
    ]);

    // Also log to activity logs if user is authenticated
    if (req.user) {
      try {
        await db.query(
          `INSERT INTO user_activity_logs (user_id, activity_type, target_entity, metadata)
           VALUES ($1, 'DISPATCH_ALERT', $2, $3);`,
          [req.user.id, finalDistrict, JSON.stringify({ severity: finalSeverity, message: finalMessage })]
        );
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      message: 'Alert Dispatched Successfully',
      data: result.rows[0],
      broadcast: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getActiveAlerts,
  dispatchAlert,
};
