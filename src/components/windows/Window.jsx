import React from 'react';
import { Rnd } from 'react-rnd';
import { Minus, Square, X } from 'lucide-react';

export default function Window({
  title,
  children,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized,
  zIndex,
  onClick
}) {
  return (
    <Rnd
      default={{
        x: Math.max(20, (window.innerWidth - 750) / 2),
        y: Math.max(40, (window.innerHeight - 500) / 2 - 30),
        width: 750,
        height: 500
      }}
      minWidth={400}
      minHeight={300}
      bounds="parent"
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      style={{ zIndex }}
      onClick={onClick}
      className={`fixed flex flex-col rounded-xl overflow-hidden border border-red-900/40 shadow-2xl bg-zinc-950/98 backdrop-blur-xl pointer-events-auto transition-all duration-150 ${
        isMaximized ? '!top-0 !left-0 !w-screen !h-[calc(100vh-4rem)] !transform-none !rounded-none' : ''
      }`}
    >
      {/* Window Titlebar Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800/80 cursor-move select-none">
        <div className="flex items-center gap-2">
          {/* Akatsuki Red Accent Indicator */}
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
          <span className="font-mono text-xs font-semibold tracking-wider text-zinc-200">
            {title}
          </span>
        </div>

        {/* Window Controls (Minimize, Maximize, Close) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Maximize"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-red-950/80 hover:text-red-400 rounded-md text-zinc-400 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Content Body */}
      <div className="flex-1 overflow-auto p-4 bg-zinc-950 text-zinc-100 select-text">
        {children}
      </div>
    </Rnd>
  );
}