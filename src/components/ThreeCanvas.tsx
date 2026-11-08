import React, { useEffect, useRef } from 'react';
import { KnapsackSceneManager, CameraPreset } from '../three/KnapsackScene';
import { KnapsackItem, DPSnapshot } from '../types/knapsack';

interface ThreeCanvasProps {
  items: KnapsackItem[];
  capacity: number;
  currentSnapshot: DPSnapshot;
  cameraPreset: CameraPreset;
  onCellClicked?: (i: number, w: number) => void;
  onItemClicked?: (item: KnapsackItem) => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  items,
  capacity,
  currentSnapshot,
  cameraPreset,
  onCellClicked,
  onItemClicked,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<KnapsackSceneManager | null>(null);

  // Initialize Three.js scene once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const manager = new KnapsackSceneManager(mountRef.current);
    sceneManagerRef.current = manager;

    // Attach callbacks
    manager.onCellClicked = (i, w) => {
      if (onCellClicked) onCellClicked(i, w);
    };
    manager.onItemClicked = item => {
      if (onItemClicked) onItemClicked(item);
    };

    manager.initProblem(items, capacity);
    manager.applySnapshot(currentSnapshot);

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update scene problem definition when items or capacity change
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.initProblem(items, capacity);
      sceneManagerRef.current.applySnapshot(currentSnapshot);
    }
  }, [items, capacity]);

  // Update scene when DP snapshot changes (step forward/back, seek)
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.applySnapshot(currentSnapshot);
    }
  }, [currentSnapshot]);

  // Update camera view preset
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraPreset(cameraPreset);
    }
  }, [cameraPreset]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      style={{ touchAction: 'none' }}
    />
  );
};
