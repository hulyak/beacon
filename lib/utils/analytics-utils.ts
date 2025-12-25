import { 
  ImpactAssessmentResponse, 
  ExplainabilityResponse, 
  SustainabilityResponse, 
  ROIOptimizationResponse 
} from '@/lib/types/enhanced-analytics';

/**
 * Format currency values with appropriate locale and currency symbol
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage values with appropriate precision
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with appropriate units (K, M, B)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Calculate confidence level color based on percentage
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-green-600';
  if (confidence >= 60) return 'text-yellow-600';
  if (confidence >= 40) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get risk level color and styling
 */
export function getRiskLevelColor(riskLevel: 'low' | 'medium' | 'high' | 'critical'): string {
  const colors = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50',
  };
  return colors[riskLevel];
}

/**
 * Calculate total financial impact from impact assessment
 */
export function calculateTotalImpact(impact: ImpactAssessmentResponse): number {
  const { financialImpact } = impact;
  return financialImpact.directCosts + 
         financialImpact.opportunityCosts + 
         financialImpact.laborCosts + 
         financialImpact.materialCosts + 
         financialImpact.logisticsCosts;
}

/**
 * Generate voice description for impact assessment
 */
export function generateImpactVoiceDescription(impact: ImpactAssessmentResponse): string {
  const totalImpact = formatCurrency(impact.financialImpact.totalImpact);
  const confidence = impact.confidence;
  const affectedOrders = impact.operationalImpact.deliveryDelays.affectedOrders;
  const avgDelay = impact.operationalImpact.deliveryDelays.averageDelay;

  return `The analysis shows a total financial impact of ${totalImpact} with ${confidence}% confidence. ` +
         `This affects ${affectedOrders} orders with an average delay of ${avgDelay} days. ` +
         `The main cost drivers are ${getLargestCostCategory(impact.financialImpact)}.`;
}

/**
 * Generate voice description for explainability data
 */
export function generateExplainabilityVoiceDescription(explanation: ExplainabilityResponse): string {
  const confidence = explanation.confidence;
  const topAgent = getTopContributingAgent(explanation.agentContributions);
  const uncertaintyCount = explanation.uncertaintyFactors.length;

  return `I'm ${confidence}% confident in this recommendation. ` +
         `The ${topAgent} provided the strongest contribution to this analysis. ` +
         `${uncertaintyCount > 0 ? `There are ${uncertaintyCount} uncertainty factors to consider.` : 'The analysis has high certainty.'}`;
}

/**
 * Generate voice description for sustainability metrics
 */
export function generateSustainabilityVoiceDescription(sustainability: SustainabilityResponse): string {
  const carbonFootprint = formatLargeNumber(sustainability.carbonFootprint.total);
  const score = sustainability.sustainabilityScore.overall;
  const alertCount = sustainability.thresholdAlerts.length;

  return `Your carbon footprint is ${carbonFootprint} kg CO₂ with a sustainability score of ${score} out of 100. ` +
         `${alertCount > 0 ? `You have ${alertCount} environmental alerts requiring attention.` : 'All environmental metrics are within thresholds.'}`;
}

/**
 * Generate voice description for ROI optimization
 */
export function generateROIVoiceDescription(roi: ROIOptimizationResponse): string {
  const topStrategy = roi.ranking[0];
  const payback = roi.paybackAnalysis.paybackPeriod;
  const roiPercent = formatPercentage(roi.paybackAnalysis.roi);

  return `The recommended strategy has a ${roiPercent} ROI with a ${payback}-month payback period. ` +
         `This strategy ranks highest based on your optimization criteria.`;
}

/**
 * Helper function to get the largest cost category
 */
function getLargestCostCategory(financialImpact: ImpactAssessmentResponse['financialImpact']): string {
  const categories = {
    'direct costs': financialImpact.directCosts,
    'opportunity costs': financialImpact.opportunityCosts,
    'labor costs': financialImpact.laborCosts,
    'material costs': financialImpact.materialCosts,
    'logistics costs': financialImpact.logisticsCosts,
  };

  return Object.entries(categories).reduce((a, b) => 
    categories[a[0]] > categories[b[0]] ? a : b
  )[0];
}

/**
 * Helper function to get the top contributing agent
 */
function getTopContributingAgent(agentContributions: ExplainabilityResponse['agentContributions']): string {
  const agents = {
    'Info Agent': agentContributions.infoAgent.confidence,
    'Scenario Agent': agentContributions.scenarioAgent.confidence,
    'Impact Agent': agentContributions.impactAgent.confidence,
    'Strategy Agent': agentContributions.strategyAgent.confidence,
  };

  return Object.entries(agents).reduce((a, b) => 
    agents[a[0]] > agents[b[0]] ? a : b
  )[0];
}

/**
 * Validate confidence score is within valid range
 */
export function validateConfidenceScore(confidence: number): boolean {
  return confidence >= 0 && confidence <= 100;
}

/**
 * Calculate weighted score for multi-criteria analysis
 */
export function calculateWeightedScore(
  metrics: { cost: number; risk: number; sustainability: number; timeline: number },
  weights: { cost: number; risk: number; sustainability: number; timeline: number }
): number {
  const totalWeight = weights.cost + weights.risk + weights.sustainability + weights.timeline;
  
  if (totalWeight === 0) return 0;
  
  return (
    (metrics.cost * weights.cost +
     metrics.risk * weights.risk +
     metrics.sustainability * weights.sustainability +
     metrics.timeline * weights.timeline) / totalWeight
  );
}

/**
 * Generate time-based greeting for voice responses
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(days: number): string {
  if (days < 1) return 'Less than a day';
  if (days === 1) return '1 day';
  if (days < 7) return `${Math.round(days)} days`;
  if (days < 30) return `${Math.round(days / 7)} weeks`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}