# GTM Alpha Backend Service

🚀 **Backend service that properly executes GTM consultations via Apify API**

This Node.js Express server enables the GTM Alpha Consultation form to actually run Apify actors and generate real consultation reports.

## 🎯 Features

- ✅ **Direct Apify Integration** - Calls GTM Alpha Consultant actor with your API token
- ✅ **Proper Error Handling** - Handles maintenance mode and actor failures gracefully  
- ✅ **CORS Configured** - Works with GitHub Pages frontend
- ✅ **Real-time Status** - Health checks and consultation tracking
- ✅ **Production Ready** - Structured for easy deployment

## 🚀 Quick Deployment to Railway (Recommended)

### One-Click Deploy to Railway
1. **Fork this repository** to your GitHub account
2. **Connect to Railway**: Go to [Railway.app](https://railway.app) and connect your GitHub
3. **Deploy from GitHub**: Select this repository and deploy
4. **Set Environment Variable**: Add `APIFY_API_TOKEN=apify_api_4mszz5eKTSbZNyPf7GMqGDIcoydYj64gY8mn`
5. **Get Backend URL**: Copy the generated Railway URL for frontend integration

## 🌐 Alternative Deployment Options

### Heroku
```bash
heroku create gtm-alpha-backend
heroku config:set APIFY_API_TOKEN=apify_api_4mszz5eKTSbZNyPf7GMqGDIcoydYj64gY8mn
git push heroku main
```

### Vercel
```bash
npm install -g vercel
vercel
# Set APIFY_API_TOKEN in Vercel dashboard
```

## 🔧 Local Development

```bash
# Clone and setup
git clone https://github.com/shashwatgtm/gtm-alpha-backend.git
cd gtm-alpha-backend
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

## 📋 API Endpoints

### `GET /health`
Health check endpoint

### `POST /api/gtm-consultation`
Main consultation endpoint that runs GTM Alpha Consultant actor

### `GET /api/consultation/:runId`
Get consultation result by run ID

### `GET /api/consultations`
List recent consultations

## 🔗 Frontend Integration

After deploying, update your frontend's `BACKEND_URL`:
```javascript
const BACKEND_URL = 'https://your-deployed-backend-url.com';
```

## 🎯 What This Solves

**Before**: Form submissions weren't reaching Apify  
**After**: Direct API integration that properly executes GTM consultations

**Before**: Manual JSON copy-paste workflow  
**After**: One-click form submission with real-time progress

**Before**: Reports with old cached data  
**After**: Reports with correct user details

---

Created by **Shashwat Ghosh** - [GTM Expert](https://gtmexpert.com/contact-shashwat-ghosh)