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
    database: 'p2p2', // Try different database to avoid rate limiting
    username: 'huy@gmail.com',
    password: '123456',
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
    rateLimitWindow: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 60000, // 1 minute for development
    rateLimitMax: parseInt(process.env.API_RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'production' ? 100 : 10000) // 1000 for dev, 100 for prod
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

module.exports = config; 