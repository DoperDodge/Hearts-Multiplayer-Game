import React from 'react';

interface PixelPanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function PixelPanel({ children, className = '', title }: PixelPanelProps) {
  return (
    <div className={`pixel-panel ${className}`}>
      {title && (
        <div className="text-[10px] text-pixel-gold font-pixel mb-3 uppercase tracking-wider">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
