import React from 'react';

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-3 h-3 bg-pixel-accent"
            style={{
              animation: 'bounceGentle 0.6s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <div className="text-[8px] font-pixel text-pixel-muted">{message}</div>
    </div>
  );
}
