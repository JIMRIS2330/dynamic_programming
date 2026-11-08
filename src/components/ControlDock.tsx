import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Award,
  Camera,
  Grid3X3,
  Columns,
  Eye,
} from 'lucide-react';
import { CameraPreset } from '../three/KnapsackScene';
import { DPSnapshot } from '../types/knapsack';
import { FormulaCard } from './FormulaCard';

interface ControlDockProps {
  snapshot: DPSnapshot;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSeekStep: (stepIndex: number) => void;
  onGoToOptimal: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  currentCamera: CameraPreset;
  onSelectCamera: (cam: CameraPreset) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  snapshot,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onSeekStep,
  onGoToOptimal,
  playbackSpeed,
  onChangeSpeed,
  currentCamera,
  onSelectCamera,
  isCollapsed,
  onToggleCollapse,
}) => {
  const speeds = [0.5, 1.0, 2.0, 4.0];

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 transition-transform duration-300 ease-in-out pointer-events-auto"
      style={{
        maxWidth: 'min(940px, 94vw)',
        width: '100%',
        transform: isCollapsed ? 'translate(-50%, calc(100% - 32px))' : 'translate(-50%, 0)',
      }}
    >
      {/* Collapse / Expand Tab Handle */}
      <div className="flex justify-center mb-1">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/95 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-full shadow-sm border border-slate-200 transition"
          title="Toggle Zen / Cinema Mode (Hotkey: H)"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Hide Controls (Zen Mode)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Dock Container */}
      <div className="bg-white/95 backdrop-blur-none border border-slate-200/90 rounded-2xl shadow-xl p-3.5 flex flex-col gap-3">
        {/* Live Formula & Recurrence Explanation Banner */}
        <FormulaCard snapshot={snapshot} />

        {/* Step Progress Scrubber Bar */}
        <div className="flex items-center gap-3 px-1">
          <span className="text-xs font-mono font-bold text-slate-500 w-16 text-left">
            Step {snapshot.stepIndex + 1}/{snapshot.totalSteps}
          </span>

          <input
            type="range"
            min={0}
            max={Math.max(0, snapshot.totalSteps - 1)}
            value={snapshot.stepIndex}
            onChange={e => onSeekStep(Number(e.target.value))}
            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
          />

          <button
            onClick={onGoToOptimal}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition shrink-0"
            title="Fast forward to the optimal knapsack solution"
          >
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Optimal</span>
          </button>
        </div>

        {/* Controls Bar: Playback Controls & Camera Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          {/* Playback Controls */}
          <div className="flex items-center gap-1.5">
            {/* Step Back */}
            <button
              onClick={onStepBackward}
              disabled={snapshot.stepIndex === 0}
              title="Previous Step"
              className="p-2 text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-700 rounded-xl transition"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={onTogglePlay}
              title={isPlaying ? 'Pause' : 'Play Automatic Step-by-Step'}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition active:scale-95"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>

            {/* Step Next */}
            <button
              onClick={onStepForward}
              disabled={snapshot.stepIndex >= snapshot.totalSteps - 1}
              title="Next Step"
              className="p-2 text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-700 rounded-xl transition"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 ml-2">
              {speeds.map(s => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition ${
                    playbackSpeed === s
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Camera View Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Camera
            </span>

            <button
              onClick={() => onSelectCamera('split')}
              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                currentCamera === 'split'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Columns className="w-3 h-3 text-slate-500" />
              <span>Split</span>
            </button>

            <button
              onClick={() => onSelectCamera('backpack')}
              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                currentCamera === 'backpack'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Camera className="w-3 h-3 text-slate-500" />
              <span>Backpack</span>
            </button>

            <button
              onClick={() => onSelectCamera('matrix')}
              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                currentCamera === 'matrix'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid3X3 className="w-3 h-3 text-slate-500" />
              <span>3D Matrix</span>
            </button>

            <button
              onClick={() => onSelectCamera('topdown')}
              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                currentCamera === 'topdown'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Top-Down</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
