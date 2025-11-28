/**
 * Ninja Toolkit - Express Backend Server
 * Handles Kage AI queries with SQLite WAL persistence
 *
 * Features:
 * - POST /api/kage endpoint for AI chat
 * - SQLite WAL mode for concurrent access
 * - Context tracking (module data, overrides)
 * - Anthropic Claude Opus 4.5 integration
 * - Performance monitoring (<100ms response target)
 * - Error handling with feudal-themed messages
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');
const { initDatabase, saveKageConfig, getKageConfig, getAllConfigs, deleteKageConfig } = require('./db-init');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Initialize Anthropic client
let anthropicClient = null;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (ANTHROPIC_API_KEY) {
  try {
    anthropicClient = new Anthropic({
      apiKey: ANTHROPIC_API_KEY
    });
    console.log('✓ Anthropic Claude Opus 4.5 client initialized');
  } catch (error) {
    console.error('Failed to initialize Anthropic client:', error.message);
  }
} else {
  console.warn('⚠️ ANTHROPIC_API_KEY not set - AI features will return fallback responses');
}

// Initialize SQLite database with WAL mode
try {
  initDatabase();
  console.log('✓ SQLite database initialized with WAL mode');
} catch (error) {
  console.error('Failed to initialize database:', error.message);
  process.exit(1);
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    anthropic: anthropicClient ? 'connected' : 'not configured',
    database: 'connected'
  };
  res.json(health);
});

/**
 * POST /api/kage - Main Kage AI query endpoint
 *
 * Request body:
 * {
 *   query: string,           // User's question/command
 *   context: {               // Optional context
 *     moduleData: object,    // Current module state
 *     activeModule: string,  // Active module name
 *     overrides: object      // User preferences/overrides
 *   },
 *   sessionId: string        // Session identifier
 * }
 *
 * Response:
 * {
 *   response: string,        // AI response
 *   feudalLabel: string,     // Feudal-themed label
 *   suggestions: array,      // Follow-up suggestions
 *   latency: number,         // Response time in ms
 *   metadata: object         // Additional metadata
 * }
 */
app.post('/api/kage', async (req, res) => {
  const startTime = Date.now();

  try {
    const { query, context = {}, sessionId = 'default' } = req.body;

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query is required and must be a non-empty string',
        feudalMessage: '📜 The scroll is empty. Speak your question, shinobi.'
      });
    }

    // Check query length
    if (query.length > 4000) {
      return res.status(400).json({
        error: 'Query too long (max 4000 characters)',
        feudalMessage: '📜 The scroll is too long. Be concise, warrior.'
      });
    }

    // Get saved config for this session if exists
    let savedConfig = null;
    try {
      savedConfig = getKageConfig(sessionId);
    } catch (error) {
      console.warn('Failed to retrieve saved config:', error.message);
    }

    // Merge context with saved config
    const mergedContext = {
      ...savedConfig?.config,
      ...context
    };

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(mergedContext);

    // Generate response
    let aiResponse = null;
    let feudalLabel = '';
    let suggestions = [];

    if (anthropicClient) {
      try {
        // Call Claude Opus 4.5 with extended thinking
        const message = await anthropicClient.messages.create({
          model: 'claude-opus-4-20250514',
          max_tokens: 2048,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: query
            }
          ]
        });

        // Extract response
        aiResponse = message.content[0].text;

        // Generate feudal label using extended thinking
        feudalLabel = await generateFeudalLabel(query, mergedContext);

        // Generate suggestions
        suggestions = generateSuggestions(query, mergedContext);

      } catch (error) {
        console.error('Anthropic API error:', error.message);
        // Fall back to pattern-based response
        aiResponse = generateFallbackResponse(query, mergedContext);
        feudalLabel = getFallbackFeudalLabel(query);
        suggestions = generateSuggestions(query, mergedContext);
      }
    } else {
      // No API key - use fallback
      aiResponse = generateFallbackResponse(query, mergedContext);
      feudalLabel = getFallbackFeudalLabel(query);
      suggestions = generateSuggestions(query, mergedContext);
    }

    // Save updated context to database
    try {
      saveKageConfig(sessionId, {
        ...mergedContext,
        lastQuery: query,
        lastResponse: aiResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to save config:', error.message);
    }

    // Calculate latency
    const latency = Date.now() - startTime;

    // Build response
    const response = {
      response: aiResponse,
      feudalLabel,
      suggestions,
      latency,
      metadata: {
        sessionId,
        timestamp: new Date().toISOString(),
        contextUsed: Object.keys(mergedContext).length > 0
      }
    };

    // Log performance
    if (latency > 5000) {
      console.warn(`⚠️ Slow Kage response: ${latency}ms`);
    } else {
      console.log(`✓ Kage response: ${latency}ms`);
    }

    res.json(response);

  } catch (error) {
    console.error('Kage endpoint error:', error);
    const latency = Date.now() - startTime;

    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      feudalMessage: '❌ The shadows have blocked your path. The sensei cannot respond.',
      latency
    });
  }
});

/**
 * GET /api/kage/configs - Get all saved configs
 */
app.get('/api/kage/configs', (req, res) => {
  try {
    const configs = getAllConfigs();
    res.json({
      configs,
      count: configs.length
    });
  } catch (error) {
    console.error('Failed to get configs:', error);
    res.status(500).json({
      error: 'Failed to retrieve configs',
      message: error.message
    });
  }
});

/**
 * GET /api/kage/config/:sessionId - Get specific config
 */
app.get('/api/kage/config/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const config = getKageConfig(sessionId);

    if (!config) {
      return res.status(404).json({
        error: 'Config not found',
        sessionId
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Failed to get config:', error);
    res.status(500).json({
      error: 'Failed to retrieve config',
      message: error.message
    });
  }
});

/**
 * DELETE /api/kage/config/:sessionId - Delete specific config
 */
app.delete('/api/kage/config/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const deleted = deleteKageConfig(sessionId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Config not found',
        sessionId
      });
    }

    res.json({
      success: true,
      sessionId,
      message: 'Config deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete config:', error);
    res.status(500).json({
      error: 'Failed to delete config',
      message: error.message
    });
  }
});

/**
 * Build system prompt with context
 */
function buildSystemPrompt(context) {
  let prompt = `You are Kage, the AI sensei of the Ninja Toolkit - a feudal Japan-themed cybersecurity and IT management platform.

Your personality:
- Speak with wisdom and authority, like a master ninja instructor
- Use feudal Japan metaphors when explaining technical concepts
- Be concise but informative
- Guide users toward best practices
- Never execute dangerous commands without warning

`;

  if (context.activeModule) {
    prompt += `Current module: ${context.activeModule}\n`;
  }

  if (context.moduleData) {
    prompt += `Module context: ${JSON.stringify(context.moduleData, null, 2)}\n`;
  }

  if (context.overrides) {
    prompt += `User preferences: ${JSON.stringify(context.overrides, null, 2)}\n`;
  }

  return prompt;
}

/**
 * Generate feudal-themed label using extended thinking
 */
async function generateFeudalLabel(query, context) {
  if (!anthropicClient) {
    return getFallbackFeudalLabel(query);
  }

  try {
    const message = await anthropicClient.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 100,
      temperature: 0.9,
      messages: [
        {
          role: 'user',
          content: `Generate a short (5-7 words) feudal Japan-themed haiku-style label for this query: "${query}"\n\nExamples:\n- "Storm the cloud gates" (for Azure queries)\n- "Sharpen the blade" (for security)\n- "Scout the battlefield" (for network mapping)\n\nReturn ONLY the label, nothing else.`
        }
      ]
    });

    return message.content[0].text.trim();
  } catch (error) {
    console.warn('Failed to generate feudal label:', error.message);
    return getFallbackFeudalLabel(query);
  }
}

/**
 * Get fallback feudal label based on patterns
 */
function getFallbackFeudalLabel(query) {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('azure') || lowerQuery.includes('cloud')) {
    return '⛩️ Storm the cloud gates';
  } else if (lowerQuery.includes('security') || lowerQuery.includes('vulnerability')) {
    return '⚔️ Sharpen the blade';
  } else if (lowerQuery.includes('network') || lowerQuery.includes('scan')) {
    return '🗺️ Scout the battlefield';
  } else if (lowerQuery.includes('error') || lowerQuery.includes('fix')) {
    return '🛠️ Repair the armor';
  } else if (lowerQuery.includes('powershell') || lowerQuery.includes('script')) {
    return '📜 Consult the scrolls';
  } else {
    return '🥷 Seek the sensei wisdom';
  }
}

/**
 * Generate fallback response using pattern matching
 */
function generateFallbackResponse(query, context) {
  const lowerQuery = query.toLowerCase();

  // Azure queries
  if (lowerQuery.includes('azure')) {
    return `To work with Azure resources, ensure you're authenticated with Connect-AzAccount. The Azure module in BladeNav provides tools for VM management, storage analysis, and cost monitoring. What specific Azure task do you need help with?`;
  }

  // Security queries
  if (lowerQuery.includes('security') || lowerQuery.includes('vulnerability')) {
    return `The Security module offers comprehensive auditing tools. I recommend starting with Get-SecurityAudit.ps1 to identify vulnerabilities, then using Check-PatchStatus.ps1 to verify update compliance. Would you like guidance on a specific security concern?`;
  }

  // Network queries
  if (lowerQuery.includes('network') || lowerQuery.includes('scan')) {
    return `The Network Mapping module can help you visualize your infrastructure. Use Test-NetworkConnectivity.ps1 for quick diagnostics, or launch a full topology scan for comprehensive mapping. What network information are you seeking?`;
  }

  // PowerShell queries
  if (lowerQuery.includes('powershell') || lowerQuery.includes('script')) {
    return `The PowerShell Terminal module contains 60+ curated scripts organized by category (Azure, M365, AD, Security, Network, Maintenance). Use the Script Library's fuzzy search to find what you need, or describe your task and I'll recommend specific scripts.`;
  }

  // Default
  return `I am Kage, your AI sensei. I can assist with:\n\n- Azure/M365 administration\n- PowerShell script guidance\n- Security assessments\n- Network mapping\n- Module navigation\n\nWhat guidance do you seek, shinobi?`;
}

/**
 * Generate follow-up suggestions
 */
function generateSuggestions(query, context) {
  const lowerQuery = query.toLowerCase();
  const suggestions = [];

  if (lowerQuery.includes('azure')) {
    suggestions.push('Show me Azure VM status');
    suggestions.push('Analyze Azure costs');
    suggestions.push('List storage accounts');
  } else if (lowerQuery.includes('security')) {
    suggestions.push('Run security audit');
    suggestions.push('Check patch compliance');
    suggestions.push('Review firewall rules');
  } else if (lowerQuery.includes('network')) {
    suggestions.push('Scan local network');
    suggestions.push('Test port connectivity');
    suggestions.push('Get DNS information');
  } else {
    suggestions.push('Show available modules');
    suggestions.push('Help with PowerShell');
    suggestions.push('Security best practices');
  }

  return suggestions.slice(0, 3); // Return max 3 suggestions
}

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    feudalMessage: '🗺️ This path leads to shadows. Return to the known routes.'
  });
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    feudalMessage: '❌ The fortress has encountered an error. Seek the master for guidance.'
  });
});

/**
 * Start server
 */
function startServer() {
  app.listen(PORT, () => {
    console.log(`\n🥷 Ninja Toolkit Backend Server`);
    console.log(`✓ Express server listening on port ${PORT}`);
    console.log(`✓ Endpoints:`);
    console.log(`  - POST /api/kage (AI queries)`);
    console.log(`  - GET /api/kage/configs (list all configs)`);
    console.log(`  - GET /api/kage/config/:sessionId (get specific config)`);
    console.log(`  - DELETE /api/kage/config/:sessionId (delete config)`);
    console.log(`  - GET /api/health (health check)`);
    console.log(`\n⚡ Ready for Kage queries\n`);
  });
}

// Start server if not in test mode
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
