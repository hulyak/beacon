'use client';

// Modern Input Components - Shopify-inspired design
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Search, Eye, EyeOff } from 'lucide-react';

interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'search' | 'password';
  fullWidth?: boolean;
}

export const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(
  ({ 
    className, 
    label, 
    error, 
    helpText, 
    leftIcon, 
    rightIcon, 
    variant = 'default',
    fullWidth = false,
    type,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const inputType = variant === 'password' 
      ? (showPassword ? 'text' : 'password')
      : variant === 'search' 
        ? 'search' 
        : type;

    const finalLeftIcon = variant === 'search' && !leftIcon 
      ? <Search size={16} className="text-gray-400" />
      : leftIcon;

    const finalRightIcon = variant === 'password' 
      ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )
      : rightIcon;

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <div className="relative">
          {finalLeftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {finalLeftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            ref={ref}
            className={cn(
              'block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm transition-all duration-200',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              finalLeftIcon && 'pl-10',
              finalRightIcon && 'pr-10',
              error && 'border-red-300 focus:ring-red-500',
              isFocused && !error && 'border-blue-300',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          
          {finalRightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {finalRightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        {helpText && !error && (
          <p className="text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    );
  }
);

ModernInput.displayName = 'ModernInput';

interface ModernTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const ModernTextarea = forwardRef<HTMLTextAreaElement, ModernTextareaProps>(
  ({ 
    className, 
    label, 
    error, 
    helpText, 
    fullWidth = false,
    resize = 'vertical',
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={cn(
            'block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm transition-all duration-200',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            error && 'border-red-300 focus:ring-red-500',
            isFocused && !error && 'border-blue-300',
            resize === 'none' && 'resize-none',
            resize === 'vertical' && 'resize-y',
            resize === 'horizontal' && 'resize-x',
            resize === 'both' && 'resize',
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        {helpText && !error && (
          <p className="text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    );
  }
);

ModernTextarea.displayName = 'ModernTextarea';

interface ModernSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const ModernSelect = forwardRef<HTMLSelectElement, ModernSelectProps>(
  ({ 
    className, 
    label, 
    error, 
    helpText, 
    fullWidth = false,
    options,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <select
          ref={ref}
          className={cn(
            'block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            error && 'border-red-300 focus:ring-red-500',
            isFocused && !error && 'border-blue-300',
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        {helpText && !error && (
          <p className="text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    );
  }
);

ModernSelect.displayName = 'ModernSelect';