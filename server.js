const express = require('express');
const cors = require('cors');
const ApifyApi = require('apify-client');  // ✅ CORRECT: No destructuring

const app = express();
const port = process.env.PORT || 3000;

// Initialize Apify client
const apifyClient = new ApifyApi({
    token: process.env.APIFY_API_TOKEN,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        platform: 'Railway',
        actor: 'wiDXIHsc6oqnpeER2'
    });
});

// Main consultation endpoint
app.post('/api/gtm-consultation', async (req, res) => {
    try {
        console.log('📨 GTM consultation request on Railway');
        
        // Validate required fields
        if (!req.body.client_name || !req.body.company_name || !req.body.gtm_challenge || !req.body.business_stage) {
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
            business_stage: req.body.business_stage,
            industry: req.body.industry || '',
            current_team_size: req.body.current_team_size || '',
            budget_range: req.body.budget_range || '',
            specific_focus: req.body.specific_focus || '',
            confirm_new_consultation: true
        };

        console.log('🚀 Calling YOUR actor: wiDXIHsc6oqnpeER2');

        // Call YOUR GTM Alpha Consultant actor
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
                    consultation_id: consultation.consultation_id,
                    report_url: consultation.report_url,
                    primary_focus: consultation.primary_epic_focus,
                    epic_scores: consultation.epic_scores,
                    consultation_output: consultation.consultation_output,
                    timestamp: consultation.timestamp
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
        console.error('💥 Railway backend error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 GTM Alpha Backend on Railway - Port ${port}`);
    console.log(`🎯 Actor: wiDXIHsc6oqnpeER2`);
    if (!process.env.APIFY_API_TOKEN) {
        console.warn('⚠️ APIFY_API_TOKEN not set in Railway!');
    }
});

module.exports = app;
