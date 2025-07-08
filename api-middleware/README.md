# Odoo API Middleware Server

REST API middleware for Odoo backend inspired by [Simpos](https://github.com/hieuhani/simpos) architecture.

## Features

- ✅ **Clean REST API** endpoints cho mobile app
- ✅ **Efficient caching** với Node-Cache (inspired by Simpos IndexedDB approach)
- ✅ **Automatic session management** với Odoo backend
- ✅ **Data transformation** và calculated metrics
- ✅ **Security features** - Helmet, CORS, Rate limiting
- ✅ **Error handling** và logging
- ✅ **Health monitoring**

## Installation

```bash
cd api-middleware
npm install
```

## Configuration

Create `.env` file:

```env
# Server Configuration
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
```

## Usage

### Start Development Server

```bash
npm run dev
```

### Start Production Server

```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Portfolio Endpoints

#### Get Portfolio Overview
```
GET /api/v1/portfolio/overview
```

Response:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalInvestment": 3500000,
      "totalCurrentValue": 3750000,
      "totalProfitLoss": 250000,
      "totalProfitLossPercentage": 7.14,
      "investmentCount": 5
    },
    "funds": [...],
    "allocation": [...],
    "lastUpdated": "2024-01-20T10:30:00.000Z"
  }
}
```

#### Get All Investments
```
GET /api/v1/portfolio/investments
```

#### Get All Funds
```
GET /api/v1/portfolio/funds
```

#### Get Performance Metrics
```
GET /api/v1/portfolio/performance
```

#### Refresh Data Cache
```
POST /api/v1/portfolio/refresh
```

## Architecture

### Inspired by Simpos Design

1. **Caching Layer**: Node-Cache để store API responses (similar to Simpos IndexedDB)
2. **Data Transformation**: Clean data formatting trước khi send to mobile app
3. **Session Management**: Automatic Odoo authentication và session reuse
4. **Error Handling**: Comprehensive error handling với fallbacks

### Data Flow

```
Mobile App → API Middleware → Odoo Backend
     ↑            ↓
   Clean REST   Cache Layer
   Responses   + Transform
```

## Benefits vs Direct Odoo Calls

| Feature | Direct Odoo | API Middleware |
|---------|------------|----------------|
| Authentication | Complex session handling | Automatic session management |
| Data Format | Odoo-specific responses | Clean, consistent JSON |
| Caching | None | Built-in caching |
| Error Handling | Raw Odoo errors | User-friendly error messages |
| Mobile Optimization | Not optimized | Optimized for mobile consumption |
| Rate Limiting | None | Built-in protection |

## Integration with Mobile App

Update your mobile app's API configuration:

```typescript
// Before (Direct Odoo)
const ODOO_BASE_URL = 'https://ff08e2fb94f3.ngrok-free.app';

// After (API Middleware)
const API_BASE_URL = 'http://localhost:3001/api/v1';
```

Example mobile app integration:

```typescript
// Get portfolio overview
const response = await fetch(`${API_BASE_URL}/portfolio/overview`);
const { data } = await response.json();

// Use clean, consistent data structure
const { overview, funds, allocation } = data;
```

## Monitoring

- Health check endpoint: `http://localhost:3001/health`
- Server logs với Morgan
- Error tracking với stack traces
- Performance metrics in responses

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Run tests
npm test
```

## Production Deployment

1. Set production environment variables
2. Use process manager (PM2):

```bash
npm install -g pm2
pm2 start src/server.js --name "odoo-api-middleware"
pm2 startup
pm2 save
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Configured for mobile apps
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Request validation
- **Error Sanitization**: No sensitive data in error responses 