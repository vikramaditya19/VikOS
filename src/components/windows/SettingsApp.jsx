import React, { useState } from 'react';
import { Sliders, Flame, HardDrive, Shield, Palette, Volume2, Monitor } from 'lucide-react';

export default function SettingsApp() {
  const [activeTab, setActiveTab] = useState('appearance');
  const [embersEnabled, setEmbersEnabled] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [accentColor, setAccentColor] = useState('crimson');

  return (
    <div className="flex h-full gap-4 font-mono text-xs select-none">
      {/* Settings Navigation Sidebar */}
      <div className="w-40 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5 space-y-1">
        <button
          onClick={() => setActiveTab('appearance')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
            activeTab === 'appearance' ? 'bg-red-950/50 border border-red-900/50 text-red-400 font-bold' : 'text-zinc-400 hover:bg-zinc-800/50'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
            activeTab === 'system' ? 'bg-red-950/50 border border-red-900/50 text-red-400 font-bold' : 'text-zinc-400 hover:bg-zinc-800/50'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>System</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
            activeTab === 'security' ? 'bg-red-950/50 border border-red-900/50 text-red-400 font-bold' : 'text-zinc-400 hover:bg-zinc-800/50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Security</span>
        </button>
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 overflow-y-auto space-y-5">
        {activeTab === 'appearance' && (
          <div className="space-y-4">
            <h3 className="text-red-400 font-bold border-b border-zinc-800 pb-2 flex items-center gap-2">
              <Palette className="w-4 h-4" /> Visual Environment
            </h3>

            {/* Particle Effects Toggle */}
            <div className="flex items-center justify-between p-3 bg-black/40 border border-zinc-800 rounded-xl">
              <div className="space-y-0.5">
                <div className="text-zinc-200 font-bold flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-red-500" /> Ambient Embers
                </div>
                <div className="text-[10px] text-zinc-500">Render animated crimson particle canvas</div>
              </div>
              <button
                onClick={() => setEmbersEnabled(!embersEnabled)}
                className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ${
                  embersEnabled ? 'bg-red-600 justify-end' : 'bg-zinc-800 justify-start'
                }`}
              >
                <span className="w-3.5 h-3.5 bg-white rounded-full shadow-md"></span>
              </button>
            </div>

            {/* Accent Theme Selector */}
            <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-zinc-200 font-bold">Accent Color Token</div>
              <div className="flex items-center gap-2 pt-1">
                {['crimson', 'blood-red', 'obsidian'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setAccentColor(color)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] capitalize transition-all ${
                      accentColor === color
                        ? 'border-red-500 bg-red-950/60 text-red-300 shadow-[0_0_10px_rgba(220,38,38,0.3)]'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {color.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-4">
            <h3 className="text-red-400 font-bold border-b border-zinc-800 pb-2 flex items-center gap-2">
              <HardDrive className="w-4 h-4" /> System & Environment Paths
            </h3>

            <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-zinc-300 font-bold">NPM Global Cache Path</div>
              <div className="p-2 bg-zinc-950 border border-zinc-800/80 rounded-lg text-red-400 font-mono text-[11px] select-text">
                D:\ip\npm-cache
              </div>
              <p className="text-[10px] text-zinc-500">Configured to prevent ENOSPC drive space overflow on C:\ partition.</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-black/40 border border-zinc-800 rounded-xl">
              <div className="space-y-0.5">
                <div className="text-zinc-200 font-bold flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-zinc-400" /> Audio Feedback
                </div>
                <div className="text-[10px] text-zinc-500">Terminal command execution clicks</div>
              </div>
              <button
                onClick={() => setAudioFeedback(!audioFeedback)}
                className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ${
                  audioFeedback ? 'bg-red-600 justify-end' : 'bg-zinc-800 justify-start'
                }`}
              >
                <span className="w-3.5 h-3.5 bg-white rounded-full shadow-md"></span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <h3 className="text-red-400 font-bold border-b border-zinc-800 pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Security & Architecture
            </h3>

            <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-1.5 text-zinc-400">
              <p><strong className="text-zinc-200">Architecture:</strong> Zero-Knowledge Client Framework[cite: 1]</p>
              <p><strong className="text-zinc-200">Crypto Engine:</strong> WebCrypto API (`window.crypto.subtle`)[cite: 1]</p>
              <p><strong className="text-zinc-200">Session Guard:</strong> Active</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}