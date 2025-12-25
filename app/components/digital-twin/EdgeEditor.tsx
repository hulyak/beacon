'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Zap, Clock, AlertOctagon } from 'lucide-react';
import { useDigitalTwin, type SupplyChainEdgeData } from './DigitalTwinContext';

interface EdgeEditorProps {
  edgeId: string;
  onClose: () => void;
}

export default function EdgeEditor({ edgeId, onClose }: EdgeEditorProps) {
  const { edges, updateEdge, deleteEdge } = useDigitalTwin();
  const edge = edges.find((e) => e.id === edgeId);

  const [status, setStatus] = useState<'active' | 'delayed' | 'disrupted'>('active');
  const [flowVolume, setFlowVolume] = useState(100);
  const [leadTime, setLeadTime] = useState(24);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (edge?.data) {
      const data = edge.data as SupplyChainEdgeData;
      setStatus(data.status || 'active');
      setFlowVolume(data.flowVolume || 100);
      setLeadTime(data.leadTime || 24);
    }
  }, [edge]);

  if (!edge) return null;

  const handleSave = () => {
    updateEdge(edgeId, {
      status,
      flowVolume,
      leadTime,
    });
    onClose();
  };

  const handleDelete = () => {
    deleteEdge(edgeId);
    onClose();
  };

  const statusOptions = [
    { value: 'active', label: 'Active', icon: Zap, color: 'text-green-500', bgColor: 'bg-green-500' },
    { value: 'delayed', label: 'Delayed', icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-500' },
    { value: 'disrupted', label: 'Disrupted', icon: AlertOctagon, color: 'text-red-500', bgColor: 'bg-red-500' },
  ] as const;

  return (
    <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 w-80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h3 className="text-white font-semibold text-sm">Edit Connection</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Connection Info */}
      <div className="px-4 py-2 bg-gray-850 border-b border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-mono bg-gray-800 px-2 py-0.5 rounded">{edge.source}</span>
          <span>→</span>
          <span className="font-mono bg-gray-800 px-2 py-0.5 rounded">{edge.target}</span>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        {/* Status */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Connection Status</label>
          <div className="space-y-2">
            {statusOptions.map(({ value, label, icon: Icon, color, bgColor }) => (
              <button
                key={value}
                onClick={() => setStatus(value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  status === value
                    ? 'bg-gray-700 border-2 border-blue-500'
                    : 'bg-gray-800 border border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className={`p-1.5 rounded ${bgColor}/20`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-gray-200 font-medium">{label}</span>
                {status === value && (
                  <span className="ml-auto text-blue-400 text-xs">Selected</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Flow Volume */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Flow Volume ({flowVolume} units/day)
          </label>
          <input
            type="range"
            min="0"
            max="500"
            value={flowVolume}
            onChange={(e) => setFlowVolume(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>0</span>
            <span>250</span>
            <span>500</span>
          </div>
        </div>

        {/* Lead Time */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Lead Time ({leadTime} hours)
          </label>
          <input
            type="range"
            min="1"
            max="168"
            value={leadTime}
            onChange={(e) => setLeadTime(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>1h</span>
            <span>3d</span>
            <span>7d</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
        {!showDeleteConfirm ? (
          <>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:bg-red-900/30 rounded-md text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-gray-400">Remove connection?</span>
            <div className="flex-1" />
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 text-gray-300 hover:bg-gray-700 rounded-md text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
