'use client';

import React, { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer, type Position } from '@xyflow/react';

export interface SupplyEdgeData {
  status: 'active' | 'delayed' | 'disrupted';
  flowVolume?: number;
  leadTime?: number;
  [key: string]: unknown;
}

interface SupplyEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: SupplyEdgeData;
  selected?: boolean;
  style?: React.CSSProperties;
}

const statusColors = {
  active: '#22c55e',
  delayed: '#f59e0b',
  disrupted: '#ef4444',
};

const statusDash = {
  active: 'none',
  delayed: '5,5',
  disrupted: '3,3',
};

function SupplyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style,
}: SupplyEdgeProps) {
  const status = data?.status || 'active';
  const flowVolume = data?.flowVolume;
  const leadTime = data?.leadTime;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const strokeColor = (style?.stroke as string) || statusColors[status];
  const strokeDash = statusDash[status];
  const strokeWidth = (style?.strokeWidth as number) || (selected ? 3 : 2);

  return (
    <>
      {/* Main edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDash}
        style={{
          transition: 'stroke 0.3s, stroke-width 0.3s',
        }}
      />

      {/* Animated flow indicator for active edges */}
      {status === 'active' && (
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth + 2}
          strokeOpacity={0.3}
          strokeDasharray="10,10"
          style={{
            animation: 'flowAnimation 1s linear infinite',
          }}
        />
      )}

      {/* Selection highlight */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={strokeWidth + 4}
          strokeOpacity={0.3}
        />
      )}

      {/* Edge label showing flow info */}
      {(flowVolume !== undefined || leadTime !== undefined) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`
              px-2 py-1 rounded text-xs font-medium
              ${
                status === 'disrupted'
                  ? 'bg-red-900/90 text-red-200'
                  : status === 'delayed'
                  ? 'bg-yellow-900/90 text-yellow-200'
                  : 'bg-gray-800/90 text-gray-200'
              }
              border border-gray-600
              shadow-lg
            `}
          >
            {flowVolume !== undefined && (
              <span className="mr-2">
                {flowVolume}
                <span className="opacity-60 ml-0.5">units</span>
              </span>
            )}
            {leadTime !== undefined && (
              <span>
                {leadTime}
                <span className="opacity-60 ml-0.5">h</span>
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Status indicator for disrupted edges */}
      {status === 'disrupted' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -150%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded font-bold animate-pulse"
          >
            DISRUPTED
          </div>
        </EdgeLabelRenderer>
      )}

      <style jsx global>{`
        @keyframes flowAnimation {
          0% {
            stroke-dashoffset: 20;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
}

export default memo(SupplyEdge);
