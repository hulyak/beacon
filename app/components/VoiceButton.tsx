'use client';

import { ButtonHTMLAttributes, KeyboardEvent } from 'react';
import type { ConnectionStatus } from './VoiceAgent';

export interface VoiceButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  status: ConnectionStatus;
  onClick: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function VoiceButton({
  status,
  onClick,
  disabled = false,
  size = 'large',
  className = '',
  ...props
}: VoiceButtonProps): React.JSX.Element {
  
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onClick();
    }
  };

  // Size classes
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
  };

  // Base classes
  const baseClasses = `
    ${sizeClasses[size]}
    rounded-full
    border-2
    flex
    items-center
    justify-center
    transition-all
    duration-300
    ease-in-out
    focus:outline-none
    focus:ring-4
    focus:ring-opacity-50
    disabled:opacity-50
    disabled:cursor-not-allowed
    cursor-pointer
    relative
    overflow-hidden
  `;

  // Status-specific classes and animations
  const getStatusClasses = () => {
    switch (status) {
      case 'idle':
      case 'disconnected':
        return `
          bg-blue-600
          hover:bg-blue-700
          border-blue-500
          text-white
          focus:ring-blue-300
          shadow-lg
          hover:shadow-xl
        `;
      
      case 'connecting':
        return `
          bg-blue-600
          border-blue-500
          text-white
          focus:ring-blue-300
          shadow-lg
          animate-pulse
        `;
      
      case 'connected':
        return `
          bg-green-600
          hover:bg-green-700
          border-green-500
          text-white
          focus:ring-green-300
          shadow-lg
          hover:shadow-xl
        `;
      
      case 'listening':
        return `
          bg-green-500
          border-green-400
          text-white
          focus:ring-green-300
          shadow-lg
          animate-pulse
        `;
      
      case 'speaking':
        return `
          bg-emerald-600
          border-emerald-500
          text-white
          focus:ring-emerald-300
          shadow-lg
          animate-pulse
        `;
      
      default:
        return `
          bg-red-600
          border-red-500
          text-white
          focus:ring-red-300
          shadow-lg
        `;
    }
  };

  // Icon based on status
  const getIcon = () => {
    switch (status) {
      case 'idle':
      case 'disconnected':
      case 'connecting':
        return (
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 1 1 2 0Z" />
            <path d="M12 18.5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Z" />
          </svg>
        );
      
      case 'connected':
        return (
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 1 1 2 0Z" />
            <path d="M12 18.5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Z" />
          </svg>
        );
      
      case 'listening':
        return (
          <div className="relative">
            <svg
              className="w-8 h-8"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 1 1 2 0Z" />
              <path d="M12 18.5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Z" />
            </svg>
            {/* Sound waves animation */}
            <div className="absolute -inset-4 opacity-75">
              <div className="absolute inset-0 rounded-full border-2 border-current animate-ping"></div>
              <div className="absolute inset-2 rounded-full border border-current animate-ping animation-delay-75"></div>
              <div className="absolute inset-4 rounded-full border border-current animate-ping animation-delay-150"></div>
            </div>
          </div>
        );
      
      case 'speaking':
        return (
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        );
      
      default:
        return (
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
    }
  };

  // ARIA label based on status
  const getAriaLabel = () => {
    switch (status) {
      case 'idle':
      case 'disconnected':
        return 'Click to start voice conversation';
      case 'connecting':
        return 'Connecting to voice service...';
      case 'connected':
        return 'Connected. Click to start speaking';
      case 'listening':
        return 'Listening... Speak now';
      case 'speaking':
        return 'AI is speaking...';
      default:
        return 'Voice service error';
    }
  };

  // Status text for screen readers
  const getStatusText = () => {
    switch (status) {
      case 'idle':
      case 'disconnected':
        return 'Voice service disconnected';
      case 'connecting':
        return 'Connecting to voice service';
      case 'connected':
        return 'Voice service connected';
      case 'listening':
        return 'Listening for your voice';
      case 'speaking':
        return 'AI assistant is speaking';
      default:
        return 'Voice service error';
    }
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${getStatusClasses()} ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={getAriaLabel()}
      aria-describedby="voice-status"
      role="button"
      tabIndex={0}
      {...props}
    >
      {getIcon()}
      
      {/* Screen reader status */}
      <span id="voice-status" className="sr-only">
        {getStatusText()}
      </span>
      
      {/* Visual status indicator */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className={`
          w-3 h-3 rounded-full
          ${status === 'connected' ? 'bg-green-400' : ''}
          ${status === 'listening' ? 'bg-green-400 animate-pulse' : ''}
          ${status === 'speaking' ? 'bg-emerald-400 animate-pulse' : ''}
          ${status === 'connecting' ? 'bg-blue-400 animate-pulse' : ''}
          ${status === 'disconnected' ? 'bg-gray-400' : ''}
        `} />
      </div>
    </button>
  );
}

// Add custom CSS for animation delays (you might want to add this to globals.css)
export const VoiceButtonStyles = `
  @keyframes ping {
    75%, 100% {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  .animation-delay-75 {
    animation-delay: 75ms;
  }
  
  .animation-delay-150 {
    animation-delay: 150ms;
  }
`;