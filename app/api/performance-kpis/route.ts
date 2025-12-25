import { NextRequest, NextResponse } from 'next/server';

interface KPIMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'good' | 'warning' | 'critical';
  historicalData: Array<{
    date: string;
    value: number;
  }>;
}

/**
 * Performance KPIs API Route
 * 
 * POST /api/performance-kpis
 * Body: { timeRange?: '7d' | '30d' | '90d' }
 * 
 * Returns: { kpis: KPIMetric[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timeRange = '30d' } = body;

    const kpis = generateMockKPIData(timeRange);

    return NextResponse.json({ kpis });

  } catch (error) {
    console.error('Performance KPIs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance KPIs' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock KPI data
 * In production, this would fetch real metrics from monitoring systems
 */
function generateMockKPIData(timeRange: string): KPIMetric[] {
  const baseDate = new Date();
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  const generateHistoricalData = (baseValue: number, volatility: number = 0.1) => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      const variation = (Math.random() - 0.5) * volatility * baseValue;
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, baseValue + variation)
      });
    }
    return data;
  };

  return [
    {
      id: 'delivery-performance',
      name: 'On-Time Delivery Rate',
      currentValue: 87.5,
      targetValue: 95.0,
      unit: '%',
      trend: 'down',
      trendPercentage: -5.2,
      status: 'warning',
      historicalData: generateHistoricalData(87.5, 0.15)
    },
    {
      id: 'cost-efficiency',
      name: 'Cost per Shipment',
      currentValue: 245,
      targetValue: 200,
      unit: '$',
      trend: 'up',
      trendPercentage: 12.5,
      status: 'critical',
      historicalData: generateHistoricalData(245, 0.2)
    },
    {
      id: 'inventory-turnover',
      name: 'Inventory Turnover',
      currentValue: 8.2,
      targetValue: 10.0,
      unit: 'times/year',
      trend: 'stable',
      trendPercentage: 0.8,
      status: 'warning',
      historicalData: generateHistoricalData(8.2, 0.1)
    },
    {
      id: 'supplier-reliability',
      name: 'Supplier Reliability',
      currentValue: 92.3,
      targetValue: 98.0,
      unit: '%',
      trend: 'up',
      trendPercentage: 3.1,
      status: 'good',
      historicalData: generateHistoricalData(92.3, 0.08)
    },
    {
      id: 'lead-time',
      name: 'Average Lead Time',
      currentValue: 18.5,
      targetValue: 14.0,
      unit: 'days',
      trend: 'down',
      trendPercentage: -8.3,
      status: 'good',
      historicalData: generateHistoricalData(18.5, 0.12)
    },
    {
      id: 'risk-score',
      name: 'Overall Risk Score',
      currentValue: 68,
      targetValue: 40,
      unit: '/100',
      trend: 'up',
      trendPercentage: 15.2,
      status: 'critical',
      historicalData: generateHistoricalData(68, 0.18)
    }
  ];
}