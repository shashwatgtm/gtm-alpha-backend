# GTM Alpha Backend Service

🚀 Backend service for [GTM Alpha Consultation](https://shashwatgtm.github.io/gtm-alpha-consultation/) that properly executes GTM consultations via Apify API.

## 🎯 What This Solves

The original GitHub form had critical issues:
- ❌ No actual Apify runs were being triggered
- ❌ Users had to manually copy/paste JSON 
- ❌ GTM Alpha Consultant actor was under maintenance
- ❌ Reports showed old cached data instead of new user data

This backend service provides:
- ✅ Direct Apify API integration with proper authentication
- ✅ Real-time GTM consultation execution
- ✅ Automatic report generation with correct user data
- ✅ Professional workflow without manual steps

## 🏗️ Architecture

```
GitHub Pages Form → Backend API → Apify Actor → Generated Report
```

- **Frontend**: Updated GitHub Pages form calls backend API
- **Backend**: Node.js Express server with Apify client integration
- **Actor**: GTM Alpha Consultant generates personalized reports
- **Output**: Professional HTML reports with user's actual data

## 🚀 Quick Deploy

### Option 1: Railway (Recommended)

1. **Fork this repository**
2. **Connect to Railway**:
   - Go to [Railway](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select this repository
3. **Set Environment Variables**:
   ```
   APIFY_API_TOKEN=apify_api_4mszz5eKTSbZNyPf7GMqGDIcoydYj64gY8mn
   NODE_ENV=production
   ALLOWED_ORIGINS=https://shashwatgtm.github.io
   ```
4. **Deploy** and copy the generated URL

### Option 2: Heroku

```bash
# Install Heroku CLI, then:
heroku create gtm-alpha-backend
heroku config:set APIFY_API_TOKEN=apify_api_4mszz5eKTSbZNyPf7GMqGDIcoydYj64gY8mn
heroku config:set NODE_ENV=production
heroku config:set ALLOWED_ORIGINS=https://shashwatgtm.github.io
git push heroku main
```

### Option 3: Vercel

```bash
npm install -g vercel
vercel --prod
# Set environment variables in Vercel dashboard
```

## 🔧 Local Development

```bash
# Clone and setup
git clone https://github.com/shashwatgtm/gtm-alpha-backend.git
cd gtm-alpha-backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Apify token

# Start development server
npm run dev
```

## 📝 Environment Variables

Required variables for deployment:

```env
# Required
APIFY_API_TOKEN=apify_api_4mszz5eKTSbZNyPf7GMqGDIcoydYj64gY8mn

# Optional (with defaults)
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://shashwatgtm.github.io,http://localhost:3000
```

## 🛠️ Frontend Integration

After deploying, update the frontend form:

1. **Update BACKEND_URL** in `index.html`:
   ```javascript
   const BACKEND_URL = 'https://your-deployed-backend-url.com';
   ```

2. **Redeploy GitHub Pages** with the updated URL

## 📊 API Endpoints

### Health Check
```
GET /health
Response: { status: "ok", timestamp: "..." }
```

### GTM Consultation
```
POST /api/gtm-consultation
Content-Type: application/json

Body: {
  "client_name": "John Doe",
  "company_name": "Acme Corp",
  "gtm_challenge": "Need better lead generation",
  "business_stage": "bootstrapped-seed-equivalent",
  "confirm_new_consultation": true
}

Response: {
  "success": true,
  "runId": "actor_run_id",
  "status": "SUCCEEDED",
  "reportUrl": "https://...",
  "consoleUrl": "https://console.apify.com/...",
  "duration": 120000,
  "timestamp": "2025-06-14T..."
}
```

## 🔍 Testing the Integration

### Test Backend Health
```bash
curl https://your-backend-url.com/health
```

### Test GTM Consultation
```bash
curl -X POST https://your-backend-url.com/api/gtm-consultation \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test User",
    "company_name": "Test Company",
    "gtm_challenge": "Test challenge",
    "business_stage": "bootstrapped-seed-equivalent",
    "confirm_new_consultation": true
  }'
```

## 🐛 Troubleshooting

### Backend Health Issues
- Check environment variables are set correctly
- Verify Apify token has proper permissions
- Check server logs for detailed error messages

### CORS Issues
- Ensure `ALLOWED_ORIGINS` includes your GitHub Pages URL
- Check browser console for CORS errors
- Verify frontend is calling the correct backend URL

### Actor Maintenance Mode
- Check if GTM Alpha Consultant actor is under maintenance
- Wait for maintenance to complete or contact Apify support
- Form will show proper error message to users

### Form Not Working
- Verify `BACKEND_URL` in frontend matches deployed backend
- Check browser network tab for failed requests
- Ensure all required form fields are filled

## 📈 Expected Results

Once deployed correctly:

1. **Form Submission**: Users fill out GTM form on GitHub Pages
2. **Backend Call**: Form calls your deployed backend API
3. **Apify Execution**: Backend triggers GTM Alpha Consultant actor
4. **Report Generation**: Actor generates personalized HTML report
5. **User Experience**: Users get professional consultation with their actual data

### Sample Success Flow:
- **Input**: "Nitin Prakash" from "Kamlesh Bhai and Sons"
- **Output**: Professional GTM report with "Nitin Prakash" as client name
- **Duration**: 2-3 minutes end-to-end
- **Format**: HTML report with EPIC framework analysis and 90-day roadmap

## 🤝 Support

- **Issues**: Create GitHub issues for bugs or questions
- **Apify Actor**: [GTM Alpha Consultant](https://apify.com/shashghosh/gtm-alpha-consultant)
- **Frontend Form**: [GTM Alpha Consultation](https://shashwatgtm.github.io/gtm-alpha-consultation/)

---

**Created by**: [Shashwat Ghosh](https://gtmexpert.com/contact-shashwat-ghosh)  
**Powered by**: [Apify](https://apify.com) | **Framework**: Node.js + Express