import React from 'react';
import { Volume2, VolumeX, Table2, Sliders, RotateCcw } from 'lucide-react';
import { KnapsackPreset } from '../types/knapsack';
import { PRESET_PROBLEMS } from '../utils/dpSolver';

interface HeaderBarProps {
  currentPresetId: string;
  onSelectPreset: (preset: KnapsackPreset) => void;
  onOpenTable: () => void;
  onOpenCustomizer: () => void;
  onReset: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  statusText: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentPresetId,
  onSelectPreset,
  onOpenTable,
  onOpenCustomizer,
  onReset,
  soundEnabled,
  onToggleSound,
  statusText,
}) => {
  return (
    <header className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
      {/* Left: Brand & Algorithm Title */}
      <div className="flex items-center gap-3 bg-white/90 shadow-sm border border-slate-200/80 rounded-xl px-4 py-2.5 pointer-events-auto">
        <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          0/1
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <span>Dynamic Programming Knapsack</span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              3D Interactive
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {statusText}
          </p>
        </div>
      </div>

      {/* Right: Presets & Tools Bar */}
      <div className="flex items-center gap-2 bg-white/90 shadow-sm border border-slate-200/80 rounded-xl p-1.5 pointer-events-auto">
        {/* Preset Selector */}
        <select
          value={currentPresetId}
          onChange={e => {
            const p = PRESET_PROBLEMS.find(item => item.id === e.target.value);
            if (p) onSelectPreset(p);
          }}
          className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {PRESET_PROBLEMS.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} (W={p.capacity}kg)
            </option>
          ))}
        </select>

        {/* 2D DP Table Viewer Button */}
        <button
          onClick={onOpenTable}
          title="View Full 2D DP Matrix & Cells"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition"
        >
          <Table2 className="w-3.5 h-3.5" />
          <span>DP Table</span>
        </button>

        {/* Customizer Button */}
        <button
          onClick={onOpenCustomizer}
          title="Customize items and capacity"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Edit Problem</span>
        </button>

        {/* Audio Mute */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Procedural Audio' : 'Unmute Procedural Audio'}
          className={`p-1.5 rounded-lg border transition ${
            soundEnabled
              ? 'text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100'
              : 'text-slate-400 bg-slate-100 border-slate-200'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          title="Reset Animation"
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
