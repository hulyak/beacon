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

/**
 * Get real-time KPI metrics
 */
(0, functions_framework_1.http)('getMetrics', async (req, res) => {
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
    // Generate realistic metrics with small variations
    const baseRisk = 42;
    const riskVariation = Math.floor(Math.random() * 10) - 5;
    const riskScore = Math.max(15, Math.min(85, baseRisk + riskVariation));

    const getRiskLevel = (score) => {
      if (score < 30) return 'low';
      if (score < 50) return 'moderate';
      if (score < 70) return 'high';
      return 'critical';
    };

    const baseCostEfficiency = 87.5;
    const costVariation = (Math.random() * 4) - 2;
    const costEfficiency = Math.max(75, Math.min(98, baseCostEfficiency + costVariation));

    const baseSustainability = 78;
    const sustainVariation = Math.floor(Math.random() * 6) - 3;
    const sustainability = Math.max(60, Math.min(95, baseSustainability + sustainVariation));

    const getSustainabilityRating = (score) => {
      if (score >= 85) return 'Excellent';
      if (score >= 70) return 'Good';
      if (score >= 55) return 'Fair';
      return 'Poor';
    };

    const response = {
      success: true,
      data: {
        overallRisk: {
          score: riskScore,
          level: getRiskLevel(riskScore),
          trend: riskVariation > 0 ? 'up' : 'down',
          change: Math.abs(riskVariation),
        },
        costEfficiency: {
          score: parseFloat(costEfficiency.toFixed(1)),
          trend: costVariation > 0 ? 'up' : 'down',
          change: parseFloat(Math.abs(costVariation).toFixed(1)),
        },
        sustainability: {
          score: sustainability,
          rating: getSustainabilityRating(sustainability),
          carbonFootprint: 1250 + Math.floor(Math.random() * 300),
        },
        chainIntegrity: {
          score: 92 + Math.floor(Math.random() * 6),
          nodesOnline: 11 + Math.floor(Math.random() * 2),
          totalNodes: 13,
        },
        alerts: {
          critical: 1 + Math.floor(Math.random() * 2),
          high: 3 + Math.floor(Math.random() * 3),
          medium: 5 + Math.floor(Math.random() * 4),
          low: 8 + Math.floor(Math.random() * 5),
        },
        responseTime: {
          average: 120 + Math.floor(Math.random() * 40),
          unit: 'ms',
        },
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch metrics',
      },
    });
  }
});
