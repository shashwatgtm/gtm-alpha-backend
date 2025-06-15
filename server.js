const express = require('express');
const cors = require('cors');
// FIXED: Use default import without destructuring
const ApifyApi = require('apify-client').default || require('apify-client');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Apify client with WORKING constructor
const apifyClient = new ApifyApi({
    token: process.env.APIFY_API_TOKEN || 'apify_api_DFgcaQdaxQGQVd2mB6jz7q7GIiJQ1w2jUfb3',
});

app.use(cors({
    origin: ['https://shashwatgtm.github.io', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '8.2-fixed',
        hasToken: !!(process.env.APIFY_API_TOKEN || 'fallback')
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'GTM Alpha Backend v8.2 - ApifyApi FIXED',
        status: 'running'
    });
});

// GTM consultation endpoint
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

        console.log('Calling actor wiDXIHsc6oqnpeER2');

        const run = await apifyClient.actor('wiDXIHsc6oqnpeER2').call(inputData, {
            timeout: 360,
            memory: 256
        });

        if (run.status === 'SUCCEEDED') {
            const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
            
            if (items && items.length > 0) {
                const consultation = items[0];
                res.json({
                    success: true,
                    runId: run.id,
                    data: consultation,
                    consoleUrl: `https://console.apify.com/view/runs/${run.id}`
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'No consultation data generated'
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: `Actor run failed: ${run.status}`,
                error: run.statusMessage
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
    console.log(`GTM Alpha Backend v8.2 running on port ${port}`);
    console.log('ApifyApi constructor FIXED');
});

module.exports = app;