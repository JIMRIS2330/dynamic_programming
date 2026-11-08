import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KnapsackItem, KnapsackPreset, DPSnapshot } from './types/knapsack';
import { PRESET_PROBLEMS, generateDPSnapshots } from './utils/dpSolver';
import { sounds } from './utils/audio';
import { CameraPreset } from './three/KnapsackScene';
import { ThreeCanvas } from './components/ThreeCanvas';
import { HeaderBar } from './components/HeaderBar';
import { ControlDock } from './components/ControlDock';
import { DPTableModal } from './components/DPTableModal';
import { ItemCustomizerModal } from './components/ItemCustomizerModal';

export default function App() {
  // Current Problem Setup
  const [currentPreset, setCurrentPreset] = useState<KnapsackPreset>(PRESET_PROBLEMS[0]);
  const [items, setItems] = useState<KnapsackItem[]>(PRESET_PROBLEMS[0].items);
  const [capacity, setCapacity] = useState<number>(PRESET_PROBLEMS[0].capacity);

  // Dynamic Programming Execution Snapshots
  const [snapshots, setSnapshots] = useState<DPSnapshot[]>(() =>
    generateDPSnapshots(PRESET_PROBLEMS[0].items, PRESET_PROBLEMS[0].capacity)
  );
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Visual & Audio State
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('split');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);

  // Modals
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [isCustomizerModalOpen, setIsCustomizerModalOpen] = useState<boolean>(false);

  // Keep ref for interval
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const currentStepRef = useRef(currentStepIndex);
  currentStepRef.current = currentStepIndex;

  const snapshotsRef = useRef(snapshots);
  snapshotsRef.current = snapshots;

  // Active Snapshot
  const currentSnapshot: DPSnapshot = snapshots[currentStepIndex] || snapshots[0];

  // Re-generate snapshots whenever items or capacity change
  const recomputeProblem = useCallback((newItems: KnapsackItem[], newCap: number) => {
    setIsPlaying(false);
    const newSnapshots = generateDPSnapshots(newItems, newCap);
    setSnapshots(newSnapshots);
    setCurrentStepIndex(0);
  }, []);

  // Preset Selector
  const handleSelectPreset = (preset: KnapsackPreset) => {
    setCurrentPreset(preset);
    setItems(preset.items);
    setCapacity(preset.capacity);
    recomputeProblem(preset.items, preset.capacity);
  };

  // Customizer Save
  const handleCustomizerSave = (newItems: KnapsackItem[], newCap: number) => {
    setItems(newItems);
    setCapacity(newCap);
    recomputeProblem(newItems, newCap);
  };

  // Step Forward
  const stepForward = useCallback(() => {
    const nextIdx = currentStepRef.current + 1;
    if (nextIdx < snapshotsRef.current.length) {
      setCurrentStepIndex(nextIdx);
      const snap = snapshotsRef.current[nextIdx];

      // Audio feedback
      if (snap.action === 'optimal_solution') {
        sounds.playVictory();
      } else if (snap.action === 'take') {
        sounds.playPack();
      } else {
        const maxVal = snap.table[snap.i] ? snap.table[snap.i][snap.w] : 0;
        sounds.playCellChime(snap.chosenValue, 100);
      }
    } else {
      setIsPlaying(false);
    }
  }, []);

  // Step Backward
  const stepBackward = useCallback(() => {
    const prevIdx = currentStepRef.current - 1;
    if (prevIdx >= 0) {
      setCurrentStepIndex(prevIdx);
      sounds.playTick();
    }
  }, []);

  // Seek specific step
  const seekStep = useCallback((step: number) => {
    const clamped = Math.max(0, Math.min(step, snapshotsRef.current.length - 1));
    setCurrentStepIndex(clamped);
    sounds.playTick();
  }, []);

  // Go directly to optimal solution
  const goToOptimal = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(snapshotsRef.current.length - 1);
    sounds.playVictory();
  }, []);

  // Reset to Step 0
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    sounds.playTick();
  }, []);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(200, Math.floor(1200 / playbackSpeed));
    const timer = setInterval(() => {
      if (currentStepRef.current >= snapshotsRef.current.length - 1) {
        setIsPlaying(false);
        clearInterval(timer);
      } else {
        stepForward();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, stepForward]);

  // Keyboard Shortcuts (Space, ArrowRight, ArrowLeft, H, R, T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in modal input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepBackward();
      } else if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed(prev => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === 't' || e.key === 'T') {
        setIsTableModalOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepForward, stepBackward, handleReset]);

  // Click on 3D DP Matrix cell
  const handleCellClicked = (i: number, w: number) => {
    const targetIdx = snapshots.findIndex(s => s.i === i && s.w === w);
    if (targetIdx !== -1) {
      seekStep(targetIdx);
    }
  };

  // Click on 3D Item
  const handleItemClicked = (clickedItem: KnapsackItem) => {
    // Seek to first sub-problem considering this item
    const itemIndex = items.findIndex(it => it.id === clickedItem.id) + 1;
    const targetIdx = snapshots.findIndex(s => s.i === itemIndex && s.w === 1);
    if (targetIdx !== -1) {
      seekStep(targetIdx);
    }
  };

  // Status text for header
  const getStatusText = () => {
    if (currentSnapshot.action === 'optimal_solution') {
      return `Optimal Solution: $${currentSnapshot.chosenValue} (${currentSnapshot.totalWeightPacked}/${capacity} kg packed)`;
    }
    if (currentSnapshot.action === 'start') {
      return `Base Cases Initialized · Capacity: ${capacity} kg · Items: ${items.length}`;
    }
    return `Item #${currentSnapshot.i} (${currentSnapshot.currentItem?.name}) at Sub-capacity w=${currentSnapshot.w} kg`;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-50 select-none">
      {/* 3D Scene Viewport */}
      <ThreeCanvas
        items={items}
        capacity={capacity}
        currentSnapshot={currentSnapshot}
        cameraPreset={cameraPreset}
        onCellClicked={handleCellClicked}
        onItemClicked={handleItemClicked}
      />

      {/* Top Header Bar */}
      <HeaderBar
        currentPresetId={currentPreset.id}
        onSelectPreset={handleSelectPreset}
        onOpenTable={() => setIsTableModalOpen(true)}
        onOpenCustomizer={() => setIsCustomizerModalOpen(true)}
        onReset={handleReset}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          sounds.enabled = !soundEnabled;
          setSoundEnabled(!soundEnabled);
        }}
        statusText={getStatusText()}
      />

      {/* Unified Bottom Control Dock */}
      <ControlDock
        snapshot={currentSnapshot}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(prev => !prev)}
        onStepForward={stepForward}
        onStepBackward={stepBackward}
        onSeekStep={seekStep}
        onGoToOptimal={goToOptimal}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={setPlaybackSpeed}
        currentCamera={cameraPreset}
        onSelectCamera={setCameraPreset}
        isCollapsed={isDockCollapsed}
        onToggleCollapse={() => setIsDockCollapsed(prev => !prev)}
      />

      {/* 2D DP Table Inspection Modal */}
      <DPTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        items={items}
        capacity={capacity}
        currentSnapshot={currentSnapshot}
        snapshots={snapshots}
        onSelectCellStep={stepIdx => {
          seekStep(stepIdx);
          setIsTableModalOpen(false);
        }}
      />

      {/* Problem Customizer Modal */}
      <ItemCustomizerModal
        isOpen={isCustomizerModalOpen}
        onClose={() => setIsCustomizerModalOpen(false)}
        items={items}
        capacity={capacity}
        onSave={handleCustomizerSave}
      />
    </div>
  );
}
