// GTM Alpha Backend Service
// A Node.js Express server that properly executes GTM consultations via Apify

const express = require('express');
const cors = require('cors');
const { ApifyApi } = require('apify-client');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Apify client
const apifyClient = new ApifyApi({
    token: process.env.APIFY_API_TOKEN // Set this in your environment variables
});

// Middleware
app.use(cors({
    origin: ['https://shashwatgtm.github.io', 'http://localhost:3000', 'https://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'GTM Alpha Backend',
        timestamp: new Date().toISOString()
    });
});

// Main GTM consultation endpoint
app.post('/api/gtm-consultation', async (req, res) => {
    try {
        console.log('GTM consultation request received:', new Date().toISOString());
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        // Validate required fields according to Apify actor schema
        const requiredFields = ['client_name', 'company_name', 'gtm_challenge', 'business_stage'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                missingFields,
                message: 'Please provide all required fields for GTM consultation'
            });
        }

        // Prepare input data according to exact Apify actor schema
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
            confirm_new_consultation: req.body.confirm_new_consultation || true
        };

        console.log('Prepared input for Apify actor:', JSON.stringify(inputData, null, 2));

        // Call the GTM Alpha Consultant actor
        const actorId = 'shashghosh/gtm-alpha-consultant';
        
        console.log(`Starting actor: ${actorId}`);
        const run = await apifyClient.actor(actorId).call(inputData, {
            timeout: 300, // 5 minutes timeout
            memory: 256,
            build: 'latest'
        });

        console.log('Actor run completed:', run.id);
        console.log('Run status:', run.status);

        if (run.status === 'SUCCEEDED') {
            // Get the generated HTML report
            const keyValueStore = await apifyClient.keyValueStore(run.defaultKeyValueStoreId);
            let htmlReport = null;
            
            try {
                const reportRecord = await keyValueStore.getRecord('enhanced_consultation_report.html');
                htmlReport = reportRecord ? reportRecord.value : null;
            } catch (error) {
                console.log('No HTML report found, checking for other output formats');
            }

            // Get dataset results as fallback
            const dataset = await apifyClient.dataset(run.defaultDatasetId);
            const { items } = await dataset.listItems();

            const response = {
                success: true,
                runId: run.id,
                status: run.status,
                client_name: inputData.client_name,
                company_name: inputData.company_name,
                reportUrl: htmlReport ? `https://api.apify.com/v2/key-value-stores/${run.defaultKeyValueStoreId}/records/enhanced_consultation_report.html` : null,
                keyValueStoreId: run.defaultKeyValueStoreId,
                datasetId: run.defaultDatasetId,
                consoleUrl: `https://console.apify.com/view/runs/${run.id}`,
                timestamp: new Date().toISOString(),
                duration: run.stats?.durationMillis || 0,
                usage: run.usage || {},
                hasHtmlReport: !!htmlReport,
                datasetItems: items.length
            };

            console.log('GTM consultation completed successfully:', response);
            res.json(response);

        } else if (run.status === 'FAILED') {
            console.error('Actor run failed:', run.statusMessage);
            res.status(500).json({
                error: 'GTM consultation failed',
                runId: run.id,
                status: run.status,
                message: run.statusMessage,
                consoleUrl: `https://console.apify.com/view/runs/${run.id}`
            });

        } else {
            console.log('Actor run completed with status:', run.status);
            res.json({
                success: false,
                runId: run.id,
                status: run.status,
                message: run.statusMessage,
                consoleUrl: `https://console.apify.com/view/runs/${run.id}`
            });
        }

    } catch (error) {
        console.error('Error in GTM consultation:', error);
        
        // Handle specific Apify errors
        if (error.message && error.message.includes('UNDER_MAINTENANCE')) {
            return res.status(503).json({
                error: 'Service temporarily unavailable',
                message: 'The GTM Alpha Consultant is currently under maintenance. Please try again later.',
                code: 'UNDER_MAINTENANCE'
            });
        }

        if (error.message && error.message.includes('not found')) {
            return res.status(404).json({
                error: 'Actor not found',
                message: 'The GTM Alpha Consultant actor could not be found. Please contact support.',
                code: 'ACTOR_NOT_FOUND'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'An unexpected error occurred while processing your GTM consultation.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get consultation result endpoint
app.get('/api/consultation/:runId', async (req, res) => {
    try {
        const { runId } = req.params;
        
        console.log(`Fetching consultation result for run: ${runId}`);
        
        // Get run details
        const run = await apifyClient.run(runId).get();
        
        if (!run) {
            return res.status(404).json({
                error: 'Consultation not found',
                message: 'The specified consultation run could not be found.'
            });
        }

        // Get the HTML report if available
        let htmlReport = null;
        if (run.defaultKeyValueStoreId) {
            try {
                const keyValueStore = await apifyClient.keyValueStore(run.defaultKeyValueStoreId);
                const reportRecord = await keyValueStore.getRecord('enhanced_consultation_report.html');
                htmlReport = reportRecord ? reportRecord.value : null;
            } catch (error) {
                console.log('No HTML report found for run:', runId);
            }
        }

        const response = {
            runId: run.id,
            status: run.status,
            startedAt: run.startedAt,
            finishedAt: run.finishedAt,
            duration: run.stats?.durationMillis || 0,
            reportUrl: htmlReport ? `https://api.apify.com/v2/key-value-stores/${run.defaultKeyValueStoreId}/records/enhanced_consultation_report.html` : null,
            keyValueStoreId: run.defaultKeyValueStoreId,
            datasetId: run.defaultDatasetId,
            consoleUrl: `https://console.apify.com/view/runs/${run.id}`,
            hasHtmlReport: !!htmlReport
        };

        res.json(response);

    } catch (error) {
        console.error('Error fetching consultation result:', error);
        res.status(500).json({
            error: 'Error fetching consultation',
            message: 'Could not retrieve the consultation result.'
        });
    }
});

// List recent consultations endpoint
app.get('/api/consultations', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        console.log('Fetching recent consultations, limit:', limit);
        
        // Get recent runs for the GTM Alpha Consultant actor
        const runs = await apifyClient.actor('shashghosh/gtm-alpha-consultant').runs().list({
            limit,
            desc: true
        });

        const consultations = runs.items.map(run => ({
            runId: run.id,
            status: run.status,
            startedAt: run.startedAt,
            finishedAt: run.finishedAt,
            duration: run.stats?.durationMillis || 0,
            consoleUrl: `https://console.apify.com/view/runs/${run.id}`
        }));

        res.json({
            total: runs.total,
            consultations
        });

    } catch (error) {
        console.error('Error fetching consultations:', error);
        res.status(500).json({
            error: 'Error fetching consultations',
            message: 'Could not retrieve recent consultations.'
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred.'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist.'
    });
});

// Start server
app.listen(port, () => {
    console.log(`GTM Alpha Backend Service running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Verify Apify token is configured
    if (!process.env.APIFY_API_TOKEN) {
        console.warn('WARNING: APIFY_API_TOKEN not configured in environment variables');
    } else {
        console.log('Apify API token configured ✓');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;