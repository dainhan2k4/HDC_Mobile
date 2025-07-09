const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const NodeCache = require('node-cache');

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

// Rate limiting (only in production)
if (config.server.nodeEnv === 'production') {
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
  console.log('🛡️ [Security] Rate limiting enabled for production');
} else {
  console.log('🔓 [Development] Rate limiting disabled for development');
}

// Response caching middleware  
const responseCache = new NodeCache({ 
  stdTTL: config.server.nodeEnv === 'production' ? 30 : 10, // 10s for dev, 30s for prod
  checkperiod: 60 // Check for expired keys every 60 seconds
});

// Helper function to clear portfolio and transaction related cache
const clearPortfolioCache = () => {
  const portfolioKeys = responseCache.keys().filter(key => 
    key.includes('/portfolio/')
  );
  portfolioKeys.forEach(key => {
    responseCache.del(key);
    console.log(`🗑️ [Cache] Cleared cache for ${key}`);
  });
  console.log(`🧹 [Cache] Cleared ${portfolioKeys.length} portfolio cache entries`);
};

const clearTransactionCache = () => {
  const transactionKeys = responseCache.keys().filter(key => 
    key.includes('/transaction/')
  );
  transactionKeys.forEach(key => {
    responseCache.del(key);
    console.log(`🗑️ [Cache] Cleared cache for ${key}`);
  });
  console.log(`🧹 [Cache] Cleared ${transactionKeys.length} transaction cache entries`);
};

// Add cache clearing methods to app for easy access from controllers
app.clearResponseCache = (type) => {
  if (type === 'portfolio') {
    clearPortfolioCache();
  } else if (type === 'transaction') {
    clearTransactionCache();
  } else if (type === 'all') {
    const allKeys = responseCache.keys();
    responseCache.flushAll();
    console.log(`🧹 [Cache] Cleared all ${allKeys.length} cache entries`);
  }
};

const cacheMiddleware = (duration = 30) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      // For non-GET requests (POST/PUT/DELETE), clear related cache after response
      const originalJson = res.json;
      res.json = function(body) {
        const result = originalJson.call(this, body);
        
        // Clear portfolio and transaction cache after successful transactions
        if (res.statusCode === 200 && body.success !== false) {
          console.log(`🔍 [Cache] Checking if need to clear cache for ${req.originalUrl}, method: ${req.method}, status: ${res.statusCode}, success: ${body.success}`);
          
          if (req.originalUrl.includes('/transaction/')) {
            console.log(`🔄 [Cache] Transaction completed successfully, clearing portfolio and transaction cache`);
            clearPortfolioCache();
            clearTransactionCache();
          }
          // Also clear for portfolio clear-cache endpoint
          if (req.originalUrl.includes('/portfolio/clear-cache')) {
            console.log(`🔄 [Cache] Portfolio cache clear requested, clearing response cache too`);
            clearPortfolioCache();
            clearTransactionCache();
          }
        } else {
          console.log(`⚠️ [Cache] Not clearing cache - Status: ${res.statusCode}, Success: ${body.success}, URL: ${req.originalUrl}`);
        }
        
        return result;
      };
      return next();
    }

    const key = req.originalUrl;
    
    // Check for force-refresh header to bypass cache
    const forceRefresh = req.headers['x-force-refresh'] === 'true';
    
    const cachedResponse = forceRefresh ? null : responseCache.get(key);

    if (cachedResponse && !forceRefresh) {
      console.log(`📦 [Cache] Cache hit for ${key}`);
      return res.json(cachedResponse);
    } else if (forceRefresh) {
      console.log(`🔄 [Cache] Force refresh requested for ${key}`);
      responseCache.del(key);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(body) {
      if (res.statusCode === 200 && body.success !== false) {
        console.log(`💾 [Cache] Caching response for ${key}`);
        responseCache.set(key, body, duration);
      }
      return originalJson.call(this, body);
    };

    next();
  };
};

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

// Clear response cache endpoint
app.post('/clear-response-cache', (req, res) => {
  try {
    const allKeys = responseCache.keys();
    responseCache.flushAll();
    console.log(`🧹 [Cache] Manual clear: Removed ${allKeys.length} cache entries`);
    
    res.json({
      success: true,
      message: 'Response cache cleared successfully',
      clearedEntries: allKeys.length
    });
  } catch (error) {
    console.error('❌ [Cache] Failed to clear response cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear response cache'
    });
  }
});

// Debug cache status endpoint
app.get('/cache-status', (req, res) => {
  const keys = responseCache.keys();
  const stats = responseCache.getStats();
  const cacheData = {};
  
  keys.forEach(key => {
    const data = responseCache.get(key);
    cacheData[key] = {
      hasData: !!data,
      dataSize: data ? JSON.stringify(data).length : 0,
      ttl: responseCache.getTtl(key)
    };
  });
  
  res.json({
    success: true,
    cacheStats: stats,
    totalKeys: keys.length,
    cacheEntries: cacheData,
    environment: config.server.nodeEnv
  });
});

// API routes with caching (shorter cache in development)
const portfolioCacheDuration = config.server.nodeEnv === 'production' ? 30 : 5; // 5s for dev
const profileCacheDuration = config.server.nodeEnv === 'production' ? 60 : 15; // 15s for dev
const transactionCacheDuration = config.server.nodeEnv === 'production' ? 10 : 3; // 3s for dev

app.use(`${config.server.apiPrefix}/portfolio`, cacheMiddleware(portfolioCacheDuration), portfolioRoutes);
app.use(`${config.server.apiPrefix}/profile`, cacheMiddleware(profileCacheDuration), profileRoutes);  
app.use(`${config.server.apiPrefix}/transaction`, cacheMiddleware(transactionCacheDuration), transactionRoutes);

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