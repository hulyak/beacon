"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_framework_1 = require("@google-cloud/functions-framework");

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Supply chain network data
const networkNodes = [
  { id: 'sup-1', type: 'supplier', name: 'Shanghai Electronics Co.', region: 'Asia', status: 'healthy', metrics: { inventory: 85, capacity: 10000 } },
  { id: 'sup-2', type: 'supplier', name: 'Shenzhen Components Ltd.', region: 'Asia', status: 'warning', metrics: { inventory: 62, capacity: 8000 } },
  { id: 'sup-3', type: 'supplier', name: 'Taiwan Semiconductor', region: 'Asia', status: 'healthy', metrics: { inventory: 91, capacity: 15000 } },
  { id: 'mfg-1', type: 'manufacturer', name: 'Guangzhou Assembly Plant', region: 'Asia', status: 'healthy', metrics: { utilization: 78, output: 5000 } },
  { id: 'mfg-2', type: 'manufacturer', name: 'Vietnam Production Hub', region: 'Asia', status: 'healthy', metrics: { utilization: 82, output: 4200 } },
  { id: 'wh-1', type: 'warehouse', name: 'Hong Kong Distribution', region: 'Asia', status: 'healthy', metrics: { inventory: 88, turnover: 4.2 } },
  { id: 'wh-2', type: 'warehouse', name: 'Rotterdam Logistics Hub', region: 'Europe', status: 'warning', metrics: { inventory: 71, turnover: 3.8 } },
  { id: 'wh-3', type: 'warehouse', name: 'Los Angeles Warehouse', region: 'North America', status: 'healthy', metrics: { inventory: 79, turnover: 5.1 } },
  { id: 'dist-1', type: 'distributor', name: 'EU Distribution Network', region: 'Europe', status: 'healthy', metrics: { deliveries: 1200, orders: 1150 } },
  { id: 'dist-2', type: 'distributor', name: 'US East Coast Logistics', region: 'North America', status: 'healthy', metrics: { deliveries: 980, orders: 920 } },
  { id: 'dist-3', type: 'distributor', name: 'LATAM Distribution', region: 'South America', status: 'critical', metrics: { deliveries: 340, orders: 480 } },
  { id: 'ret-1', type: 'retailer', name: 'Amazon Fulfillment', region: 'North America', status: 'healthy', metrics: { orders: 15000 } },
  { id: 'ret-2', type: 'retailer', name: 'European Retail Partners', region: 'Europe', status: 'healthy', metrics: { orders: 8500 } },
];

const networkLinks = [
  { source: 'sup-1', target: 'mfg-1', status: 'active', flow: 450 },
  { source: 'sup-2', target: 'mfg-1', status: 'delayed', flow: 280 },
  { source: 'sup-3', target: 'mfg-2', status: 'active', flow: 520 },
  { source: 'mfg-1', target: 'wh-1', status: 'active', flow: 380 },
  { source: 'mfg-2', target: 'wh-1', status: 'active', flow: 340 },
  { source: 'wh-1', target: 'wh-2', status: 'delayed', flow: 220 },
  { source: 'wh-1', target: 'wh-3', status: 'active', flow: 310 },
  { source: 'wh-2', target: 'dist-1', status: 'active', flow: 180 },
  { source: 'wh-3', target: 'dist-2', status: 'active', flow: 250 },
  { source: 'wh-3', target: 'dist-3', status: 'disrupted', flow: 90 },
  { source: 'dist-1', target: 'ret-2', status: 'active', flow: 150 },
  { source: 'dist-2', target: 'ret-1', status: 'active', flow: 200 },
];

/**
 * Get supply chain network data
 */
(0, functions_framework_1.http)('getNetwork', async (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.set(key, value);
  });

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Calculate summary statistics
    const healthyNodes = networkNodes.filter(n => n.status === 'healthy').length;
    const warningNodes = networkNodes.filter(n => n.status === 'warning').length;
    const criticalNodes = networkNodes.filter(n => n.status === 'critical').length;
    const activeLinks = networkLinks.filter(l => l.status === 'active').length;
    const delayedLinks = networkLinks.filter(l => l.status === 'delayed').length;
    const disruptedLinks = networkLinks.filter(l => l.status === 'disrupted').length;

    const response = {
      success: true,
      data: {
        nodes: networkNodes,
        links: networkLinks,
        summary: {
          totalNodes: networkNodes.length,
          healthyNodes,
          warningNodes,
          criticalNodes,
          totalLinks: networkLinks.length,
          activeLinks,
          delayedLinks,
          disruptedLinks,
          networkHealth: Math.round((healthyNodes / networkNodes.length) * 100),
        },
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching network data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch network data',
      },
    });
  }
});
