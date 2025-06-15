// GTM Alpha Backend Service
// Node.js Express server for GTM Alpha Consultation

const express = require('express');
const cors = require('cors');
const ApifyApi = require('apify-client');  // ✅ CORRECT IMPORT
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Apify client
const apifyClient = new ApifyApi({
    token: process.env.APIFY_API_TOKEN,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'GTM Alpha Backend',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'GTM Alpha Backend Service',
        status: 'running',
        endpoints: {
            health: '/health',
            consultation: 'POST /api/gtm-consultation',
            actorStatus: '/api/actor-status',
            recentRuns: '/api/recent-runs'
        }
    });
});

// Main GTM consultation endpoint
app.post('/api/gtm-consultation', async (req, res) => {
    try {
        console.log('📨 Received GTM consultation request');
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        // Validate required fields
        const requiredFields = ['client_name', 'company_name', 'gtm_challenge', 'business_stage'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            console.log('❌ Missing required fields:', missingFields);
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields
            });
        }

        // Prepare input data for Apify actor
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

        console.log('🔄 Calling Apify actor: shashghosh/gtm-alpha-consultant');
        console.log('Input data:', JSON.stringify(inputData, null, 2));

        // Call the GTM Alpha Consultant actor
        const run = await apifyClient.actor('shashghosh/gtm-alpha-consultant').call(inputData, {
            timeout: 600, // 10 minutes timeout
            memory: 256,
            build: 'latest'
        });

        console.log('✅ Apify actor run completed:', {
            id: run.id,
            status: run.status,
            startedAt: run.startedAt,
            finishedAt: run.finishedAt
        });

        // Handle different run statuses
        if (run.status === 'SUCCEEDED') {
            // Get the results from the dataset
            const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
            console.log('📊 Dataset items retrieved:', items.length);

            if (items && items.length > 0) {
                const consultation = items[0];
                
                res.json({
                    success: true,
                    consultation_id: consultation.consultation_id,
                    report_url: consultation.report_url,
                    primary_focus: consultation.primary_epic_focus,
                    epic_scores: consultation.epic_scores,
                    consultation_output: consultation.consultation_output,
                    timestamp: consultation.timestamp,
                    runId: run.id,
                    consoleUrl: `https://console.apify.com/actors/runs/${run.id}`
                });
            } else {
                console.log('⚠️ No data in dataset');
                res.status(500).json({
                    success: false,
                    message: 'No consultation data generated',
                    runId: run.id,
                    consoleUrl: `https://console.apify.com/actors/runs/${run.id}`
                });
            }

        } else if (run.status === 'FAILED') {
            console.error('❌ Actor run failed:', run.statusMessage);
            res.status(500).json({
                success: false,
                message: 'GTM consultation failed',
                error: run.statusMessage,
                runId: run.id,
                consoleUrl: `https://console.apify.com/actors/runs/${run.id}`
            });

        } else if (run.status === 'TIMED-OUT') {
            console.error('⏰ Actor run timed out');
            res.status(500).json({
                success: false,
                message: 'GTM consultation timed out',
                runId: run.id,
                consoleUrl: `https://console.apify.com/actors/runs/${run.id}`
            });

        } else {
            console.log('ℹ️ Actor run completed with status:', run.status);
            res.status(500).json({
                success: false,
                message: `GTM consultation completed with unexpected status: ${run.status}`,
                status: run.status,
                runId: run.id,
                consoleUrl: `https://console.apify.com/actors/runs/${run.id}`
            });
        }

    } catch (error) {
        console.error('💥 Error during GTM consultation:', error);

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
                message: 'GTM Alpha Consultant is currently under maintenance. Please try again later.',
                error: 'UNDER_MAINTENANCE'
            });
        } else if (error.message && error.message.includes('Unauthorized')) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized access to Apify. Please check API token configuration.',
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

// Check actor status endpoint
app.get('/api/actor-status', async (req, res) => {
    try {
        console.log('🔍 Checking GTM Alpha Consultant actor status');
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
                stats: actor.stats
            }
        });

    } catch (error) {
        console.error('❌ Error checking actor status:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking actor status',
            error: error.message
        });
    }
});

// List recent runs endpoint
app.get('/api/recent-runs', async (req, res) => {
    try {
        console.log('📋 Fetching recent runs of GTM Alpha Consultant');
        const runs = await apifyClient.actor('shashghosh/gtm-alpha-consultant').runs().list({
            limit: 10,
            desc: true
        });

        res.json({
            success: true,
            total: runs.total,
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
        console.error('❌ Error fetching recent runs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent runs',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('💥 Unhandled error:', error);
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
    
    // Check if Apify token is configured
    if (!process.env.APIFY_API_TOKEN) {
        console.warn('⚠️  WARNING: APIFY_API_TOKEN environment variable is not set!');
        console.warn('⚠️  Please set your Apify API token in Railway environment variables');
    } else {
        console.log('✅ Apify API token configured');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
