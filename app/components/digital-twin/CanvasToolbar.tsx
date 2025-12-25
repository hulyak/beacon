'use client';

import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  LayoutGrid,
  Save,
  Upload,
  Download,
  FileJson,
  Activity,
  Factory,
  Building2,
  Warehouse,
  Truck,
  Store,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useDigitalTwin } from './DigitalTwinContext';

type NodeType = 'supplier' | 'manufacturer' | 'warehouse' | 'distributor' | 'retailer';

const nodeOptions: { type: NodeType; icon: React.ElementType; label: string; color: string }[] = [
  { type: 'supplier', icon: Factory, label: 'Supplier', color: 'bg-blue-600' },
  { type: 'manufacturer', icon: Building2, label: 'Manufacturer', color: 'bg-purple-600' },
  { type: 'warehouse', icon: Warehouse, label: 'Warehouse', color: 'bg-cyan-600' },
  { type: 'distributor', icon: Truck, label: 'Distributor', color: 'bg-orange-600' },
  { type: 'retailer', icon: Store, label: 'Retailer', color: 'bg-pink-600' },
];

interface CanvasToolbarProps {
  onOpenMonteCarlo?: () => void;
}

export default function CanvasToolbar({ onOpenMonteCarlo }: CanvasToolbarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const {
    addNode,
    deleteSelectedNode,
    selectedNodeId,
    autoLayout,
    saveToMemory,
    loadFromMemory,
    exportNetwork,
    importNetwork,
  } = useDigitalTwin();

  const handleAddNode = (type: NodeType) => {
    addNode(type);
    setShowAddMenu(false);
  };

  const handleExport = () => {
    const json = exportNetwork();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-chain-network-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const success = importNetwork(json);
      setImportStatus(success ? 'success' : 'error');
      setTimeout(() => setImportStatus('idle'), 2000);
    };
    reader.readAsText(file);

    // Reset input so the same file can be imported again
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Main toolbar */}
      <div className="flex items-center gap-1 bg-gray-800/95 backdrop-blur rounded-lg p-1.5 shadow-lg border border-gray-700">
        {/* Add node button */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className={`
              p-2 rounded-md transition-colors
              ${showAddMenu ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'}
            `}
            title="Add Node"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Add node dropdown */}
          {showAddMenu && (
            <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-2 min-w-[160px] z-50">
              <div className="text-xs text-gray-400 px-2 mb-2">Add Node</div>
              {nodeOptions.map(({ type, icon: IconComponent, label, color }) => {
                const Icon = IconComponent as React.ComponentType<{ className?: string }>;
                return (
                  <button
                    key={type}
                    onClick={() => handleAddNode(type)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className={`p-1 rounded ${color}`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-200">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700" />

        {/* Delete selected */}
        <button
          onClick={deleteSelectedNode}
          disabled={!selectedNodeId}
          className={`
            p-2 rounded-md transition-colors
            ${
              selectedNodeId
                ? 'hover:bg-red-600/20 text-red-400 hover:text-red-300'
                : 'text-gray-600 cursor-not-allowed'
            }
          `}
          title="Delete Selected"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700" />

        {/* Zoom controls */}
        <button
          onClick={() => zoomIn()}
          className="p-2 rounded-md hover:bg-gray-700 text-gray-300 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoomOut()}
          className="p-2 rounded-md hover:bg-gray-700 text-gray-300 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => fitView({ padding: 0.2 })}
          className="p-2 rounded-md hover:bg-gray-700 text-gray-300 transition-colors"
          title="Fit View"
        >
          <Maximize className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700" />

        {/* Auto layout */}
        <button
          onClick={autoLayout}
          className="p-2 rounded-md hover:bg-gray-700 text-gray-300 transition-colors"
          title="Auto Layout"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700" />

        {/* Save/Load Memory */}
        <button
          onClick={saveToMemory}
          className="p-2 rounded-md hover:bg-green-600/20 text-green-400 transition-colors"
          title="Save to Memory"
        >
          <Save className="w-4 h-4" />
        </button>
        <button
          onClick={loadFromMemory}
          className="p-2 rounded-md hover:bg-blue-600/20 text-blue-400 transition-colors"
          title="Load from Memory"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700" />

        {/* Import/Export JSON */}
        <button
          onClick={handleExport}
          className="p-2 rounded-md hover:bg-cyan-600/20 text-cyan-400 transition-colors"
          title="Export to JSON"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleImportClick}
          className={`p-2 rounded-md transition-colors ${
            importStatus === 'success'
              ? 'bg-green-600/20 text-green-400'
              : importStatus === 'error'
              ? 'bg-red-600/20 text-red-400'
              : 'hover:bg-purple-600/20 text-purple-400'
          }`}
          title="Import from JSON"
        >
          <FileJson className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700" />

        {/* Monte Carlo Simulation */}
        <button
          onClick={onOpenMonteCarlo}
          className="p-2 rounded-md hover:bg-emerald-600/20 text-emerald-400 transition-colors"
          title="Monte Carlo Simulation"
        >
          <Activity className="w-4 h-4" />
        </button>
      </div>

      {/* Selection indicator */}
      {selectedNodeId && (
        <div className="bg-blue-900/50 text-blue-200 text-xs px-3 py-1.5 rounded-lg border border-blue-700">
          Selected: <span className="font-mono">{selectedNodeId}</span>
        </div>
      )}
    </div>
  );
}
