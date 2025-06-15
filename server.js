const express = require('express');
const cors = require('cors');
const ApifyApi = require('apify-client');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Apify client with fallback tokens
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || 'apify_api_DFgcaQdaxQGQVd2mB6jz7q7GIiJQ1w2jUfb3';

const apifyClient = new ApifyApi({
    token: APIFY_TOKEN,
});

// Enhanced CORS configuration
app.use(cors({
    origin: [
        'https://shashwatgtm.github.io',
        'http://localhost:3000',
        'http://localhost:8080',
        'https://web-production-0616.up.railway.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        platform: 'Railway',
        actor: 'wiDXIHsc6oqnpeER2',
        version: '8.0',
        env: process.env.NODE_ENV || 'development',
        hasToken: !!APIFY_TOKEN
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'GTM Alpha Backend - Railway Deployment',
        status: 'running',
        version: '8.0',
        endpoints: {
            health: '/health',
            consultation: '/api/gtm-consultation'
        },
        frontend: 'https://shashwatgtm.github.io/gtm-alpha-consultation/'
    });
});

// Enhanced GTM consultation endpoint
app.post('/api/gtm-consultation', async (req, res) => {
    try {
        console.log('📨 GTM consultation request received on Railway');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        // Validate required fields
        const required = ['client_name', 'company_name', 'gtm_challenge', 'business_stage'];
        const missing = required.filter(field => !req.body[field]);
        
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missing.join(', ')}`,
                required_fields: required
            });
        }

        // Prepare input data matching your actor schema exactly
        const inputData = {
            client_name: req.body.client_name,
            client_designation: req.body.client_designation || '',
            company_name: req.body.company_name,
            company_description: req.body.company_description || '',
            gtm_challenge: req.body.gtm_challenge,
            business_stage: req.body.business_stage,
            industry: req.body.industry || '',
            current_team_size: req.body.current_team_size || '',
            budget_range: req.body.budget_range || '',
            specific_focus: req.body.specific_focus || '',
            confirm_new_consultation: true
        };

        console.log('🚀 Calling GTM Alpha Consultant actor: wiDXIHsc6oqnpeER2');
        console.log('Actor input:', JSON.stringify(inputData, null, 2));

        // Call your GTM Alpha Consultant actor
        const run = await apifyClient.actor('wiDXIHsc6oqnpeER2').call(inputData, {
            timeout: 360,  // 6 minutes
            memory: 256
        });

        console.log('Actor run completed:', {
            id: run.id,
            status: run.status,
            duration: run.stats?.durationMillis,
            datasetId: run.defaultDatasetId
        });

        if (run.status === 'SUCCEEDED') {
            // Get the generated consultation data
            const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
            
            if (items && items.length > 0) {
                const consultation = items[0];
                
                const response = {
                    success: true,
                    runId: run.id,
                    status: run.status,
                    duration: run.stats?.durationMillis,
                    data: {
                        consultation_id: consultation.consultation_id,
                        report_url: consultation.report_url,
                        primary_focus: consultation.primary_epic_focus,
                        epic_scores: consultation.epic_scores,
                        consultation_output: consultation.consultation_output,
                        timestamp: consultation.timestamp
                    },
                    consoleUrl: `https://console.apify.com/view/runs/${run.id}`,
                    datasetUrl: `https://console.apify.com/storage/datasets/${run.defaultDatasetId}`,
                    timestamp: new Date().toISOString()
                };
                
                console.log('✅ GTM consultation successful:', response);
                res.json(response);
                
            } else {
                console.error('❌ No consultation data generated');
                res.status(500).json({
                    success: false,
                    message: 'No consultation data generated',
                    runId: run.id,
                    consoleUrl: `https://console.apify.com/view/runs/${run.id}`
                });
            }
        } else if (run.status === 'FAILED') {
            console.error('❌ Actor run failed:', run.statusMessage);
            res.status(500).json({
                success: false,
                message: `GTM consultation failed: ${run.statusMessage}`,
                runId: run.id,
                status: run.status,
                consoleUrl: `https://console.apify.com/view/runs/${run.id}`
            });
        } else {
            console.error('❌ Unexpected actor status:', run.status);
            res.status(500).json({
                success: false,
                message: `Unexpected status: ${run.status}`,
                runId: run.id,
                status: run.status,
                consoleUrl: `https://console.apify.com/view/runs/${run.id}`
            });
        }

    } catch (error) {
        console.error('💥 Railway backend error:', error);
        
        // Enhanced error handling
        let errorMessage = 'Internal server error';
        let statusCode = 500;
        
        if (error.message.includes('Actor not found')) {
            errorMessage = 'GTM Alpha Consultant actor not found';
            statusCode = 404;
        } else if (error.message.includes('token')) {
            errorMessage = 'Authentication error - invalid Apify token';
            statusCode = 401;
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timeout - please try again';
            statusCode = 408;
        }
        
        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: error.message,
            timestamp: new Date().toISOString(),
            backend: 'Railway v8.0'
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 GTM Alpha Backend v8.0 running on Railway`);
    console.log(`📡 Port: ${port}`);
    console.log(`🎯 Actor: wiDXIHsc6oqnpeER2`);
    console.log(`🔑 Apify token: ${APIFY_TOKEN ? 'configured' : 'MISSING!'}`);
    console.log(`🌐 CORS enabled for GitHub Pages`);
    console.log(`⚡ Health endpoint: /health`);
    console.log(`🎯 Consultation endpoint: /api/gtm-consultation`);
});

module.exports = app;