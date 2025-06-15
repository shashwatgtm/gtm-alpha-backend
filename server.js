const express = require('express');
const cors = require('cors');

// CORRECT IMPORT: It's ApifyClient, not ApifyApi!
const { ApifyClient } = require('apify-client');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Apify client with the CORRECT class name
const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN || 'apify_api_DFgcaQdaxQGQVd2mB6jz7q7GIiJQ1w2jUfb3',
});

console.log('✅ Apify client initialized successfully with ApifyClient');

app.use(cors({
    origin: ['https://shashwatgtm.github.io', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '10.0-correct-import',
        hasToken: !!(process.env.APIFY_API_TOKEN || 'fallback'),
        apifyClientReady: true,
        importUsed: 'ApifyClient (CORRECT)'
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'GTM Alpha Backend v10.0 - CORRECT ApifyClient Import',
        status: 'running',
        apifyClientStatus: 'initialized correctly'
    });
});

app.post('/api/gtm-consultation', async (req, res) => {
    try {
        console.log('🚀 GTM consultation request received');
        
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

        console.log('📝 Calling GTM Alpha Consultant actor wiDXIHsc6oqnpeER2');
        console.log('🎯 Input data:', JSON.stringify(inputData, null, 2));

        // Call the actor - this should work now with correct ApifyClient
        const run = await apifyClient.actor('wiDXIHsc6oqnpeER2').call(inputData, {
            timeout: 360,
            memory: 256
        });

        console.log('✅ Actor run completed with status:', run.status);
        console.log('🔗 Run ID:', run.id);

        if (run.status === 'SUCCEEDED') {
            // Get the dataset results
            const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
            
            console.log(`📊 Dataset contains ${items.length} items`);
            
            if (items && items.length > 0) {
                const consultation = items[0];
                console.log('📋 Consultation data retrieved successfully');
                
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
                console.warn('⚠️ No consultation data in dataset');
                res.status(500).json({
                    success: false,
                    message: 'No consultation data generated',
                    runId: run.id,
                    consoleUrl: `https://console.apify.com/view/runs/${run.id}`
                });
            }
        } else {
            console.error('❌ Actor run failed with status:', run.status);
            res.status(500).json({
                success: false,
                message: `Actor run failed: ${run.status}`,
                error: run.statusMessage,
                runId: run.id,
                consoleUrl: `https://console.apify.com/view/runs/${run.id}`
            });
        }

    } catch (error) {
        console.error('💥 Error in GTM consultation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 GTM Alpha Backend v10.0 running on port ${port}`);
    console.log('✅ ApifyClient initialized correctly (not ApifyApi!)');
    console.log('🎯 Ready for GTM consultations with EPIC framework');
    console.log(`🌐 Health check: http://localhost:${port}/health`);
});

module.exports = app;
