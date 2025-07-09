const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const config = require('./config/config');
const portfolioRoutes = require('./routes/portfolioRoutes');
const profileRoutes = require('./routes/profileRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API server
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS configuration for mobile app
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:19006',
    'http://192.168.50.104:19006', // Mobile app on network
    'exp://192.168.50.104:8081', // Expo development server
    '*' // Allow all origins for development (tighten in production)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.server.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMax,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API middleware server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.nodeEnv,
    version: require('../package.json').version
  });
});

// API routes
app.use(`${config.server.apiPrefix}/portfolio`, portfolioRoutes);
app.use(`${config.server.apiPrefix}/profile`, profileRoutes);
app.use(`${config.server.apiPrefix}/transaction`, transactionRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Odoo API Middleware Server',
    description: 'REST API middleware for Odoo backend inspired by Simpos architecture',
    version: require('../package.json').version,
    endpoints: {
      health: '/health',
      portfolio: {
        overview: `${config.server.apiPrefix}/portfolio/overview`,
        investments: `${config.server.apiPrefix}/portfolio/investments`,
        funds: `${config.server.apiPrefix}/portfolio/funds`,
        performance: `${config.server.apiPrefix}/portfolio/performance`,
        refresh: `${config.server.apiPrefix}/portfolio/refresh`,
        clearCache: `${config.server.apiPrefix}/portfolio/clear-cache`
      },
      profile: {
        personal: `${config.server.apiPrefix}/profile/personal`,
        personalData: `${config.server.apiPrefix}/profile/data_personal_profile`,
        bankInfo: `${config.server.apiPrefix}/profile/data_bank_info`,
        addressInfo: `${config.server.apiPrefix}/profile/data_address_info`
      },
      transaction: {
        buy: `${config.server.apiPrefix}/transaction/buy`,
        sell: `${config.server.apiPrefix}/transaction/sell`,
        pending: `${config.server.apiPrefix}/transaction/pending`,
        history: `${config.server.apiPrefix}/transaction/history`,
        stats: `${config.server.apiPrefix}/transaction/stats`
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} was not found on this server.`,
    availableEndpoints: [
      '/health',
      
      `${config.server.apiPrefix}/portfolio/overview`,
      `${config.server.apiPrefix}/portfolio/investments`,
      `${config.server.apiPrefix}/portfolio/funds`,
      `${config.server.apiPrefix}/portfolio/performance`,
      `${config.server.apiPrefix}/portfolio/refresh`,
      `${config.server.apiPrefix}/portfolio/clear-cache`,
      
      `${config.server.apiPrefix}/profile/personal`,
      `${config.server.apiPrefix}/profile/data_personal_profile`,
      `${config.server.apiPrefix}/profile/data_bank_info`,
      `${config.server.apiPrefix}/profile/data_address_info`,
      
      `${config.server.apiPrefix}/transaction/buy`,
      `${config.server.apiPrefix}/transaction/sell`,
      `${config.server.apiPrefix}/transaction/pending`,
      `${config.server.apiPrefix}/transaction/history`,
      `${config.server.apiPrefix}/transaction/stats`
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 [Server] Unhandled error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: config.server.nodeEnv === 'production' ? 'Internal server error' : error.message,
    ...(config.server.nodeEnv !== 'production' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 [Server] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ [Server] Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 [Server] SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ [Server] Process terminated');
    process.exit(0);
  });
});

// Start server - bind to all interfaces to accept external connections
const server = app.listen(config.server.port, '0.0.0.0', () => {
  console.log('🚀 [Server] Starting Odoo API Middleware Server...');
  console.log(`📡 [Server] Server running on port ${config.server.port}`);
  console.log(`🌍 [Server] Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 [Server] API Base URL: http://localhost:${config.server.port}${config.server.apiPrefix}`);
  console.log(`🏥 [Server] Health check: http://localhost:${config.server.port}/health`);
  console.log(`📊 [Server] Portfolio overview: http://localhost:${config.server.port}${config.server.apiPrefix}/portfolio/overview`);
  console.log(`🔧 [Server] Odoo backend: ${config.odoo.baseUrl}`);
  console.log('✅ [Server] Server ready to accept connections');
});

module.exports = app; 