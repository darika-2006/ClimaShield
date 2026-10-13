const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const climateRoutes = require('./routes/climateRoutes');
const shelterRoutes = require('./routes/shelterRoutes');
const systemRoutes = require('./routes/systemRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Core Middlewares
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 2. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'ClimaShield TN API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// 3. API V1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/climate', climateRoutes);
app.use('/api/v1/shelters', shelterRoutes);
app.use('/api/v1/system', systemRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/chat', chatbotRoutes);
app.use('/api/v1/alerts', alertRoutes);

// 4. 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Endpoint Not Found - ${req.method} ${req.originalUrl}`,
  });
});

// 5. Global Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('🔴 Server Exception:', err.stack || err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 6. Start Express Server
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🛡️ ClimaShield TN Express API Server Running`);
    console.log(`⚡ Port: ${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n🔴 Error: Port ${PORT} is already in use by another running Node process.`);
      console.error(`👉 To free the port, run one of the following commands in your terminal:`);
      console.error(`   • npx kill-port ${PORT}`);
      console.error(`   • fuser -k ${PORT}/tcp\n`);
      process.exit(1);
    }
  });
}

module.exports = app;
