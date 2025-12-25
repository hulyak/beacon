'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useVoiceAgent } from '@/app/hooks/useVoiceAgent';
import { useTextToSpeech } from '@/app/hooks/useTextToSpeech';
import { useDigitalTwin } from './DigitalTwinContext';
import { ELEVENLABS_CONFIG } from '@/lib/elevenlabs';

interface VoiceCommandResult {
  success: boolean;
  message: string;
  action?: string;
}

interface VoiceCommandHandlerProps {
  onCommand?: (command: string, result: VoiceCommandResult) => void;
}

// Voice command patterns for digital twin
const COMMAND_PATTERNS = {
  // Scanning commands
  scan: /\b(scan|check|analyze|find)\b.*\b(anomal|issue|problem|risk|warning|critical)\b/i,

  // Simulation commands
  simulate: /\b(run|start|simulate|execute)\b.*\b(scenario|simulation|test)\b/i,
  portClosure: /\bport\s*(closure|closed|shutdown)\b/i,
  supplierFailure: /\bsupplier\s*(fail|failure|down|offline)\b/i,
  demandSurge: /\bdemand\s*(surge|spike|increase)\b/i,

  // Layout commands
  layout: /\b(auto|arrange|organize|layout)\b.*\b(nodes?|network|graph)\b/i,
  fitView: /\b(fit|center|zoom\s*to\s*fit|show\s*all)\b/i,

  // Node commands
  addNode: /\b(add|create|new)\b.*\b(node|supplier|manufacturer|warehouse|distributor|retailer)\b/i,
  deleteNode: /\b(delete|remove)\b.*\b(selected|node)\b/i,

  // Monte Carlo
  monteCarlo: /\b(monte\s*carlo|probability|risk\s*simulation)\b/i,

  // Export/Import
  export: /\b(export|download|save)\b.*\b(network|json|data)\b/i,
  import: /\b(import|load|upload)\b.*\b(network|json|data)\b/i,

  // Status queries
  status: /\b(what|show|tell|get)\b.*\b(status|state|health)\b/i,
  highRisk: /\b(high|critical)\s*risk\b.*\b(nodes?)\b/i,

  // Mitigation
  mitigation: /\b(generate|create|suggest)\b.*\b(mitigation|strategy|plan)\b/i,

  // ESG
  esg: /\b(esg|environmental|sustainability|impact)\b/i,
};

export default function VoiceCommandHandler({ onCommand }: VoiceCommandHandlerProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [commandResult, setCommandResult] = useState<VoiceCommandResult | null>(null);

  const {
    messages,
    status: voiceStatus,
    startConversation,
    endConversation,
    error: voiceError
  } = useVoiceAgent(ELEVENLABS_CONFIG.agentId);

  const { speak, stop: stopSpeaking, status: ttsStatus } = useTextToSpeech();

  const {
    nodes,
    edges,
    autoLayout,
    addNode,
    deleteSelectedNode,
    selectedNodeId,
    exportNetwork,
    startCascadeAnimation,
    updateNode,
  } = useDigitalTwin();

  // Process voice commands
  const processCommand = useCallback(async (transcript: string): Promise<VoiceCommandResult> => {
    const lowerTranscript = transcript.toLowerCase();

    // Scan for anomalies
    if (COMMAND_PATTERNS.scan.test(lowerTranscript)) {
      const criticalNodes = nodes.filter(n => n.data?.status === 'critical');
      const warningNodes = nodes.filter(n => n.data?.status === 'warning');
      const highRiskNodes = nodes.filter(n => (n.data?.riskLevel || 0) > 60);

      const issues: string[] = [];
      if (criticalNodes.length > 0) issues.push(`${criticalNodes.length} critical nodes`);
      if (warningNodes.length > 0) issues.push(`${warningNodes.length} warning nodes`);
      if (highRiskNodes.length > 0) issues.push(`${highRiskNodes.length} high risk nodes`);

      const message = issues.length > 0
        ? `Found ${issues.join(', ')}. Would you like me to show details?`
        : 'No anomalies detected. Your supply chain is healthy.';

      return { success: true, message, action: 'scan' };
    }

    // Run port closure scenario
    if (COMMAND_PATTERNS.portClosure.test(lowerTranscript)) {
      const epicenter = nodes.find(n => n.data?.region === 'asia') || nodes[0];
      if (epicenter) {
        const cascadeSteps = nodes
          .filter(n => n.id !== epicenter.id)
          .slice(0, 4)
          .map((n, i) => ({
            step: i + 1,
            nodeId: n.id,
            nodeName: n.data?.name || n.id,
            impactType: (i === 0 ? 'primary' : i < 2 ? 'secondary' : 'tertiary') as 'primary' | 'secondary' | 'tertiary',
            timestamp: (i + 1) * 500,
            financialImpact: Math.round(Math.random() * 500000 + 200000),
            delayHours: Math.round(Math.random() * 72 + 24),
            description: `Port closure impact on ${n.data?.name || n.id}`,
          }));

        startCascadeAnimation({
          epicenterNodeId: epicenter.id,
          steps: cascadeSteps,
          currentStep: 0,
          totalFinancialImpact: cascadeSteps.reduce((a, b) => a + b.financialImpact, 0),
          recoveryTimeHours: 96,
        });

        return {
          success: true,
          message: `Running port closure simulation. ${cascadeSteps.length} nodes will be affected. Estimated impact: $${(cascadeSteps.reduce((a, b) => a + b.financialImpact, 0) / 1000000).toFixed(1)} million.`,
          action: 'simulate_port_closure'
        };
      }
    }

    // Run supplier failure scenario
    if (COMMAND_PATTERNS.supplierFailure.test(lowerTranscript)) {
      const supplier = nodes.find(n => n.type === 'supplier') || nodes[0];
      if (supplier) {
        updateNode(supplier.id, { status: 'critical', riskLevel: 85 });
        return {
          success: true,
          message: `Simulating supplier failure at ${supplier.data?.name || 'primary supplier'}. Risk level increased to critical.`,
          action: 'simulate_supplier_failure'
        };
      }
    }

    // Auto layout
    if (COMMAND_PATTERNS.layout.test(lowerTranscript)) {
      autoLayout();
      return { success: true, message: 'Network layout optimized.', action: 'auto_layout' };
    }

    // Fit view
    if (COMMAND_PATTERNS.fitView.test(lowerTranscript)) {
      return { success: true, message: 'Adjusting view to show all nodes.', action: 'fit_view' };
    }

    // Add node
    if (COMMAND_PATTERNS.addNode.test(lowerTranscript)) {
      let nodeType: 'supplier' | 'manufacturer' | 'warehouse' | 'distributor' | 'retailer' = 'warehouse';
      if (/supplier/i.test(lowerTranscript)) nodeType = 'supplier';
      else if (/manufacturer/i.test(lowerTranscript)) nodeType = 'manufacturer';
      else if (/distributor/i.test(lowerTranscript)) nodeType = 'distributor';
      else if (/retailer/i.test(lowerTranscript)) nodeType = 'retailer';

      addNode(nodeType);
      return { success: true, message: `Added new ${nodeType} node to the network.`, action: 'add_node' };
    }

    // Delete node
    if (COMMAND_PATTERNS.deleteNode.test(lowerTranscript)) {
      if (selectedNodeId) {
        deleteSelectedNode();
        return { success: true, message: 'Selected node deleted.', action: 'delete_node' };
      }
      return { success: false, message: 'No node selected. Please select a node first.', action: 'delete_node' };
    }

    // Monte Carlo
    if (COMMAND_PATTERNS.monteCarlo.test(lowerTranscript)) {
      return {
        success: true,
        message: 'Opening Monte Carlo simulation panel. You can configure iterations and run risk analysis.',
        action: 'monte_carlo'
      };
    }

    // Export
    if (COMMAND_PATTERNS.export.test(lowerTranscript)) {
      const json = exportNetwork();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supply-chain-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, message: 'Network exported to JSON file.', action: 'export' };
    }

    // Status query
    if (COMMAND_PATTERNS.status.test(lowerTranscript)) {
      const healthy = nodes.filter(n => n.data?.status === 'healthy').length;
      const warning = nodes.filter(n => n.data?.status === 'warning').length;
      const critical = nodes.filter(n => n.data?.status === 'critical').length;

      return {
        success: true,
        message: `Network status: ${healthy} healthy nodes, ${warning} warnings, ${critical} critical. ${edges.length} active connections.`,
        action: 'status'
      };
    }

    // High risk nodes
    if (COMMAND_PATTERNS.highRisk.test(lowerTranscript)) {
      const highRisk = nodes.filter(n => (n.data?.riskLevel || 0) > 60);
      if (highRisk.length > 0) {
        const names = highRisk.map(n => n.data?.name || n.id).join(', ');
        return {
          success: true,
          message: `Found ${highRisk.length} high risk nodes: ${names}`,
          action: 'high_risk'
        };
      }
      return { success: true, message: 'No high risk nodes detected.', action: 'high_risk' };
    }

    // Mitigation
    if (COMMAND_PATTERNS.mitigation.test(lowerTranscript)) {
      const strategies = [
        'Diversify supplier base across multiple regions',
        'Increase safety stock by 15-20%',
        'Establish backup logistics routes',
        'Implement real-time monitoring alerts',
      ];
      return {
        success: true,
        message: `Recommended mitigation strategies: ${strategies.slice(0, 2).join('. ')}.`,
        action: 'mitigation'
      };
    }

    // ESG impact
    if (COMMAND_PATTERNS.esg.test(lowerTranscript)) {
      const healthyPercent = Math.round((nodes.filter(n => n.data?.status === 'healthy').length / nodes.length) * 100);
      return {
        success: true,
        message: `ESG score: ${healthyPercent} out of 100. Environmental compliance is ${healthyPercent > 70 ? 'good' : 'needs improvement'}.`,
        action: 'esg'
      };
    }

    // Command not recognized
    return {
      success: false,
      message: "I didn't understand that command. Try saying 'scan for anomalies', 'run port closure scenario', or 'show network status'.",
      action: 'unknown'
    };
  }, [nodes, edges, autoLayout, addNode, deleteSelectedNode, selectedNodeId, exportNetwork, startCascadeAnimation, updateNode]);

  // Handle new messages from voice agent
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user' && lastMessage.content !== lastCommand) {
      setLastCommand(lastMessage.content);

      processCommand(lastMessage.content).then(result => {
        setCommandResult(result);
        onCommand?.(lastMessage.content, result);

        // Speak the result
        if (result.message) {
          speak(result.message);
        }
      });
    }
  }, [messages, lastCommand, processCommand, onCommand, speak]);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      await endConversation();
      setIsListening(false);
    } else {
      await startConversation();
      setIsListening(true);
    }
  }, [isListening, startConversation, endConversation]);

  const toggleSpeaking = useCallback(() => {
    if (ttsStatus === 'speaking') {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
    }
  }, [ttsStatus, stopSpeaking]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isListening ? 'bg-red-100' : 'bg-violet-100'}`}>
            {isListening ? (
              <Mic className="w-4 h-4 text-red-600 animate-pulse" />
            ) : (
              <MicOff className="w-4 h-4 text-violet-600" />
            )}
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold text-sm">Voice Commands</h3>
            <p className="text-gray-500 text-xs">
              {isListening ? 'Listening...' : 'Click mic to start'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Voice toggle */}
          <button
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-all ${
              isListening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
            }`}
          >
            {voiceStatus === 'connecting' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isListening ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>

          {/* TTS toggle */}
          <button
            onClick={toggleSpeaking}
            className={`p-2 rounded-lg transition-all ${
              isSpeaking
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isSpeaking ? 'Mute responses' : 'Enable voice responses'}
          >
            {isSpeaking ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Command Result */}
      <AnimatePresence mode="wait">
        {commandResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`px-4 py-3 border-b ${
              commandResult.success
                ? 'bg-green-50 border-green-100'
                : 'bg-yellow-50 border-yellow-100'
            }`}
          >
            <div className="flex items-start gap-2">
              {commandResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              )}
              <div>
                <p className={`text-sm ${commandResult.success ? 'text-green-700' : 'text-yellow-700'}`}>
                  {commandResult.message}
                </p>
                {lastCommand && (
                  <p className="text-xs text-gray-500 mt-1">
                    Command: &ldquo;{lastCommand}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Error */}
      {voiceError && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-700">{voiceError.message}</p>
        </div>
      )}

      {/* Example Commands */}
      <div className="p-4">
        <h4 className="text-xs font-medium text-gray-500 mb-2">TRY SAYING</h4>
        <div className="flex flex-wrap gap-2">
          {[
            'Scan for anomalies',
            'Run port closure scenario',
            'Show network status',
            'Add new supplier',
            'Auto layout nodes',
          ].map((cmd) => (
            <span
              key={cmd}
              className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 border border-gray-200"
            >
              &ldquo;{cmd}&rdquo;
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
