const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Simple, direct import that should work
let apifyClient;
try {
    // Try the most common working pattern first
    const apifyClientConstructor = require('apify-client');
    apifyClient = new apifyClientConstructor({
        token: process.env.APIFY_API_TOKEN || 'apify_api_DFgcaQdaxQGQVd2mB6jz7q7GIiJQ1w2jUfb3',
    });
    console.log('✅ Apify client initialized with direct constructor');
} catch (error) {
    console.log('❌ Direct constructor failed, trying alternatives:', error.message);
    try {
        // Try named import
        const { ApifyApi } = require('apify-client');
        apifyClient = new ApifyApi({
            token: process.env.APIFY_API_TOKEN || 'apify_api_DFgcaQdaxQGQVd2mB6jz7q7GIiJQ1w2jUfb3',
        });
        console.log('✅ Apify client initialized with named import');
    } catch (error2) {
        console.log('❌ Named import failed, trying default:', error2.message);
        try {
            // Try default import
            const apifyModule = require('apify-client');
            const ApifyApi = apifyModule.default || apifyModule;
            apifyClient = new ApifyApi({
                token: process.env.APIFY_API_TOKEN || 'apify_api_DFgcaQdaxQGQVd2mB6jz7q7GIiJQ1w2jUfb3',
            });
            console.log('✅ Apify client initialized with default import');
        } catch (error3) {
            console.error('❌ All import methods failed:', error3.message);
            apifyClient = null;
        }
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
        version: '9.1-simple-fix',
        hasToken: !!(process.env.APIFY_API_TOKEN || 'fallback'),
        apifyClientReady: !!apifyClient
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'GTM Alpha Backend v9.1 - Simple Import Fix',
        status: 'running',
        apifyClientStatus: apifyClient ? 'initialized' : 'failed to initialize'
    });
});

app.post('/api/gtm-consultation', async (req, res) => {
    try {
        console.log('GTM consultation request received');
        
        if (!apifyClient) {
            console.error('Apify client not available - cannot process consultation');
            return res.status(500).json({
                success: false,
                message: 'Apify service unavailable - server configuration issue',
                error: 'Apify client failed to initialize'
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

        console.log('🚀 Calling GTM Alpha Consultant actor wiDXIHsc6oqnpeER2');
        console.log('📝 Input data:', JSON.stringify(inputData, null, 2));

        // Call the actor
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
    console.log(`🚀 GTM Alpha Backend v9.1 running on port ${port}`);
    console.log(`✅ Apify client status: ${apifyClient ? 'ready' : 'failed'}`);
    if (!apifyClient) {
        console.error('⚠️  WARNING: Apify client failed to initialize - consultations will not work');
    }
    console.log('🎯 Ready for GTM consultations with EPIC framework');
    console.log(`🌐 Health check: http://localhost:${port}/health`);
});

module.exports = app;
