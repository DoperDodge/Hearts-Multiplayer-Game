import React from 'react';

interface PixelInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function PixelInput({ value, onChange, placeholder, maxLength, className = '' }: PixelInputProps) {
  return (
    <input
      className={`pixel-input ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      spellCheck={false}
      autoComplete="off"
    />
  );
}
