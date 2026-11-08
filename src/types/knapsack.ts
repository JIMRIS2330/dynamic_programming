export type ItemIconType =
  | 'camera'
  | 'gem'
  | 'laptop'
  | 'trophy'
  | 'potion'
  | 'book'
  | 'compass'
  | 'watch';

export interface KnapsackItem {
  id: string;
  name: string;
  weight: number;
  value: number;
  color: string; // Pastel hex
  accentColor: string;
  iconType: ItemIconType;
}

export type DPAction =
  | 'start'
  | 'considering'
  | 'cannot_fit'
  | 'compare'
  | 'take'
  | 'skip'
  | 'optimal_solution';

export interface DPSnapshot {
  stepIndex: number;
  totalSteps: number;
  i: number; // 0..N (0 = no items)
  w: number; // 0..W (capacity)
  currentItem: KnapsackItem | null;
  table: number[][]; // (N+1) x (W+1)
  action: DPAction;
  skipValue: number;
  takeValue: number;
  chosenValue: number;
  explanation: string;
  formulaTex: string;
  comparisonCells: {
    target: [number, number];
    skipCell?: [number, number];
    takeCell?: [number, number];
  };
  packedItemIds: string[]; // Items packed at this sub-problem state
  totalWeightPacked: number;
}

export interface KnapsackPreset {
  id: string;
  name: string;
  description: string;
  capacity: number;
  items: KnapsackItem[];
}
