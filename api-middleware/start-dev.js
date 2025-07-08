#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Odoo API Middleware Development Server...\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found! Creating from template...');
  
  const envContent = `# Server Configuration
PORT=3001
NODE_ENV=development

# Odoo Backend Configuration
ODOO_BASE_URL=https://ff08e2fb94f3.ngrok-free.app
ODOO_DATABASE=p2p
ODOO_USERNAME=admin
ODOO_PASSWORD=admin

# API Configuration
API_PREFIX=/api/v1
CACHE_TTL=300
REQUEST_TIMEOUT=15000

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
API_RATE_LIMIT_WINDOW=900000
API_RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created! Please review and update the configuration.\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  const installProcess = spawn('npm', ['install'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
  
  installProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Dependencies installed successfully!\n');
      startServer();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  console.log('🔥 Starting development server with auto-reload...\n');
  console.log('📡 API will be available at: http://localhost:3001');
  console.log('🏥 Health check: http://localhost:3001/health');
  console.log('📊 Portfolio overview: http://localhost:3001/api/v1/portfolio/overview\n');
  console.log('Press Ctrl+C to stop the server\n');
  console.log('=' .repeat(60));
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
  });
  
  process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down development server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
} 