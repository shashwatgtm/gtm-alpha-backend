const express = require('express');
const cors = require('cors');

// RAILWAY FIX: Use destructuring import for Node.js v22.11.0
const { ApifyApi } = require('apify-client');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Apify client - this should work with destructuring
const apifyClient = new ApifyApi({
    token: process.env.APIFY_API_TOKEN || 'apify_api_DFgcaQdaxQGQVd2mB6jz7q7GIiJQ1w2jUfb3',
});

app.use(cors({
    origin: ['https://shashwatgtm.github.io', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '8.8-destructuring-fix',
        hasToken: !!(process.env.APIFY_API_TOKEN || 'fallback')
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'GTM Alpha Backend v8.8 - Destructuring Fix',
        status: 'running'
    });
});

app.post('/api/gtm-consultation', async (req, res) => {
    try {
        console.log('GTM consultation request received');
        
        if (!req.body.client_name || !req.body.company_name || !req.body.gtm_challenge) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
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

        console.log('Calling actor wiDXIHsc6oqnpeER2 with full apify-client');

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
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 GTM Alpha Backend v8.8 running on port ${port}`);
    console.log('✅ Full apify-client integration with destructuring import');
    console.log('🎯 Ready for GTM consultations with EPIC framework');
});

module.exports = app;
