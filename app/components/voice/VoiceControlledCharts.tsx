'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { enhancedVoiceAgent } from '@/lib/voice/enhanced-voice-agent';
import { ttsService } from '@/lib/elevenlabs-tts';

// Voice-Controlled Charts Component
// Requirement 6.3: Describe charts, graphs, and visualizations in clear natural language
// Requirement 6.4: Provide additional detail and alternative explanations for complex concepts
// Requirement 6.5: Seamlessly transition between analysis types

interface VoiceControlledChartsProps {
  chartData?: any;
  chartType?: 'line' | 'bar' | 'pie' | 'network' | 'heatmap';
  title?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  lastCommand: string;
  response: string;
  error: string | null;
}

const VoiceControlledCharts: React.FC<VoiceControlledChartsProps> = ({
  chartData,
  chartType = 'line',
  title = 'Chart',
  onNavigate,
  className = '',
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    lastCommand: '',
    response: '',
    error: null
  });

  const [sessionId] = useState(() => `session-${Date.now()}`);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setVoiceState(prev => ({ ...prev, isListening: true, error: null }));
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0].transcript;
        setVoiceState(prev => ({ 
          ...prev, 
          isListening: false, 
          isProcessing: true,
          lastCommand: transcript 
        }));

        try {
          await processVoiceCommand(transcript);
        } catch (error) {
          setVoiceState(prev => ({ 
            ...prev, 
            isProcessing: false,
            error: 'Failed to process voice command' 
          }));
        }
      };

      recognition.onerror = (event) => {
        setVoiceState(prev => ({ 
          ...prev, 
          isListening: false, 
          isProcessing: false,
          error: `Speech recognition error: ${event.error}` 
        }));
      };

      recognition.onend = () => {
        setVoiceState(prev => ({ ...prev, isListening: false }));
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const processVoiceCommand = async (transcript: string) => {
    try {
      // Check for chart-specific commands first
      const chartCommand = parseChartCommand(transcript);
      if (chartCommand) {
        const response = await handleChartCommand(chartCommand);
        setVoiceState(prev => ({ 
          ...prev, 
          isProcessing: false,
          response: response.text 
        }));
        
        if (response.speak) {
          await speakResponse(response.text);
        }
        return;
      }

      // Use enhanced voice agent for general commands
      const result = await enhancedVoiceAgent.processVoiceCommand(transcript, sessionId);
      
      setVoiceState(prev => ({ 
        ...prev, 
        isProcessing: false,
        response: result.spokenResponse 
      }));

      // Handle navigation if required
      if (result.actionRequired?.type === 'navigate' && onNavigate) {
        onNavigate(result.actionRequired.target);
      }

      // Speak the response
      await speakResponse(result.spokenResponse);

    } catch (error) {
      console.error('Voice command processing error:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: 'Failed to process command' 
      }));
    }
  };

  const parseChartCommand = (transcript: string): string | null => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Chart description commands
    if (lowerTranscript.includes('describe') || lowerTranscript.includes('explain')) {
      return 'describe';
    }
    
    // Data point commands
    if (lowerTranscript.includes('highest') || lowerTranscript.includes('maximum')) {
      return 'highest';
    }
    
    if (lowerTranscript.includes('lowest') || lowerTranscript.includes('minimum')) {
      return 'lowest';
    }
    
    // Trend commands
    if (lowerTranscript.includes('trend') || lowerTranscript.includes('pattern')) {
      return 'trend';
    }
    
    // Summary commands
    if (lowerTranscript.includes('summary') || lowerTranscript.includes('overview')) {
      return 'summary';
    }

    // Zoom commands
    if (lowerTranscript.includes('zoom in') || lowerTranscript.includes('focus on')) {
      return 'zoom_in';
    }

    if (lowerTranscript.includes('zoom out') || lowerTranscript.includes('show all')) {
      return 'zoom_out';
    }

    return null;
  };

  const handleChartCommand = async (command: string): Promise<{ text: string; speak: boolean }> => {
    switch (command) {
      case 'describe':
        return {
          text: generateChartDescription(),
          speak: true
        };
      
      case 'highest':
        return {
          text: findHighestDataPoint(),
          speak: true
        };
      
      case 'lowest':
        return {
          text: findLowestDataPoint(),
          speak: true
        };
      
      case 'trend':
        return {
          text: describeTrend(),
          speak: true
        };
      
      case 'summary':
        return {
          text: generateSummary(),
          speak: true
        };

      case 'zoom_in':
        // Trigger zoom functionality
        return {
          text: "Zooming in on the chart for a closer view.",
          speak: true
        };

      case 'zoom_out':
        // Trigger zoom out functionality
        return {
          text: "Zooming out to show the full chart.",
          speak: true
        };
      
      default:
        return {
          text: "I didn't understand that chart command. You can ask me to describe, find the highest or lowest values, explain trends, or provide a summary.",
          speak: true
        };
    }
  };

  const generateChartDescription = (): string => {
    switch (chartType) {
      case 'line':
        return `This is a line chart titled "${title}". It shows data trends over time with connected data points. The chart displays ${getDataPointCount()} data points with values ranging from ${getMinValue()} to ${getMaxValue()}.`;
      
      case 'bar':
        return `This is a bar chart titled "${title}". It compares different categories using rectangular bars. There are ${getDataPointCount()} categories shown, with the highest bar representing ${getMaxValue()} and the lowest representing ${getMinValue()}.`;
      
      case 'pie':
        return `This is a pie chart titled "${title}". It shows the proportional breakdown of different segments. The chart has ${getDataPointCount()} segments, with the largest segment representing ${getLargestSegment()}% of the total.`;
      
      case 'network':
        return `This is a network diagram titled "${title}". It shows interconnected nodes and relationships. The network contains ${getNodeCount()} nodes and ${getLinkCount()} connections, illustrating the supply chain topology.`;
      
      case 'heatmap':
        return `This is a heatmap titled "${title}". It uses color intensity to represent data values across a grid. Darker colors indicate higher values, while lighter colors represent lower values.`;
      
      default:
        return `This chart titled "${title}" displays your data in a visual format to help you understand patterns and trends.`;
    }
  };

  const findHighestDataPoint = (): string => {
    // Mock implementation - in real app, would analyze actual chart data
    return `The highest value in this chart is 94.5%, which represents the peak performance in delivery metrics during the third quarter.`;
  };

  const findLowestDataPoint = (): string => {
    // Mock implementation - in real app, would analyze actual chart data
    return `The lowest value shown is 23.1%, which corresponds to the risk level indicator, suggesting relatively low supply chain risk.`;
  };

  const describeTrend = (): string => {
    switch (chartType) {
      case 'line':
        return `The overall trend shows an upward trajectory with a 12% increase over the displayed time period. There's a notable spike in the middle section followed by stabilization.`;
      
      case 'bar':
        return `The data shows varying performance across categories, with the first three categories performing above average and the last two showing room for improvement.`;
      
      default:
        return `The data pattern indicates positive performance with some areas requiring attention for optimization.`;
    }
  };

  const generateSummary = (): string => {
    return `In summary, this ${chartType} chart shows ${getDataPointCount()} data points with an average value of ${getAverageValue()}. The data indicates strong performance in key metrics with opportunities for improvement in specific areas. The trend is generally positive with ${getTrendDirection()} movement over the time period.`;
  };

  // Helper functions for data analysis (mock implementations)
  const getDataPointCount = (): number => chartData?.length || 6;
  const getMinValue = (): string => "23.1";
  const getMaxValue = (): string => "94.5";
  const getAverageValue = (): string => "67.3";
  const getLargestSegment = (): string => "35";
  const getNodeCount = (): number => 12;
  const getLinkCount = (): number => 18;
  const getTrendDirection = (): string => "upward";

  const startListening = () => {
    if (recognitionRef.current && !voiceState.isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && voiceState.isListening) {
      recognitionRef.current.abort();
    }
  };

  const speakResponse = async (text: string) => {
    try {
      setVoiceState(prev => ({ ...prev, isSpeaking: true }));
      await ttsService.speak(text);
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    } catch (error) {
      console.error('TTS error:', error);
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    }
  };

  const stopSpeaking = () => {
    ttsService.stop();
    setVoiceState(prev => ({ ...prev, isSpeaking: false }));
  };

  if (!isSupported) {
    return (
      <Card className={`border-amber-200 bg-amber-50 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center text-amber-700">
            <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Voice control is not supported in this browser.</p>
            <p className="text-xs mt-1">Try using Chrome, Edge, or Safari for voice features.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center space-x-2">
          <Mic className="h-4 w-4 text-blue-600" />
          <span>Voice Control</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Control Buttons */}
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={voiceState.isListening ? stopListening : startListening}
            disabled={voiceState.isProcessing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              voiceState.isListening
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            } ${voiceState.isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {voiceState.isListening ? (
              <>
                <MicOff className="h-4 w-4" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>Listen</span>
              </>
            )}
          </button>

          <button
            onClick={voiceState.isSpeaking ? stopSpeaking : () => speakResponse(voiceState.response)}
            disabled={!voiceState.response || voiceState.isProcessing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              voiceState.isSpeaking
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            } ${(!voiceState.response || voiceState.isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {voiceState.isSpeaking ? (
              <>
                <VolumeX className="h-4 w-4" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                <span>Speak</span>
              </>
            )}
          </button>
        </div>

        {/* Status Indicators */}
        <div className="space-y-2">
          {voiceState.isListening && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Listening...</span>
            </div>
          )}

          {voiceState.isProcessing && (
            <div className="flex items-center justify-center space-x-2 text-amber-600">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Processing...</span>
            </div>
          )}

          {voiceState.isSpeaking && (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Speaking...</span>
            </div>
          )}
        </div>

        {/* Last Command */}
        {voiceState.lastCommand && (
          <div className="p-3 bg-white rounded-lg border">
            <div className="text-xs text-gray-500 mb-1">Last Command:</div>
            <div className="text-sm font-medium">"{voiceState.lastCommand}"</div>
          </div>
        )}

        {/* Response */}
        {voiceState.response && (
          <div className="p-3 bg-white rounded-lg border">
            <div className="text-xs text-gray-500 mb-1">Response:</div>
            <div className="text-sm">{voiceState.response}</div>
          </div>
        )}

        {/* Error */}
        {voiceState.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-xs text-red-500 mb-1">Error:</div>
            <div className="text-sm text-red-700">{voiceState.error}</div>
          </div>
        )}

        {/* Voice Commands Help */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs font-medium text-gray-700 mb-2">Voice Commands:</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• "Describe this chart"</div>
            <div>• "What's the highest value?"</div>
            <div>• "Show me the trend"</div>
            <div>• "Give me a summary"</div>
            <div>• "Zoom in" / "Zoom out"</div>
            <div>• "Go to analytics"</div>
            <div>• "Show ROI optimization"</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceControlledCharts;