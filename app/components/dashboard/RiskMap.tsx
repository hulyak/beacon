'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { useVoiceDashboard, useIsRegionHighlighted, Region } from '@/lib/voice-dashboard-context';
import { fetchRealTimeRisks, fetchRealTimeAlerts } from '@/lib/real-time-data';

interface RegionData {
  id: Region;
  name: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  activeAlerts: number;
  topRisk: string;
  trend: 'up' | 'down' | 'stable';
}

// Initial data structure - will be populated with real data
const initialRegionsData: RegionData[] = [
  {
    id: 'asia',
    name: 'Asia Pacific',
    riskLevel: 'medium',
    riskScore: 0,
    activeAlerts: 0,
    topRisk: 'Loading...',
    trend: 'stable',
  },
  {
    id: 'europe',
    name: 'Europe',
    riskLevel: 'medium',
    riskScore: 0,
    activeAlerts: 0,
    topRisk: 'Loading...',
    trend: 'stable',
  },
  {
    id: 'north_america',
    name: 'North America',
    riskLevel: 'medium',
    riskScore: 0,
    activeAlerts: 0,
    topRisk: 'Loading...',
    trend: 'stable',
  },
  {
    id: 'south_america',
    name: 'South America',
    riskLevel: 'medium',
    riskScore: 0,
    activeAlerts: 0,
    topRisk: 'Loading...',
    trend: 'stable',
  },
];

function getRiskColor(level: string) {
  switch (level) {
    case 'low': return { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' };
    case 'medium': return { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400' };
    case 'high': return { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400' };
    case 'critical': return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' };
    default: return { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-400' };
  }
}

interface RegionCardProps {
  region: RegionData;
  isHighlighted: boolean;
  onClick: () => void;
}

function RegionCard({ region, isHighlighted, onClick }: RegionCardProps) {
  const colors = getRiskColor(region.riskLevel);

  return (
    <motion.div
      className={`relative cursor-pointer rounded-lg p-3 transition-all duration-300 ${
        isHighlighted
          ? `${colors.bg} ${colors.border} border-2`
          : 'bg-white border border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
      whileHover={{ y: -1 }}
    >
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className={`w-4 h-4 flex-shrink-0 ${colors.text}`} />
            <h3 className="font-medium text-gray-900 text-sm truncate">{region.name}</h3>
          </div>
          <div className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${colors.bg} ${colors.text}`}>
            {region.riskLevel.toUpperCase()}
          </div>
        </div>

        {/* Risk Score + Alerts Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <span className={`text-xl font-bold ${colors.text}`}>{region.riskScore}</span>
            {region.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
            {region.trend === 'down' && <TrendingDown className="w-3 h-3 text-green-400" />}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            <span>{region.activeAlerts} alerts</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
          <motion.div
            className={`h-full ${colors.bg.replace('/20', '')}`}
            initial={{ width: 0 }}
            animate={{ width: `${region.riskScore}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Top Risk */}
        <p className="text-xs text-gray-600 truncate" title={region.topRisk}>{region.topRisk}</p>
      </div>
    </motion.div>
  );
}

export function RiskMap() {
  const { activeRegion, setActiveRegion, highlightRegion } = useVoiceDashboard();
  const [regionsData, setRegionsData] = useState<RegionData[]>(initialRegionsData);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch real-time data for all regions
  useEffect(() => {
    const loadRegionData = async () => {
      setIsLoading(true);
      try {
        const updatedRegions = await Promise.all(
          initialRegionsData.map(async (region) => {
            const risks = await fetchRealTimeRisks(region.id);
            const alerts = await fetchRealTimeAlerts(region.id);

            // Calculate risk score from risks
            const avgRiskScore = risks.length > 0
              ? Math.round(risks.reduce((sum, r) => sum + r.probability, 0) / risks.length)
              : 30;

            // Determine risk level
            const riskLevel: 'low' | 'medium' | 'high' | 'critical' =
              avgRiskScore >= 75 ? 'critical' :
              avgRiskScore >= 55 ? 'high' :
              avgRiskScore >= 35 ? 'medium' : 'low';

            // Get top risk
            const topRisk = risks[0]?.title || 'No significant risks';

            // Calculate trend (based on risk severity distribution)
            const criticalCount = risks.filter(r => r.severity === 'critical').length;
            const trend: 'up' | 'down' | 'stable' =
              criticalCount >= 2 ? 'up' :
              criticalCount === 0 ? 'down' : 'stable';

            return {
              ...region,
              riskScore: avgRiskScore,
              riskLevel,
              activeAlerts: alerts.length,
              topRisk,
              trend,
            };
          })
        );

        setRegionsData(updatedRegions);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to load region data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRegionData();
    const interval = setInterval(loadRegionData, 120000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const handleRegionClick = (region: Region) => {
    setActiveRegion(region);
    highlightRegion(region);
  };

  const refreshData = async () => {
    setIsLoading(true);
    // Trigger re-fetch by resetting state
    const updatedRegions = await Promise.all(
      initialRegionsData.map(async (region) => {
        const risks = await fetchRealTimeRisks(region.id);
        const alerts = await fetchRealTimeAlerts(region.id);
        const avgRiskScore = risks.length > 0
          ? Math.round(risks.reduce((sum, r) => sum + r.probability, 0) / risks.length)
          : 30;
        const riskLevel: 'low' | 'medium' | 'high' | 'critical' =
          avgRiskScore >= 75 ? 'critical' :
          avgRiskScore >= 55 ? 'high' :
          avgRiskScore >= 35 ? 'medium' : 'low';
        const topRisk = risks[0]?.title || 'No significant risks';
        const criticalCount = risks.filter(r => r.severity === 'critical').length;
        const trend: 'up' | 'down' | 'stable' =
          criticalCount >= 2 ? 'up' : criticalCount === 0 ? 'down' : 'stable';
        return { ...region, riskScore: avgRiskScore, riskLevel, activeAlerts: alerts.length, topRisk, trend };
      })
    );
    setRegionsData(updatedRegions);
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Regional Risk</h2>
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
        </div>
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {regionsData.map((region) => (
          <RegionCard
            key={region.id}
            region={region}
            isHighlighted={activeRegion === region.id}
            onClick={() => handleRegionClick(region.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default RiskMap;
