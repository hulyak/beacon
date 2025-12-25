'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { ModernButton } from '../ui/modern-button';

interface SimpleVoiceButtonProps {
  className?: string;
}

export function SimpleVoiceButton({ className = '' }: SimpleVoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoiceClick = async () => {
    console.log('Voice button clicked!');
    
    if (isListening) {
      // Stop listening
      setIsListening(false);
      setIsProcessing(true);
      
      // Simulate processing
      setTimeout(() => {
        setIsProcessing(false);
        alert('Voice command processed! (This is a test)');
      }, 2000);
    } else {
      // Start listening
      setIsListening(true);
      console.log('Started listening...');
      
      // Auto-stop after 5 seconds for demo
      setTimeout(() => {
        if (isListening) {
          setIsListening(false);
          setIsProcessing(true);
          
          setTimeout(() => {
            setIsProcessing(false);
            alert('Voice command: "Show me analytics" - Navigation would happen here!');
          }, 1000);
        }
      }, 5000);
    }
  };

  return (
    <div className={className}>
      <ModernButton
        variant={isListening ? 'primary' : 'outline'}
        size="sm"
        onClick={handleVoiceClick}
        disabled={isProcessing}
        icon={
          isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isListening ? (
            <Mic className="w-4 h-4" />
          ) : (
            <MicOff className="w-4 h-4" />
          )
        }
        className={`transition-all duration-200 ${
          isListening ? 'animate-pulse shadow-lg shadow-blue-500/25' : ''
        }`}
      >
        {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Voice'}
      </ModernButton>
    </div>
  );
}