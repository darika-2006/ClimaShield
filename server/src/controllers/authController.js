const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

/**
 * POST /api/v1/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const userRes = await db.query('SELECT * FROM users WHERE email = $1;', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      home_district: user.home_district,
      home_lat: parseFloat(user.home_lat),
      home_lon: parseFloat(user.home_lon),
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: payload,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/oauth-callback
 * Google OAuth / Supabase Auth registration and sync
 */
async function oauthCallback(req, res, next) {
  try {
    const { email, fullName, full_name, home_district } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'OAuth email is required.' });
    }

    let userRes = await db.query('SELECT * FROM users WHERE email = $1;', [email.toLowerCase().trim()]);
    let user;

    if (userRes.rows.length === 0) {
      const name = fullName || full_name || email.split('@')[0];
      const district = home_district || 'Chennai';
      const insertRes = await db.query(
        `INSERT INTO users (email, full_name, role, home_district, auth_provider)
         VALUES ($1, $2, 'CITIZEN', $3, 'GOOGLE')
         RETURNING *;`,
        [email.toLowerCase().trim(), name, district]
      );
      user = insertRes.rows[0];
    } else {
      user = userRes.rows[0];
    }

    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      home_district: user.home_district,
      home_lat: parseFloat(user.home_lat || 13.0827),
      home_lon: parseFloat(user.home_lon || 80.2707),
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      success: true,
      message: 'OAuth authentication successful',
      token,
      user: payload,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/register
 * Citizen Account Registration
 */
async function register(req, res, next) {
  try {
    const { fullName, full_name, email, password, phone, homeDistrict, home_district } = req.body;
    const finalEmail = (email || '').toLowerCase().trim();
    const finalName = fullName || full_name;
    const finalDistrict = homeDistrict || home_district || 'Chennai';

    if (!finalEmail || !password || !finalName) {
      return res.status(400).json({ success: false, error: 'Full Name, Email, and Password are required.' });
    }

    // Check if email already registered
    const existingRes = await db.query('SELECT id FROM users WHERE email = $1;', [finalEmail]);
    if (existingRes.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'An account with this email address already exists.' });
    }

    // Hash password (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // District Coordinates Map
    const districtCoords = {
      'Chennai': { lat: 13.0827, lon: 80.2707 },
      'Coimbatore': { lat: 11.0168, lon: 76.9558 },
      'Madurai': { lat: 9.9252, lon: 78.1198 },
      'Tiruchirappalli': { lat: 10.7905, lon: 78.7047 },
      'Salem': { lat: 11.6643, lon: 78.1460 },
      'Tirunelveli': { lat: 8.7139, lon: 77.7567 },
      'Thoothukudi': { lat: 9.1724, lon: 77.8690 },
      'Cuddalore': { lat: 11.7480, lon: 79.7714 },
    };

    const coords = districtCoords[finalDistrict] || districtCoords['Chennai'];

    // Insert new citizen user
    const insertSql = `
      INSERT INTO users (full_name, email, password_hash, phone, home_district, home_lat, home_lon, role, auth_provider)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'CITIZEN', 'LOCAL')
      RETURNING id, full_name, email, role, home_district, home_lat, home_lon;
    `;
    const insertRes = await db.query(insertSql, [
      finalName,
      finalEmail,
      passwordHash,
      phone || null,
      finalDistrict,
      coords.lat,
      coords.lon,
    ]);

    const user = insertRes.rows[0];

    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      home_district: user.home_district,
      home_lat: parseFloat(user.home_lat),
      home_lon: parseFloat(user.home_lon),
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      success: true,
      message: 'Citizen account created successfully.',
      token,
      user: payload,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 */
async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}

module.exports = {
  login,
  register,
  oauthCallback,
  handleOAuthCallback: oauthCallback,
  getMe,
};
