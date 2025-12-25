'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Bell, 
  Video, 
  Share2, 
  Clock, 
  CheckCircle,
  AlertCircle,
  User,
  Zap,
  Brain,
  TrendingUp,
  Calendar,
  FileText,
  Send
} from 'lucide-react';
import { ModernCard } from '../ui/modern-card';
import { ModernButton } from '../ui/modern-button';
import { ModernBadge } from '../ui/modern-badge';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentTask?: string;
  expertise: string[];
  location: string;
  timezone: string;
}

interface Notification {
  id: string;
  type: 'alert' | 'update' | 'mention' | 'approval' | 'insight';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  from?: TeamMember;
  actionRequired?: boolean;
  relatedTo?: string;
}

interface AIInsight {
  id: string;
  type: 'team_performance' | 'workload_balance' | 'expertise_gap' | 'collaboration_opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  suggestions: string[];
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Supply Chain Manager',
    avatar: '👩‍💼',
    status: 'online',
    currentTask: 'Reviewing Shanghai port delays',
    expertise: ['Logistics', 'Risk Management', 'Asia-Pacific'],
    location: 'Singapore',
    timezone: 'GMT+8'
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    role: 'Operations Director',
    avatar: '👨‍💼',
    status: 'busy',
    currentTask: 'Emergency response planning',
    expertise: ['Operations', 'Crisis Management', 'Americas'],
    location: 'Mexico City',
    timezone: 'GMT-6'
  },
  {
    id: '3',
    name: 'Aisha Patel',
    role: 'Data Analyst',
    avatar: '👩‍💻',
    status: 'online',
    currentTask: 'Analyzing supplier performance',
    expertise: ['Analytics', 'Machine Learning', 'Forecasting'],
    location: 'Mumbai',
    timezone: 'GMT+5:30'
  },
  {
    id: '4',
    name: 'James Wilson',
    role: 'Sustainability Lead',
    avatar: '👨‍🔬',
    status: 'away',
    currentTask: 'Carbon footprint assessment',
    expertise: ['Sustainability', 'ESG', 'Green Logistics'],
    location: 'London',
    timezone: 'GMT+0'
  }
];

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Critical Port Congestion',
    message: 'Shanghai port experiencing 85% congestion. Immediate action required.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    priority: 'critical',
    actionRequired: true,
    relatedTo: 'Shanghai Port Operations'
  },
  {
    id: '2',
    type: 'mention',
    title: 'Team Mention in Risk Assessment',
    message: 'Sarah mentioned you in the quarterly risk assessment discussion.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    priority: 'medium',
    from: mockTeamMembers[0],
    actionRequired: false
  },
  {
    id: '3',
    type: 'insight',
    title: 'AI Optimization Suggestion',
    message: 'Route optimization could save $125K this quarter. Review recommended.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    priority: 'high',
    actionRequired: true,
    relatedTo: 'Route Optimization'
  },
  {
    id: '4',
    type: 'update',
    title: 'Supplier Integration Complete',
    message: 'TechCorp supplier integration completed successfully. All systems operational.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    priority: 'low',
    actionRequired: false
  }
];

const mockAIInsights: AIInsight[] = [
  {
    id: '1',
    type: 'workload_balance',
    title: 'Workload Imbalance Detected',
    description: 'Marcus is handling 40% more critical tasks than team average. Consider redistribution.',
    confidence: 87,
    impact: 'medium',
    suggestions: [
      'Reassign 2 non-critical tasks to available team members',
      'Schedule workload review meeting',
      'Consider temporary resource allocation'
    ]
  },
  {
    id: '2',
    type: 'collaboration_opportunity',
    title: 'Cross-Team Collaboration Opportunity',
    description: 'Sarah and Aisha working on related analytics. Joint session could improve efficiency by 25%.',
    confidence: 92,
    impact: 'high',
    suggestions: [
      'Schedule joint working session',
      'Share data models and insights',
      'Create shared workspace for ongoing collaboration'
    ]
  },
  {
    id: '3',
    type: 'expertise_gap',
    title: 'Expertise Gap in European Operations',
    description: 'Limited European logistics expertise may impact Q1 expansion plans.',
    confidence: 78,
    impact: 'high',
    suggestions: [
      'Consider hiring European logistics specialist',
      'Arrange knowledge transfer sessions',
      'Partner with local logistics consultants'
    ]
  }
];

const getStatusColor = (status: TeamMember['status']) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'away': return 'bg-yellow-500';
    case 'busy': return 'bg-red-500';
    case 'offline': return 'bg-gray-400';
  }
};

const getPriorityColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'critical': return 'border-l-red-500 bg-red-50';
    case 'high': return 'border-l-orange-500 bg-orange-50';
    case 'medium': return 'border-l-yellow-500 bg-yellow-50';
    case 'low': return 'border-l-blue-500 bg-blue-50';
  }
};

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'alert': return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'update': return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'mention': return <User className="w-4 h-4 text-blue-600" />;
    case 'approval': return <FileText className="w-4 h-4 text-purple-600" />;
    case 'insight': return <Brain className="w-4 h-4 text-indigo-600" />;
  }
};

export function CollaborationHub() {
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [aiInsights] = useState<AIInsight[]>(mockAIInsights);
  const [activeTab, setActiveTab] = useState<'team' | 'notifications' | 'insights'>('team');
  const [newMessage, setNewMessage] = useState('');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Add random notification occasionally
      if (Math.random() < 0.1) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'update',
          title: 'System Update',
          message: 'Real-time data sync completed successfully.',
          timestamp: new Date(),
          priority: 'low',
          actionRequired: false
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Collaboration Hub</h2>
            <p className="text-sm text-gray-600">Team intelligence and real-time coordination</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ModernButton variant="outline" size="sm">
            <Video className="w-4 h-4 mr-1" />
            Start Meeting
          </ModernButton>
          <ModernButton variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-1" />
            Share Screen
          </ModernButton>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'team', label: 'Team', icon: Users },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'insights', label: 'AI Insights', icon: Brain }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'notifications' && notifications.length > 0 && (
              <ModernBadge variant="error" className="text-xs">
                {notifications.length}
              </ModernBadge>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamMembers.map(member => (
                  <ModernCard key={member.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="text-2xl">{member.avatar}</div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-600">{member.role}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{member.location} ({member.timezone})</span>
                            </div>
                          </div>
                        </div>
                        <ModernBadge variant={member.status === 'online' ? 'success' : 'default'}>
                          {member.status}
                        </ModernBadge>
                      </div>

                      {member.currentTask && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-600 mb-1">Current Task:</div>
                          <div className="text-sm text-gray-900">{member.currentTask}</div>
                        </div>
                      )}

                      <div>
                        <div className="text-xs text-gray-600 mb-2">Expertise:</div>
                        <div className="flex flex-wrap gap-1">
                          {member.expertise.map(skill => (
                            <ModernBadge key={skill} variant="default" className="text-xs">
                              {skill}
                            </ModernBadge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <ModernButton variant="outline" size="sm" className="flex-1">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Message
                        </ModernButton>
                        <ModernButton variant="outline" size="sm" className="flex-1">
                          <Video className="w-3 h-3 mr-1" />
                          Call
                        </ModernButton>
                      </div>
                    </div>
                  </ModernCard>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-3">
              {notifications.map(notification => (
                <ModernCard key={notification.id} className={`p-4 border-l-4 ${getPriorityColor(notification.priority)}`}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <h3 className="font-medium text-gray-900 text-sm">{notification.title}</h3>
                        {notification.actionRequired && (
                          <ModernBadge variant="error" className="text-xs">
                            Action Required
                          </ModernBadge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {notification.timestamp.toLocaleTimeString()}
                        </span>
                        <ModernButton
                          variant="ghost"
                          size="sm"
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          ×
                        </ModernButton>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">{notification.message}</p>

                    {notification.from && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>From: {notification.from.name}</span>
                      </div>
                    )}

                    {notification.actionRequired && (
                      <div className="flex gap-2 pt-2">
                        <ModernButton variant="primary" size="sm">
                          Take Action
                        </ModernButton>
                        <ModernButton variant="outline" size="sm">
                          View Details
                        </ModernButton>
                      </div>
                    )}
                  </div>
                </ModernCard>
              ))}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              {aiInsights.map(insight => (
                <ModernCard key={insight.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{insight.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <ModernBadge variant={insight.impact === 'high' ? 'error' : insight.impact === 'medium' ? 'warning' : 'default'}>
                              {insight.impact.toUpperCase()} IMPACT
                            </ModernBadge>
                            <span className="text-xs text-gray-500">
                              {insight.confidence}% confidence
                            </span>
                          </div>
                        </div>
                      </div>
                      <Zap className="w-4 h-4 text-yellow-500" />
                    </div>

                    <p className="text-sm text-gray-600">{insight.description}</p>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">AI Suggestions:</h4>
                      <ul className="space-y-1">
                        {insight.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <ModernButton variant="primary" size="sm">
                        <Zap className="w-3 h-3 mr-1" />
                        Implement
                      </ModernButton>
                      <ModernButton variant="outline" size="sm">
                        Learn More
                      </ModernButton>
                    </div>
                  </div>
                </ModernCard>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <ModernCard className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <ModernButton variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Meeting
              </ModernButton>
              <ModernButton variant="outline" size="sm" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Create Report
              </ModernButton>
              <ModernButton variant="outline" size="sm" className="w-full justify-start">
                <Share2 className="w-4 h-4 mr-2" />
                Share Dashboard
              </ModernButton>
              <ModernButton variant="outline" size="sm" className="w-full justify-start">
                <Bell className="w-4 h-4 mr-2" />
                Set Alert
              </ModernButton>
            </div>
          </ModernCard>

          {/* Team Chat */}
          <ModernCard className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Team Chat</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-blue-600">Sarah:</span>
                    <span className="text-gray-700">Port situation update needed ASAP</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-green-600">Marcus:</span>
                    <span className="text-gray-700">Working on contingency plans now</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-purple-600">AI Assistant:</span>
                    <span className="text-gray-700">Alternative routes identified. Cost impact: +15%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <ModernButton variant="primary" size="sm" onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </ModernButton>
              </div>
            </div>
          </ModernCard>

          {/* Performance Metrics */}
          <ModernCard className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Team Performance</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-medium">2.3 min avg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Task Completion</span>
                  <span className="font-medium">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Collaboration Score</span>
                  <span className="font-medium">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '87%' }} />
                </div>
              </div>
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}