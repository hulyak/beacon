'use client';

import React, { memo } from 'react';
import { Handle, Position, type Node } from '@xyflow/react';
import { Store, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

export interface RetailerNodeData {
  name: string;
  location: string;
  region: string;
  status: 'healthy' | 'warning' | 'critical';
  capacity?: number;
  utilization?: number;
  riskLevel?: number;
  salesVolume?: number;
  stockLevel?: number;
  cascadeImpact?: 'primary' | 'secondary' | 'tertiary';
  cascadeActive?: boolean;
  financialImpact?: number;
  [key: string]: unknown;
}

const statusColors = {
  healthy: {
    bg: 'bg-green-900/50',
    border: 'border-green-500',
    icon: 'text-green-400',
    glow: '',
  },
  warning: {
    bg: 'bg-yellow-900/50',
    border: 'border-yellow-500',
    icon: 'text-yellow-400',
    glow: '',
  },
  critical: {
    bg: 'bg-red-900/50',
    border: 'border-red-500',
    icon: 'text-red-400',
    glow: 'shadow-red-500/50 shadow-lg',
  },
};

const cascadeStyles = {
  primary: 'animate-pulse ring-2 ring-red-500 ring-offset-2 ring-offset-gray-900',
  secondary: 'animate-pulse ring-2 ring-orange-500 ring-offset-1 ring-offset-gray-900',
  tertiary: 'animate-pulse ring-2 ring-yellow-500',
};

type RetailerNodeType = Node<RetailerNodeData, 'retailer'>;

function RetailerNode({ data, selected }: { data: RetailerNodeData; selected?: boolean }) {
  const colors = statusColors[data.status] || statusColors.healthy;
  const cascadeStyle = data.cascadeActive && data.cascadeImpact ? cascadeStyles[data.cascadeImpact] : '';

  const StatusIcon = () => {
    switch (data.status) {
      case 'critical':
        return <AlertCircle className={`w-4 h-4 ${colors.icon}`} />;
      case 'warning':
        return <AlertTriangle className={`w-4 h-4 ${colors.icon}`} />;
      default:
        return <CheckCircle className={`w-4 h-4 ${colors.icon}`} />;
    }
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[180px]
        ${colors.bg} ${colors.border} ${colors.glow}
        ${selected ? 'ring-2 ring-blue-500' : ''}
        ${cascadeStyle}
        transition-all duration-300
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-gray-800"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${colors.bg}`}>
          <Store className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{data.name}</h3>
          <p className="text-xs text-gray-400 truncate">{data.location}</p>
        </div>
        <StatusIcon />
      </div>

      <div className="space-y-1.5">
        {data.stockLevel !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Stock Level</span>
            <span className="text-white font-medium">{data.stockLevel}%</span>
          </div>
        )}
        {data.salesVolume !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Sales Volume</span>
            <span className="text-white font-medium">{data.salesVolume}%</span>
          </div>
        )}
        {data.riskLevel !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Risk Level</span>
            <span
              className={`font-medium ${
                data.riskLevel > 70
                  ? 'text-red-400'
                  : data.riskLevel > 40
                  ? 'text-yellow-400'
                  : 'text-green-400'
              }`}
            >
              {data.riskLevel}%
            </span>
          </div>
        )}
      </div>

      {data.cascadeActive && data.financialImpact && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-red-400 font-medium">Impact</span>
            <span className="text-red-300 font-bold">
              ${(data.financialImpact / 1000).toFixed(0)}K
            </span>
          </div>
        </div>
      )}

      <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-pink-600 rounded text-[10px] text-white font-medium">
        Retailer
      </div>

      {/* Retailers typically don't have outgoing connections */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500 border-2 border-gray-800 opacity-50"
      />
    </div>
  );
}

export default memo(RetailerNode);
