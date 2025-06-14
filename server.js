// GTM Alpha Backend Service
// A Node.js Express server that properly executes GTM consultations via Apify

const express = require('express');
const cors = require('cors');
const ApifyApi = require('apify-client');
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

        // Prepare input data exactly matching the Apify actor schema
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
            confirm_new_consultation: req.body.confirm_new_consultation || false
        };

        console.log('Prepared input data for Apify actor:', JSON.stringify(inputData, null, 2));

        // Call the Apify actor
        console.log('Calling Apify actor: shashghosh/gtm-alpha-consultant');
        const run = await apifyClient.actor('shashghosh/gtm-alpha-consultant').call(inputData, {
            memory: 256,
            timeout: 600 // 10 minutes timeout
        });

        console.log('Apify actor run completed:', {
            id: run.id,
            status: run.status,
            startedAt: run.startedAt,
            finishedAt: run.finishedAt
        });

        // Check run status
        if (run.status === 'SUCCEEDED') {
            // Get the results from the dataset
            const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
            console.log('Dataset items retrieved:', items.length);

            // Try to get additional output from key-value store
            let additionalData = null;
            try {
                const outputRecord = await apifyClient.keyValueStore(run.defaultKeyValueStoreId).getRecord('OUTPUT');
                if (outputRecord) {
                    additionalData = outputRecord.value;
                    console.log('Additional output retrieved from key-value store');
                }
            } catch (kvError) {
                console.log('No additional output in key-value store:', kvError.message);
            }

            // Calculate duration
            const duration = run.finishedAt ? 
                new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime() : 
                null;

            // Prepare success response
            const response = {
                success: true,
                message: 'GTM consultation completed successfully',
                data: {
                    runId: run.id,
                    status: run.status,
                    startedAt: run.startedAt,
                    finishedAt: run.finishedAt,
                    duration: duration,
                    results: items.length > 0 ? items[0] : null,
                    additionalData: additionalData,
                    consoleUrl: `https://console.apify.com/actors/runs/${run.id}`,
                    datasetUrl: `https://console.apify.com/storage/datasets/${run.defaultDatasetId}`,
                    keyValueStoreUrl: `https://console.apify.com/storage/key-value-stores/${run.defaultKeyValueStoreId}`
                }
            };

            console.log('Sending success response');
            res.json(response);

        } else if (run.status === 'FAILED') {
            console.error('Apify actor run failed:', run.statusMessage);
            res.status(500).json({
                success: false,
                message: 'GTM consultation failed',
                error: {
                    runId: run.id,
                    status: run.status,
                    statusMessage: run.statusMessage,
                    consoleUrl: `https://console.apify.com/actors/runs/${run.id}`
                }
            });

        } else if (run.status === 'ABORTED') {
            console.error('Apify actor run was aborted:', run.statusMessage);
            res.status(500).json({
                success: false,
                message: 'GTM consultation was aborted',
                error: {
                    runId: run.id,
                    status: run.status,
                    statusMessage: run.statusMessage,
                    consoleUrl: `https://console.apify.com/actors/runs/${run.id}`
                }
            });

        } else if (run.status === 'TIMED-OUT') {
            console.error('Apify actor run timed out:', run.statusMessage);
            res.status(500).json({
                success: false,
                message: 'GTM consultation timed out',
                error: {
                    runId: run.id,
                    status: run.status,
                    statusMessage: run.statusMessage,
                    consoleUrl: `https://console.apify.com/actors/runs/${run.id}`
                }
            });

        } else {
            console.error('Apify actor run in unexpected state:', run.status);
            res.status(500).json({
                success: false,
                message: 'GTM consultation completed with unexpected status',
                error: {
                    runId: run.id,
                    status: run.status,
                    statusMessage: run.statusMessage,
                    consoleUrl: `https://console.apify.com/actors/runs/${run.id}`
                }
            });
        }

    } catch (error) {
        console.error('Error during GTM consultation:', error);
        
        // Handle specific error types
        if (error.message && error.message.includes('Actor not found')) {
            res.status(404).json({
                success: false,
                message: 'GTM Alpha Consultant actor not found',
                error: error.message
            });
        } else if (error.message && error.message.includes('UNDER_MAINTENANCE')) {
            res.status(503).json({
                success: false,
                message: 'GTM Alpha Consultant is currently under maintenance',
                error: 'UNDER_MAINTENANCE'
            });
        } else if (error.message && error.message.includes('Unauthorized')) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized access to Apify. Check API token.',
                error: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Internal server error during GTM consultation',
                error: error.message
            });
        }
    }
});

// Endpoint to check specific actor status
app.get('/api/actor-status', async (req, res) => {
    try {
        console.log('Checking GTM Alpha Consultant actor status');
        const actor = await apifyClient.actor('shashghosh/gtm-alpha-consultant').get();
        
        res.json({
            success: true,
            actor: {
                id: actor.id,
                name: actor.name,
                username: actor.username,
                description: actor.description,
                isPublic: actor.isPublic,
                createdAt: actor.createdAt,
                modifiedAt: actor.modifiedAt,
                stats: actor.stats,
                taggedBuilds: actor.taggedBuilds
            }
        });
    } catch (error) {
        console.error('Error checking actor status:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking actor status',
            error: error.message
        });
    }
});

// Endpoint to list recent runs of the GTM Alpha Consultant
app.get('/api/recent-runs', async (req, res) => {
    try {
        console.log('Fetching recent runs of GTM Alpha Consultant');
        const runs = await apifyClient.actor('shashghosh/gtm-alpha-consultant').runs().list({
            limit: 10,
            desc: true
        });
        
        res.json({
            success: true,
            runs: runs.items.map(run => ({
                id: run.id,
                status: run.status,
                startedAt: run.startedAt,
                finishedAt: run.finishedAt,
                statusMessage: run.statusMessage,
                consoleUrl: `https://console.apify.com/actors/runs/${run.id}`
            }))
        });
    } catch (error) {
        console.error('Error fetching recent runs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent runs',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        availableEndpoints: [
            'GET /health - Health check',
            'POST /api/gtm-consultation - GTM consultation',
            'GET /api/actor-status - Check actor status',
            'GET /api/recent-runs - List recent runs'
        ]
    });
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 GTM Alpha Backend Server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🎯 GTM consultation: POST http://localhost:${port}/api/gtm-consultation`);
    console.log(`📈 Actor status: GET http://localhost:${port}/api/actor-status`);
    console.log(`📋 Recent runs: GET http://localhost:${port}/api/recent-runs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 Apify token configured: ${process.env.APIFY_API_TOKEN ? 'Yes' : 'No'}`);
    
    if (!process.env.APIFY_API_TOKEN) {
        console.warn('⚠️  WARNING: APIFY_API_TOKEN environment variable is not set!');
    }
});