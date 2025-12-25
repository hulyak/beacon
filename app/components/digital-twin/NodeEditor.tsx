'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useDigitalTwin, type SupplyChainNodeData } from './DigitalTwinContext';

interface NodeEditorProps {
  nodeId: string;
  onClose: () => void;
}

export default function NodeEditor({ nodeId, onClose }: NodeEditorProps) {
  const { nodes, updateNode, deleteNode } = useDigitalTwin();
  const node = nodes.find((n) => n.id === nodeId);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [utilization, setUtilization] = useState(0);
  const [capacity, setCapacity] = useState(0);
  const [riskLevel, setRiskLevel] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (node?.data) {
      const data = node.data as SupplyChainNodeData;
      setName(data.name || '');
      setStatus(data.status || 'healthy');
      setUtilization(data.utilization || 0);
      setCapacity(data.capacity || 0);
      setRiskLevel(data.riskLevel || 0);
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    updateNode(nodeId, {
      name,
      status,
      utilization,
      capacity,
      riskLevel,
    });
    onClose();
  };

  const handleDelete = () => {
    deleteNode(nodeId);
    onClose();
  };

  const statusOptions = [
    { value: 'healthy', label: 'Healthy', icon: CheckCircle, color: 'text-green-500' },
    { value: 'warning', label: 'Warning', icon: Clock, color: 'text-yellow-500' },
    { value: 'critical', label: 'Critical', icon: AlertTriangle, color: 'text-red-500' },
  ] as const;

  return (
    <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 w-80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h3 className="text-white font-semibold text-sm">Edit Node</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="Node name"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Status</label>
          <div className="flex gap-2">
            {statusOptions.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => setStatus(value)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  status === value
                    ? 'bg-gray-700 border-2 border-blue-500'
                    : 'bg-gray-800 border border-gray-600 hover:border-gray-500'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-gray-200">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Utilization */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Utilization ({utilization}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={utilization}
            onChange={(e) => setUtilization(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Capacity ({capacity}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Risk Level */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Risk Level ({riskLevel}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={riskLevel}
            onChange={(e) => setRiskLevel(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
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
            <span className="text-xs text-gray-400">Delete this node?</span>
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
