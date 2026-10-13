const express = require('express');
const router = express.Router();
const { handleChatMessage } = require('../controllers/chatbotController');

router.post('/message', handleChatMessage);

module.exports = router;
