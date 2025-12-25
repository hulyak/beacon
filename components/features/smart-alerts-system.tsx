'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  TrendingUp,
  TrendingDown,
  MapPin,
  Truck,
  Factory,
  Shield,
  Leaf,
  DollarSign,
  Users,
  Settings,
  Filter,
  X,
  Play,
  Pause
} from 'lucide-react';
import { ModernCard } from '../ui/modern-card';
import { ModernButton } from '../ui/modern-button';
import { ModernBadge } from '../ui/modern-badge';

interface SmartAlert {
  id: string;
  type: 'operational' | 'financial' | 'environmental' | 'security' | 'performance';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  title: string;
  description: string;
  location?: string;
  affectedSystems: string[];
  predictedImpact: {
    financial: number;
    operational: number;
    timeline: string;
  };
  aiConfidence: number;
  timestamp: Date;
  isActive: boolean;
  autoActions: string[];
  recommendedActions: string[];
  relatedAlerts: string[];
  escalationLevel: number;
  assignedTo?: string;
}

const mockAlerts: SmartAlert[] = [
  {
    id: '1',
    type: 'operational',
    severity: 'critical',
    title: 'Port Congestion Cascade Effect',
    description: 'Shanghai port congestion triggering delays across 12 supply routes. AI predicts 72-hour impact window.',
    location: 'Shanghai, China',
    affectedSystems: ['Port Operations', 'Shipping Routes', 'Inventory Management'],
    predictedImpact: {
      financial: 1250000,
      operational: 85,
      timeline: '72 hours'
    },
    aiConfidence: 94,
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    isActive: true,
    autoActions: ['Reroute 8 shipments to Ningbo port', 'Activate backup suppliers', 'Notify affected customers'],
    recommendedActions: ['Emergency logistics meeting', 'Negotiate expedited customs', 'Prepare press statement'],
    relatedAlerts: ['2', '5'],
    escalationLevel: 3,
    assignedTo: 'Sarah Chen'
  },
  {
    id: '2',
    type: 'financial',
    severity: 'warning',
    title: 'Currency Fluctuation Risk',
    description: 'EUR/USD volatility detected. 15% cost increase risk for European suppliers over next 30 days.',
    location: 'Europe',
    affectedSystems: ['Financial Planning', 'Supplier Contracts', 'Cost Management'],
    predictedImpact: {
      financial: 450000,
      operational: 25,
      timeline: '30 days'
    },
    aiConfidence: 78,
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    isActive: true,
    autoActions: ['Hedge currency exposure', 'Lock supplier rates', 'Update cost models'],
    recommendedActions: ['Review hedging strategy', 'Negotiate fixed-rate contracts', 'Diversify supplier base'],
    relatedAlerts: ['4'],
    escalationLevel: 2,
    assignedTo: 'Marcus Rodriguez'
  },
  {
    id: '3',
    type: 'environmental',
    severity: 'warning',
    title: 'Carbon Emission Threshold Breach',
    description: 'Monthly carbon emissions 18% above target. Sustainability goals at risk for Q1.',
    location: 'Global',
    affectedSystems: ['Sustainability Tracking', 'ESG Reporting', 'Green Logistics'],
    predictedImpact: {
      financial: 125000,
      operational: 15,
      timeline: '90 days'
    },
    aiConfidence: 89,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isActive: true,
    autoActions: ['Switch to green shipping options', 'Optimize route efficiency', 'Update carbon tracking'],
    recommendedActions: ['Review sustainability strategy', 'Invest in carbon offsets', 'Accelerate green initiatives'],
    relatedAlerts: [],
    escalationLevel: 1,
    assignedTo: 'James Wilson'
  },
  {
    id: '4',
    type: 'performance',
    severity: 'info',
    title: 'Supplier Performance Optimization',
    description: 'AI identified 23% efficiency improvement opportunity with Supplier TechCorp through process optimization.',
    location: 'Asia-Pacific',
    affectedSystems: ['Supplier Management', 'Quality Control', 'Performance Analytics'],
    predictedImpact: {
      financial: -350000, // Negative means savings
      operational: 23,
      timeline: '60 days'
    },
    aiConfidence: 91,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    isActive: true,
    autoActions: ['Schedule supplier meeting', 'Prepare optimization proposal', 'Update performance metrics'],
    recommendedActions: ['Implement lean processes', 'Provide training support', 'Set performance targets'],
    relatedAlerts: [],
    escalationLevel: 0,
    assignedTo: 'Aisha Patel'
  },
  {
    id: '5',
    type: 'security',
    severity: 'critical',
    title: 'Cybersecurity Threat Detected',
    description: 'Unusual network activity detected in supplier systems. Potential data breach risk identified.',
    location: 'Network Infrastructure',
    affectedSystems: ['IT Security', 'Data Protection', 'Supplier Networks'],
    predictedImpact: {
      financial: 2500000,
      operational: 95,
      timeline: '24 hours'
    },
    aiConfidence: 87,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    isActive: true,
    autoActions: ['Isolate affected systems', 'Activate security protocols', 'Notify security team'],
    recommendedActions: ['Conduct security audit', 'Update access controls', 'Implement additional monitoring'],
    relatedAlerts: [],
    escalationLevel: 4,
    assignedTo: 'Security Team'
  }
];

const getSeverityColor = (severity: SmartAlert['severity']) => {
  switch (severity) {
    case 'info': return 'border-l-blue-500 bg-blue-50';
    case 'warning': return 'border-l-yellow-500 bg-yellow-50';
    case 'critical': return 'border-l-red-500 bg-red-50';
    case 'emergency': return 'border-l-purple-500 bg-purple-50';
  }
};

const getTypeIcon = (type: SmartAlert['type']) => {
  switch (type) {
    case 'operational': return <Truck className="w-5 h-5" />;
    case 'financial': return <DollarSign className="w-5 h-5" />;
    case 'environmental': return <Leaf className="w-5 h-5" />;
    case 'security': return <Shield className="w-5 h-5" />;
    case 'performance': return <TrendingUp className="w-5 h-5" />;
  }
};

const getTypeColor = (type: SmartAlert['type']) => {
  switch (type) {
    case 'operational': return 'text-blue-600 bg-blue-50';
    case 'financial': return 'text-green-600 bg-green-50';
    case 'environmental': return 'text-emerald-600 bg-emerald-50';
    case 'security': return 'text-red-600 bg-red-50';
    case 'performance': return 'text-purple-600 bg-purple-50';
  }
};

export function SmartAlertsSystem() {
  const [alerts, setAlerts] = useState<SmartAlert[]>(mockAlerts);
  const [selectedAlert, setSelectedAlert] = useState<SmartAlert | null>(null);
  const [filters, setFilters] = useState({
    severity: 'all',
    type: 'all',
    active: true
  });
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  // Simulate real-time alerts
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        // Update existing alert confidence or add new alert
        setAlerts(prev => prev.map(alert => ({
          ...alert,
          aiConfidence: Math.max(70, Math.min(99, alert.aiConfidence + (Math.random() - 0.5) * 5))
        })));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  const filteredAlerts = alerts.filter(alert => {
    if (filters.severity !== 'all' && alert.severity !== filters.severity) return false;
    if (filters.type !== 'all' && alert.type !== filters.type) return false;
    if (filters.active && !alert.isActive) return false;
    return true;
  });

  const handleTakeAction = async (alert: SmartAlert, actionType: 'auto' | 'recommended') => {
    // Simulate taking action
    console.log(`Taking ${actionType} action for alert:`, alert.id);
    
    // Update alert status
    setAlerts(prev => prev.map(a => 
      a.id === alert.id 
        ? { ...a, escalationLevel: Math.max(0, a.escalationLevel - 1) }
        : a
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isActive: false } : alert
    ));
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Smart Alerts</h2>
            <p className="text-sm text-gray-600">AI-powered predictive alerting system</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ModernButton
            variant={isRealTimeEnabled ? "primary" : "outline"}
            size="sm"
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
          >
            {isRealTimeEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRealTimeEnabled ? 'Pause' : 'Resume'} Real-time
          </ModernButton>
          
          <ModernButton variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </ModernButton>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <Filter className="w-4 h-4 text-gray-500" />
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Severity:</span>
          <select
            value={filters.severity}
            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All</option>
            <option value="emergency">Emergency</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Type:</span>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All</option>
            <option value="operational">Operational</option>
            <option value="financial">Financial</option>
            <option value="environmental">Environmental</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active-only"
            checked={filters.active}
            onChange={(e) => setFilters(prev => ({ ...prev, active: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="active-only" className="text-sm text-gray-600">Active only</label>
        </div>

        <div className="ml-auto">
          <ModernBadge variant="outline">
            {filteredAlerts.length} alerts
          </ModernBadge>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAlerts.map((alert) => (
          <ModernCard 
            key={alert.id}
            className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4 ${getSeverityColor(alert.severity)}`}
            onClick={() => setSelectedAlert(alert)}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${getTypeColor(alert.type)}`}>
                    {getTypeIcon(alert.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{alert.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <ModernBadge 
                        variant={alert.severity === 'critical' || alert.severity === 'emergency' ? 'destructive' : 
                                alert.severity === 'warning' ? 'warning' : 'outline'}
                        className="text-xs"
                      >
                        {alert.severity.toUpperCase()}
                      </ModernBadge>
                      {alert.location && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {alert.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {alert.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    AI: {alert.aiConfidence}%
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {alert.description}
              </p>

              {/* Impact Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">Financial Impact</div>
                  <div className={`font-medium ${alert.predictedImpact.financial < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {alert.predictedImpact.financial < 0 ? '-' : '+'}${Math.abs(alert.predictedImpact.financial).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">Operational</div>
                  <div className="font-medium text-gray-900">
                    {alert.predictedImpact.operational}% impact
                  </div>
                </div>
              </div>

              {/* Escalation Level */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < alert.escalationLevel ? 'bg-red-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">Escalation</span>
                </div>
                
                {alert.assignedTo && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-600">{alert.assignedTo}</span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <ModernButton
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTakeAction(alert, 'auto');
                  }}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Auto-Fix
                </ModernButton>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissAlert(alert.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        ))}
      </div>

      {/* Detailed Alert Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ModernCard className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(selectedAlert.type)}`}>
                    {getTypeIcon(selectedAlert.type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedAlert.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <ModernBadge 
                        variant={selectedAlert.severity === 'critical' || selectedAlert.severity === 'emergency' ? 'destructive' : 
                                selectedAlert.severity === 'warning' ? 'warning' : 'outline'}
                      >
                        {selectedAlert.severity.toUpperCase()}
                      </ModernBadge>
                      <span className="text-sm text-gray-500">
                        AI Confidence: {selectedAlert.aiConfidence}%
                      </span>
                    </div>
                  </div>
                </div>
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAlert(null)}
                >
                  <X className="w-4 h-4" />
                </ModernButton>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Alert Description</h4>
                <p className="text-gray-600">{selectedAlert.description}</p>
              </div>

              {/* Impact Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Financial Impact</h4>
                  <div className={`text-2xl font-bold ${selectedAlert.predictedImpact.financial < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedAlert.predictedImpact.financial < 0 ? '-' : '+'}${Math.abs(selectedAlert.predictedImpact.financial).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Over {selectedAlert.predictedImpact.timeline}</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Operational Impact</h4>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedAlert.predictedImpact.operational}%
                  </div>
                  <div className="text-sm text-gray-600">System disruption</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedAlert.predictedImpact.timeline}
                  </div>
                  <div className="text-sm text-gray-600">Expected duration</div>
                </div>
              </div>

              {/* Affected Systems */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Affected Systems</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAlert.affectedSystems.map((system, index) => (
                    <ModernBadge key={index} variant="outline">
                      {system}
                    </ModernBadge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Automated Actions</h4>
                  <div className="space-y-2">
                    {selectedAlert.autoActions.map((action, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <span className="text-sm text-gray-700">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recommended Actions</h4>
                  <div className="space-y-2">
                    {selectedAlert.recommendedActions.map((action, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                        <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <span className="text-sm text-gray-700">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <ModernButton
                  variant="primary"
                  onClick={() => handleTakeAction(selectedAlert, 'auto')}
                  className="flex-1"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Execute Auto Actions
                </ModernButton>
                <ModernButton
                  variant="outline"
                  onClick={() => handleTakeAction(selectedAlert, 'recommended')}
                  className="flex-1"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Assign to Team
                </ModernButton>
                <ModernButton
                  variant="outline"
                  onClick={() => dismissAlert(selectedAlert.id)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Dismiss
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        </div>
      )}
    </div>
  );
}