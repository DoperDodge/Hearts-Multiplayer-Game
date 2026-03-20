import React from 'react';

interface PixelButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'gold' | 'green';
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PixelButton({
  children, onClick, variant = 'primary', disabled = false, className = '', size = 'md',
}: PixelButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-[8px]',
    md: 'px-6 py-3 text-[10px]',
    lg: 'px-8 py-4 text-[12px]',
  };

  return (
    <button
      className={`pixel-btn pixel-btn-${variant} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
