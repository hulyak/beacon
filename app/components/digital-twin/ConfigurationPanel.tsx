'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  ChevronDown,
  ChevronUp,
  Ship,
  Plane,
  Train,
  Truck,
  Zap,
  Check,
  AlertTriangle,
  Shield,
  Activity,
} from 'lucide-react';
import { useDigitalTwin } from './DigitalTwinContext';

const regions = [
  { value: 'asia-pacific', label: 'Asia-Pacific' },
  { value: 'europe', label: 'Europe' },
  { value: 'north-america', label: 'North America' },
  { value: 'south-america', label: 'South America' },
  { value: 'middle-east', label: 'Middle East' },
  { value: 'africa', label: 'Africa' },
];

const industries = [
  { value: 'electronics', label: 'Electronics Manufacturing' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'pharmaceuticals', label: 'Pharmaceuticals' },
  { value: 'consumer-goods', label: 'Consumer Goods' },
  { value: 'food-beverage', label: 'Food & Beverage' },
  { value: 'textiles', label: 'Textiles & Apparel' },
];

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
];

const shippingMethods = [
  { id: 'sea', label: 'Sea Freight', icon: Ship },
  { id: 'air', label: 'Air Freight', icon: Plane },
  { id: 'rail', label: 'Rail', icon: Train },
  { id: 'truck', label: 'Truck', icon: Truck },
  { id: 'express', label: 'Express Delivery', icon: Zap },
];

const riskProfiles = [
  {
    value: 'low',
    label: 'Low Risk',
    description: 'Stable suppliers, minimal disruptions',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    value: 'medium',
    label: 'Medium Risk',
    description: 'Occasional delays, moderate volatility',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  {
    value: 'high',
    label: 'High Risk',
    description: 'Frequent disruptions, high volatility',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
];

interface ConfigurationPanelProps {
  onApply?: (config: SupplyChainConfig) => void;
}

export interface SupplyChainConfig {
  region: string;
  industry: string;
  currency: string;
  shippingMethods: string[];
  nodeComplexity: number;
  riskProfile: string;
}

export default function ConfigurationPanel({ onApply }: ConfigurationPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [region, setRegion] = useState('asia-pacific');
  const [industry, setIndustry] = useState('electronics');
  const [currency, setCurrency] = useState('USD');
  const [selectedShipping, setSelectedShipping] = useState<string[]>(['sea', 'air', 'truck']);
  const [nodeComplexity, setNodeComplexity] = useState(6);
  const [riskProfile, setRiskProfile] = useState('medium');

  const { nodes } = useDigitalTwin();

  const toggleShipping = (id: string) => {
    setSelectedShipping((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    const config: SupplyChainConfig = {
      region,
      industry,
      currency,
      shippingMethods: selectedShipping,
      nodeComplexity,
      riskProfile,
    };
    onApply?.(config);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="text-gray-900 font-semibold text-sm">Supply Chain Configuration</h3>
            <p className="text-gray-500 text-xs">
              {isCollapsed ? 'Click to expand' : 'Configure your network settings'}
            </p>
          </div>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4 border-t border-gray-100">
          {/* Primary Region */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Primary Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {regions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {industries.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {currencies.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Shipping Methods */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Shipping Methods
            </label>
            <div className="flex flex-wrap gap-2">
              {shippingMethods.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => toggleShipping(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedShipping.includes(id)
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {selectedShipping.includes(id) && (
                    <Check className="w-3 h-3 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Supply Chain Nodes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-600">
                Supply Chain Nodes: {nodes.length}
              </label>
              <span className="text-xs text-gray-400">
                {nodeComplexity <= 4 ? 'Simple' : nodeComplexity <= 8 ? 'Medium' : 'Complex'} ({nodeComplexity})
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              value={nodeComplexity}
              onChange={(e) => setNodeComplexity(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>Simple (3)</span>
              <span>Complex (12)</span>
            </div>
          </div>

          {/* Risk Profile */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Risk Profile
            </label>
            <div className="space-y-2">
              {riskProfiles.map((profile) => (
                <button
                  key={profile.value}
                  onClick={() => setRiskProfile(profile.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    riskProfile === profile.value
                      ? `${profile.bgColor} ${profile.borderColor} border-2`
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${profile.color}`} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${riskProfile === profile.value ? profile.textColor : 'text-gray-700'}`}>
                      {profile.label}
                    </div>
                    <div className="text-xs text-gray-500">{profile.description}</div>
                  </div>
                  {riskProfile === profile.value && (
                    <Check className={`w-4 h-4 ${profile.textColor}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            Apply Configuration
          </button>
        </div>
      )}
    </motion.div>
  );
}
