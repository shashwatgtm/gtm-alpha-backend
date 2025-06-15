const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Railway Node.js v22 compatibility fix - dynamic import
let apifyClient;

async function initializeApifyClient() {
    try {
        // Try multiple import methods for Railway Node.js v22 compatibility
        const apifyModule = require('apify-client');
        
        // Check if it's a default export
        if (apifyModule.default) {
            const ApifyApi = apifyModule.default;
            apifyClient = new ApifyApi({
                token: process.env.APIFY_API_TOKEN || 'apify_api_DFgcaQdaxQGQVd2mB6jz7q7GIiJQ1w2jUfb3',
            });
        } 
        // Check if it's a named export
        else if (apifyModule.ApifyApi) {
            apifyClient = new apifyModule.ApifyApi({
                token: process.env.APIFY_API_TOKEN || 'apify_api_DFgcaQdaxQGQVd2mB6jz7q7GIiJQ1w2jUfb3',
            });
        }
        // Check if it's the constructor itself
        else if (typeof apifyModule === 'function') {
            apifyClient = new apifyModule({
                token: process.env.APIFY_API_TOKEN || 'apify_api_DFgcaQdaxQGQVd2mB6jz7q7GIiJQ1w2jUfb3',
            });
        }
        else {
            throw new Error('Could not find ApifyApi constructor in module');
        }
        
        console.log('✅ Apify client initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Apify client:', error);
        return false;
    }
}

app.use(cors({
    origin: ['https://shashwatgtm.github.io', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '9.0-dynamic-import',
        hasToken: !!(process.env.APIFY_API_TOKEN || 'fallback'),
        apifyClientReady: !!apifyClient
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'GTM Alpha Backend v9.0 - Dynamic Import Fix',
        status: 'running',
        apifyClientStatus: apifyClient ? 'initialized' : 'not initialized'
    });
});

app.post('/api/gtm-consultation', async (req, res) => {
    try {
        console.log('GTM consultation request received');
        
        if (!apifyClient) {
            return res.status(500).json({
                success: false,
                message: 'Apify client not initialized',
                error: 'Server startup issue'
            });
        }
        
        if (!req.body.client_name || !req.body.company_name || !req.body.gtm_challenge) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: client_name, company_name, gtm_challenge'
            });
        }

        const inputData = {
            client_name: req.body.client_name,
            client_designation: req.body.client_designation || '',
            company_name: req.body.company_name,
            company_description: req.body.company_description || '',
            gtm_challenge: req.body.gtm_challenge,
            business_stage: req.body.business_stage || 'bootstrapped-pmf',
            industry: req.body.industry || '',
            current_team_size: req.body.current_team_size || '',
            budget_range: req.body.budget_range || '',
            specific_focus: req.body.specific_focus || '',
            confirm_new_consultation: true
        };

        console.log('Calling GTM Alpha Consultant actor with data:', inputData);

        // Use full apify-client for complete HTML output
        const run = await apifyClient.actor('wiDXIHsc6oqnpeER2').call(inputData, {
            timeout: 360,
            memory: 256
        });

        console.log('Actor run completed:', run.status);

        if (run.status === 'SUCCEEDED') {
            // Get the full dataset with HTML output
            const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
            
            if (items && items.length > 0) {
                const consultation = items[0];
                
                res.json({
                    success: true,
                    runId: run.id,
                    status: run.status,
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
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'No consultation data generated',
                    runId: run.id,
                    consoleUrl: `https://console.apify.com/view/runs/${run.id}`
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: `Actor run failed: ${run.status}`,
                error: run.statusMessage,
                runId: run.id,
                consoleUrl: `https://console.apify.com/view/runs/${run.id}`
            });
        }

    } catch (error) {
        console.error('Error in GTM consultation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Initialize server
async function startServer() {
    const apifyReady = await initializeApifyClient();
    
    app.listen(port, () => {
        console.log(`🚀 GTM Alpha Backend v9.0 running on port ${port}`);
        console.log(`✅ Apify client status: ${apifyReady ? 'ready' : 'failed'}`);
        console.log('🎯 Ready for GTM consultations with EPIC framework');
        console.log(`🌐 Health check: http://localhost:${port}/health`);
    });
}

startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

module.exports = app;
