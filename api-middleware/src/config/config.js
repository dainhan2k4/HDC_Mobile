require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api/v1'
  },

  // Odoo Backend Configuration
  odoo: {
    baseUrl: 'http://localhost:11018', // Force localhost, ignore env vars
    database: 'p2p', // Try different database to avoid rate limiting
    username: 'pnttmtr15@gmail.com',
    password: '123',
    timeout: 15000
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    checkPeriod: 120 // Check for expired keys every 2 minutes
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
    rateLimitWindow: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 900000, // 15 minutes
    rateLimitMax: parseInt(process.env.API_RATE_LIMIT_MAX) || 100
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

module.exports = config; 