import * as ff from '@google-cloud/functions-framework';
import { Request, Response } from 'express';
import { getGeminiClient } from '../shared/gemini-client';
import { handleCors, sendSuccess, sendError, createLogger, asyncHandler, checkRateLimit } from '../shared/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  context?: string;
}

/**
 * Chat with Gemini AI for supply chain assistance
 *
 * POST /chat
 * Body: { message: string, history?: ChatMessage[], context?: string }
 */
ff.http('chat', asyncHandler(async (req: Request, res: Response) => {
  const logger = createLogger(req);
  logger.info('Chat request received');

  // Handle CORS
  if (handleCors(req, res)) {
    return;
  }

  // Check rate limits
  if (!checkRateLimit(req, res)) {
    return;
  }

  // Validate HTTP method
  if (req.method !== 'POST') {
    logger.warn('Invalid HTTP method', { method: req.method });
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only POST method is allowed');
    return;
  }

  try {
    const { message, history = [], context = '' } = req.body as ChatRequest;

    if (!message || typeof message !== 'string') {
      sendError(res, 400, 'INVALID_MESSAGE', 'Message is required and must be a string');
      return;
    }

    logger.info('Processing chat message', { messageLength: message.length });

    const geminiClient = getGeminiClient();

    // Build conversation context
    const conversationHistory = history
      .slice(-10) // Keep last 10 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `You are VoiceOps AI, an intelligent supply chain assistant powered by Gemini 2.5 Flash. You help supply chain managers with:

- Real-time risk analysis and monitoring
- Scenario simulation and what-if analysis
- Alert prioritization and response recommendations
- Supply chain optimization strategies
- Data-driven decision support

Guidelines:
- Be concise and actionable (2-3 sentences when possible)
- Include specific data points and percentages when relevant
- Prioritize practical recommendations
- Use professional but friendly tone
- If asked about current data, provide realistic supply chain metrics

Current Context:
- You have access to real-time supply chain data
- You can analyze risks across Asia, Europe, North America, and South America
- You can simulate scenarios like port closures, supplier failures, demand surges
- You monitor alerts with priority levels: critical, high, medium, low

${context ? `Additional Context: ${context}` : ''}

${conversationHistory ? `Previous Conversation:\n${conversationHistory}\n` : ''}`;

    const response = await geminiClient.generateContent(
      message,
      systemPrompt,
      {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    );

    logger.info('Chat response generated', { responseLength: response.length });

    sendSuccess(res, {
      response,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Chat error', error);
    sendError(
      res,
      500,
      'CHAT_ERROR',
      'Failed to process chat message',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}));

/**
 * Get supply chain metrics summary
 *
 * GET /metrics
 */
ff.http('getMetrics', asyncHandler(async (req: Request, res: Response) => {
  const logger = createLogger(req);
  logger.info('Metrics request received');

  if (handleCors(req, res)) {
    return;
  }

  if (!checkRateLimit(req, res)) {
    return;
  }

  try {
    // Generate realistic metrics with some randomness for live feel
    const baseRisk = 45;
    const riskVariation = Math.random() * 20 - 10;

    const metrics = {
      overallRisk: {
        score: Math.round(baseRisk + riskVariation),
        level: baseRisk + riskVariation < 40 ? 'low' : baseRisk + riskVariation < 60 ? 'moderate' : baseRisk + riskVariation < 80 ? 'high' : 'critical',
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: Math.round(Math.random() * 5 * 10) / 10,
      },
      costEfficiency: {
        score: Math.round(85 + Math.random() * 10),
        trend: Math.random() > 0.4 ? 'up' : 'down',
        change: Math.round(Math.random() * 3 * 10) / 10,
      },
      sustainability: {
        score: Math.round(75 + Math.random() * 15),
        rating: 'Good',
        carbonFootprint: Math.round(1200 + Math.random() * 300),
      },
      chainIntegrity: {
        score: Math.round(92 + Math.random() * 6),
        nodesOnline: 47,
        totalNodes: 50,
      },
      alerts: {
        critical: Math.floor(Math.random() * 3),
        high: Math.floor(Math.random() * 5) + 1,
        medium: Math.floor(Math.random() * 8) + 2,
        low: Math.floor(Math.random() * 10) + 3,
      },
      responseTime: {
        average: Math.round(150 + Math.random() * 100),
        unit: 'ms',
      },
      timestamp: new Date().toISOString(),
    };

    sendSuccess(res, metrics);

  } catch (error) {
    logger.error('Metrics error', error);
    sendError(res, 500, 'METRICS_ERROR', 'Failed to fetch metrics');
  }
}));

/**
 * Get supply chain network nodes
 *
 * GET /network
 */
ff.http('getNetwork', asyncHandler(async (req: Request, res: Response) => {
  const logger = createLogger(req);
  logger.info('Network request received');

  if (handleCors(req, res)) {
    return;
  }

  if (!checkRateLimit(req, res)) {
    return;
  }

  try {
    // Generate network data with some variation for live feel
    const statuses: Array<'healthy' | 'warning' | 'critical'> = ['healthy', 'healthy', 'healthy', 'warning', 'critical'];
    const getRandomStatus = () => statuses[Math.floor(Math.random() * statuses.length)];

    const nodes = [
      {
        id: 'sup1',
        type: 'supplier',
        name: 'Raw Materials Asia',
        region: 'asia',
        status: Math.random() > 0.7 ? 'warning' : 'healthy',
        metrics: {
          inventory: Math.round(70 + Math.random() * 20),
          capacity: 1000,
          utilization: Math.round(75 + Math.random() * 20),
        }
      },
      {
        id: 'sup2',
        type: 'supplier',
        name: 'Components Europe',
        region: 'europe',
        status: 'healthy',
        metrics: {
          inventory: Math.round(85 + Math.random() * 10),
          capacity: 800,
          utilization: Math.round(60 + Math.random() * 25),
        }
      },
      {
        id: 'sup3',
        type: 'supplier',
        name: 'Electronics Taiwan',
        region: 'asia',
        status: getRandomStatus(),
        metrics: {
          inventory: Math.round(60 + Math.random() * 30),
          capacity: 1200,
          utilization: Math.round(80 + Math.random() * 15),
        }
      },
      {
        id: 'man1',
        type: 'manufacturer',
        name: 'Assembly Plant China',
        region: 'asia',
        status: Math.random() > 0.8 ? 'warning' : 'healthy',
        metrics: {
          utilization: Math.round(80 + Math.random() * 15),
          capacity: 500,
          output: Math.round(400 + Math.random() * 80),
        }
      },
      {
        id: 'man2',
        type: 'manufacturer',
        name: 'Assembly Plant Mexico',
        region: 'north_america',
        status: 'healthy',
        metrics: {
          utilization: Math.round(70 + Math.random() * 20),
          capacity: 400,
          output: Math.round(300 + Math.random() * 60),
        }
      },
      {
        id: 'war1',
        type: 'warehouse',
        name: 'Central Hub Singapore',
        region: 'asia',
        status: 'healthy',
        metrics: {
          inventory: Math.round(60 + Math.random() * 25),
          capacity: 2000,
          turnover: Math.round(12 + Math.random() * 5),
        }
      },
      {
        id: 'war2',
        type: 'warehouse',
        name: 'Regional Storage Rotterdam',
        region: 'europe',
        status: Math.random() > 0.6 ? 'warning' : 'healthy',
        metrics: {
          inventory: Math.round(40 + Math.random() * 40),
          capacity: 1500,
          turnover: Math.round(8 + Math.random() * 6),
        }
      },
      {
        id: 'war3',
        type: 'warehouse',
        name: 'Distribution Center LA',
        region: 'north_america',
        status: 'healthy',
        metrics: {
          inventory: Math.round(55 + Math.random() * 30),
          capacity: 1800,
          turnover: Math.round(15 + Math.random() * 5),
        }
      },
      {
        id: 'dis1',
        type: 'distributor',
        name: 'North America Logistics',
        region: 'north_america',
        status: 'healthy',
        metrics: {
          utilization: Math.round(65 + Math.random() * 25),
          deliveries: Math.round(150 + Math.random() * 50),
        }
      },
      {
        id: 'dis2',
        type: 'distributor',
        name: 'Europe Express',
        region: 'europe',
        status: Math.random() > 0.7 ? 'warning' : 'healthy',
        metrics: {
          utilization: Math.round(75 + Math.random() * 20),
          deliveries: Math.round(120 + Math.random() * 40),
        }
      },
      {
        id: 'ret1',
        type: 'retailer',
        name: 'Online Store Global',
        region: 'global',
        status: 'healthy',
        metrics: {
          inventory: Math.round(75 + Math.random() * 20),
          orders: Math.round(500 + Math.random() * 200),
        }
      },
      {
        id: 'ret2',
        type: 'retailer',
        name: 'Physical Stores NA',
        region: 'north_america',
        status: 'healthy',
        metrics: {
          inventory: Math.round(60 + Math.random() * 25),
          orders: Math.round(300 + Math.random() * 100),
        }
      },
    ];

    const linkStatuses: Array<'active' | 'delayed' | 'disrupted'> = ['active', 'active', 'active', 'delayed', 'disrupted'];
    const getRandomLinkStatus = () => linkStatuses[Math.floor(Math.random() * linkStatuses.length)];

    const links = [
      { source: 'sup1', target: 'man1', status: Math.random() > 0.7 ? 'delayed' : 'active', flow: Math.round(70 + Math.random() * 25) },
      { source: 'sup2', target: 'man1', status: 'active', flow: Math.round(80 + Math.random() * 15) },
      { source: 'sup3', target: 'man1', status: getRandomLinkStatus(), flow: Math.round(60 + Math.random() * 30) },
      { source: 'sup2', target: 'man2', status: 'active', flow: Math.round(75 + Math.random() * 20) },
      { source: 'man1', target: 'war1', status: 'active', flow: Math.round(85 + Math.random() * 10) },
      { source: 'man1', target: 'war2', status: Math.random() > 0.6 ? 'delayed' : 'active', flow: Math.round(50 + Math.random() * 30) },
      { source: 'man2', target: 'war3', status: 'active', flow: Math.round(80 + Math.random() * 15) },
      { source: 'war1', target: 'dis1', status: 'active', flow: Math.round(70 + Math.random() * 20) },
      { source: 'war1', target: 'dis2', status: Math.random() > 0.7 ? 'delayed' : 'active', flow: Math.round(55 + Math.random() * 25) },
      { source: 'war2', target: 'dis2', status: getRandomLinkStatus(), flow: Math.round(60 + Math.random() * 25) },
      { source: 'war3', target: 'dis1', status: 'active', flow: Math.round(75 + Math.random() * 20) },
      { source: 'dis1', target: 'ret1', status: 'active', flow: Math.round(80 + Math.random() * 15) },
      { source: 'dis1', target: 'ret2', status: 'active', flow: Math.round(70 + Math.random() * 20) },
      { source: 'dis2', target: 'ret1', status: Math.random() > 0.8 ? 'delayed' : 'active', flow: Math.round(65 + Math.random() * 25) },
    ];

    // Calculate summary stats
    const healthyNodes = nodes.filter(n => n.status === 'healthy').length;
    const warningNodes = nodes.filter(n => n.status === 'warning').length;
    const criticalNodes = nodes.filter(n => n.status === 'critical').length;

    const activeLinks = links.filter(l => l.status === 'active').length;
    const delayedLinks = links.filter(l => l.status === 'delayed').length;
    const disruptedLinks = links.filter(l => l.status === 'disrupted').length;

    sendSuccess(res, {
      nodes,
      links,
      summary: {
        totalNodes: nodes.length,
        healthyNodes,
        warningNodes,
        criticalNodes,
        totalLinks: links.length,
        activeLinks,
        delayedLinks,
        disruptedLinks,
        networkHealth: Math.round((healthyNodes / nodes.length) * 100),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Network error', error);
    sendError(res, 500, 'NETWORK_ERROR', 'Failed to fetch network data');
  }
}));
