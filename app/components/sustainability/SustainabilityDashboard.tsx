'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, AlertTriangle, TrendingUp, Zap } from 'lucide-react';

interface SustainabilityMetrics {
  carbonFootprint: {
    total: number;
    unit: 'kg_co2';
    breakdown: {
      air: number;
      sea: number;
      rail: number;
      road: number;
    };
    emissionsPerUnit: number;
  };
  sustainabilityScore: {
    overall: number;
    environmental: number;
    efficiency: number;
    innovation: number;
  };
  thresholdAlerts: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    currentValue: number;
    threshold: number;
  }>;
}

interface SustainabilityDashboardProps {
  timeRange?: '7d' | '30d' | '90d';
  onMetricsUpdate?: (data: SustainabilityMetrics) => void;
}

export default function SustainabilityDashboard({ 
  timeRange = '30d', 
  onMetricsUpdate 
}: SustainabilityDashboardProps) {
  const [sustainabilityData, setSustainabilityData] = useState<SustainabilityMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSustainabilityData();
  }, [timeRange]);

  const fetchSustainabilityData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sustainability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange })
      });
      const data = await response.json();
      setSustainabilityData(data);
      onMetricsUpdate?.(data);
    } catch (error) {
      console.error('Failed to fetch sustainability data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading sustainability metrics...</div>;
  }

  if (!sustainabilityData) {
    return <div className="p-6">No sustainability data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carbon Footprint</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sustainabilityData.carbonFootprint.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              kg CO₂ equivalent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sustainability Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sustainabilityData.sustainabilityScore.overall}/100
            </div>
            <p className="text-xs text-muted-foreground">
              Overall performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emissions Per Unit</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sustainabilityData.carbonFootprint.emissionsPerUnit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              kg CO₂/unit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threshold Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sustainabilityData.thresholdAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active alerts
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}