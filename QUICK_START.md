# Quick Start Guide - Strata Trader

## 🚀 Phase 1: BingX Integration & Market Data Viewer (COMPLETE)

### What's Implemented

✅ **Backend (NestJS)**
- BingX API client with authentication
- Market data endpoints with caching
- Rate limiting and error handling
- Complete REST API

✅ **Frontend (Angular)**
- Live market data dashboard
- Real-time price updates
- PrimeNG + Tailwind UI
- Auto-refresh every 5 seconds

---

## 📋 Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- BingX API credentials (optional for testing)

---

## 🔧 Setup

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Edit .env and add your BingX credentials (optional)
# For testing, you can use demo mode without real credentials
nano .env
```

**Important Environment Variables:**
```env
# BingX API Configuration
BINGX_API_KEY=your_api_key_here
BINGX_SECRET_KEY=your_secret_key_here
BINGX_BASE_URL=https://open-api.bingx.com
BINGX_TESTNET=true

# MongoDB (optional for now)
MONGODB_URI=mongodb://localhost:27017/strata-trader
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configuration is ready in src/environments/
```

---

## ▶️ Running the Application

### Start Backend (Terminal 1)

```bash
cd backend
npm run start:dev
```

**Expected output:**
```
[Nest] INFO [NestApplication] Nest application successfully started
🚀 Application is running on: http://localhost:3000/api
[MarketService] Market Service initialized - Cache TTL: 300000ms
```

### Start Frontend (Terminal 2)

```bash
cd frontend
npm start
```

**Expected output:**
```
✔ Browser application bundle generation complete.
Initial Chunk Files   | Names         |  Raw Size
...
** Angular Live Development Server is listening on localhost:4200
```

---

## 🌐 Access the Application

**Frontend:** http://localhost:4200
**Backend API:** http://localhost:3000/api

---

## 📡 API Endpoints

### Market Data

```bash
# Get all trading symbols
curl http://localhost:3000/api/market/symbols

# Get candlestick data for BTC-USDT (1 hour interval, 100 candles)
curl "http://localhost:3000/api/market/candles?symbol=BTC-USDT&interval=1h&limit=100"

# Get ticker for BTC-USDT
curl http://localhost:3000/api/market/ticker/BTC-USDT

# Get all tickers
curl http://localhost:3000/api/market/tickers

# Get order book for BTC-USDT
curl http://localhost:3000/api/market/depth/BTC-USDT?limit=20

# Get cache statistics
curl http://localhost:3000/api/market/cache/stats

# Clear all cache
curl -X DELETE http://localhost:3000/api/market/cache
```

### Available Intervals
- `1m`, `3m`, `5m`, `15m`, `30m`
- `1h`, `2h`, `4h`, `6h`, `12h`
- `1d`, `3d`, `1w`, `1M`

### Popular Trading Pairs
- BTC-USDT
- ETH-USDT
- BNB-USDT
- SOL-USDT
- XRP-USDT
- ADA-USDT
- DOGE-USDT
- MATIC-USDT

---

## 🧪 Testing the Integration

### 1. Test Backend API

```bash
# Test connectivity
curl http://localhost:3000/api/market/symbols | jq

# Get BTC price
curl http://localhost:3000/api/market/ticker/BTC-USDT | jq

# Get recent candles
curl "http://localhost:3000/api/market/candles?symbol=BTC-USDT&interval=15m&limit=10" | jq
```

### 2. Test Frontend

1. Open http://localhost:4200
2. You should see the **Market Overview** dashboard
3. Table shows live prices for popular crypto pairs
4. Prices update automatically every 5 seconds
5. Click "Refresh" button to manually refresh data
6. Green/Red tags show 24h price changes

---

## 🐛 Troubleshooting

### Backend won't start

**Issue:** MongoDB connection error
```
Solution: MongoDB is optional for Phase 1. Comment out MongoDB config in app.module.ts or install MongoDB locally.
```

**Issue:** BingX API errors
```
Solution: Check your API credentials in .env
Ensure BINGX_TESTNET=true for testing
Rate limit: max 60 requests/minute
```

### Frontend won't load data

**Issue:** CORS error in browser console
```
Solution: Check backend is running on http://localhost:3000
CORS is configured for localhost:4200
```

**Issue:** API connection refused
```
Solution: Ensure backend is running
Check environment.ts has correct apiUrl: 'http://localhost:3000/api'
```

### Cache Issues

```bash
# Clear backend cache
curl -X DELETE http://localhost:3000/api/market/cache

# Clear cache for specific symbol
curl -X DELETE http://localhost:3000/api/market/cache/BTC-USDT
```

---

## 📊 What You Can Do Now

### 1. View Live Market Data
- Dashboard shows real-time crypto prices
- Auto-refresh keeps data current
- Filter by popular pairs

### 2. Access Market API
- Full REST API available
- Get historical candles
- Fetch order book data
- Query ticker information

### 3. Test Caching
- First request fetches from BingX
- Subsequent requests use cache (faster)
- Cache auto-expires after TTL
- Monitor cache stats

---

## 🔜 Next Steps

### Phase 2: Support/Resistance Calculation
- Implement Pivot Points calculator
- Swing Highs/Lows detection
- Volume Profile analysis
- Level strength scoring

### Phase 3: Divergence Detection
- RSI, MACD, Volume divergences
- Bullish/Bearish classification
- Multi-timeframe confirmation
- Confidence scoring

### Phase 4: Order Management
- Create/modify/cancel orders
- Risk management calculator
- Position tracking
- Take profit levels

---

## 📖 Documentation

- **Overview:** [doc/OVERVIEW.md](doc/OVERVIEW.md)
- **Architecture:** [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md)
- **Features:** [doc/FEATURES.md](doc/FEATURES.md)
- **Roadmap:** [doc/ROADMAP.md](doc/ROADMAP.md)
- **Backend Modules:** [doc/backend/MODULES.md](doc/backend/MODULES.md)
- **Frontend Components:** [doc/frontend/COMPONENTS.md](doc/frontend/COMPONENTS.md)
- **Trading Strategy:** [doc/trading/STRATEGY.md](doc/trading/STRATEGY.md)

---

## 💡 Tips

1. **Rate Limiting:** Backend enforces 60 requests/minute to BingX
2. **Caching:** Candles cached for 5 minutes, tickers for 5 seconds
3. **Logging:** Check backend console for detailed API logs
4. **Error Handling:** All endpoints have comprehensive error messages
5. **Type Safety:** Full TypeScript types in both backend and frontend

---

## ❓ Need Help?

Check the logs:
```bash
# Backend logs show all API requests
cd backend && npm run start:dev

# Frontend console shows API calls and errors
Open browser DevTools (F12) -> Console
```

Common issues documented in:
- Backend README: `backend/README.md`
- Frontend README: `frontend/README.md`

---

**Happy Trading! 🚀📈**
