const express = require('express');
const router = express.Router();
const { login, register, oauthCallback, getMe } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.post('/register', register);
router.post('/oauth-callback', oauthCallback);
router.get('/me', authMiddleware, getMe);

module.exports = router;
