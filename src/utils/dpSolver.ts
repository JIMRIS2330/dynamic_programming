import { DPSnapshot, KnapsackItem, KnapsackPreset } from '../types/knapsack';

export const PRESET_PROBLEMS: KnapsackPreset[] = [
  {
    id: 'hiker',
    name: "Hiker's Expedition",
    description: 'Pack essentials for an alpine journey with limited pack weight.',
    capacity: 7,
    items: [
      { id: 'item-1', name: 'Vintage Camera', weight: 1, value: 15, color: '#fed7aa', accentColor: '#ea580c', iconType: 'camera' }, // Pastel orange
      { id: 'item-2', name: 'Mystic Potion', weight: 2, value: 25, color: '#fbcfe8', accentColor: '#db2777', iconType: 'potion' }, // Pastel pink
      { id: 'item-3', name: 'Trail Laptop', weight: 3, value: 40, color: '#bae6fd', accentColor: '#0284c7', iconType: 'laptop' }, // Pastel sky
      { id: 'item-4', name: 'Emerald Geode', weight: 4, value: 50, color: '#a7f3d0', accentColor: '#059669', iconType: 'gem' },    // Pastel mint
    ],
  },
  {
    id: 'heist',
    name: 'Museum Heist',
    description: 'Select the most precious historical artifacts within bag limits.',
    capacity: 8,
    items: [
      { id: 'item-1', name: 'Antique Compass', weight: 2, value: 20, color: '#fef08a', accentColor: '#ca8a04', iconType: 'compass' },
      { id: 'item-2', name: 'Golden Trophy', weight: 3, value: 35, color: '#fde68a', accentColor: '#d97706', iconType: 'trophy' },
      { id: 'item-3', name: 'Rare Grimoire', weight: 4, value: 50, color: '#ddd6fe', accentColor: '#7c3aed', iconType: 'book' },
      { id: 'item-4', name: 'Sapphire Ring', weight: 2, value: 45, color: '#c7d2fe', accentColor: '#4338ca', iconType: 'gem' },
      { id: 'item-5', name: 'Pocket Chrono', weight: 1, value: 22, color: '#fed7aa', accentColor: '#ea580c', iconType: 'watch' },
    ],
  },
  {
    id: 'quick',
    name: 'Quick 3-Item Demo',
    description: 'Fast, compact walk-through of the DP recurrence relation.',
    capacity: 5,
    items: [
      { id: 'item-1', name: 'Field Camera', weight: 2, value: 12, color: '#bae6fd', accentColor: '#0284c7', iconType: 'camera' },
      { id: 'item-2', name: 'Gold Chalice', weight: 1, value: 10, color: '#fef08a', accentColor: '#ca8a04', iconType: 'trophy' },
      { id: 'item-3', name: 'Spell Potion', weight: 3, value: 20, color: '#fbcfe8', accentColor: '#db2777', iconType: 'potion' },
    ],
  },
];

/**
 * Solve 0/1 Knapsack problem and return all step-by-step animation snapshots
 */
export function generateDPSnapshots(items: KnapsackItem[], capacity: number): DPSnapshot[] {
  const N = items.length;
  const W = capacity;
  const snapshots: DPSnapshot[] = [];

  // Initialize DP table with -1 (meaning uncalculated)
  const currentTable: number[][] = Array.from({ length: N + 1 }, () => Array(W + 1).fill(-1));

  // Step 0: Base cases (row 0 = 0 value, col 0 = 0 value)
  for (let w = 0; w <= W; w++) {
    currentTable[0][w] = 0;
  }
  for (let i = 0; i <= N; i++) {
    currentTable[i][0] = 0;
  }

  // Record initial snapshot
  snapshots.push({
    stepIndex: 0,
    totalSteps: 0, // Will populate after building
    i: 0,
    w: 0,
    currentItem: null,
    table: currentTable.map(row => [...row]),
    action: 'start',
    skipValue: 0,
    takeValue: 0,
    chosenValue: 0,
    explanation: 'Initialize base cases: with 0 items or 0 capacity, maximum achievable value is 0.',
    formulaTex: 'dp[0][w] = 0, \\quad dp[i][0] = 0',
    comparisonCells: { target: [0, 0] },
    packedItemIds: [],
    totalWeightPacked: 0,
  });

  // Helper to backtrack packed items at any DP subproblem (i, w)
  const backtrackItemsAt = (table: number[][], subI: number, subW: number): string[] => {
    const packed: string[] = [];
    let curI = subI;
    let curW = subW;
    while (curI > 0 && curW > 0) {
      const item = items[curI - 1];
      if (table[curI][curW] !== -1 && table[curI - 1][curW] !== -1) {
        if (table[curI][curW] !== table[curI - 1][curW]) {
          // Item was included!
          packed.push(item.id);
          curW -= item.weight;
        }
      }
      curI--;
    }
    return packed;
  };

  // Build the table row by row (item by item) and column by column (capacity 1 to W)
  for (let i = 1; i <= N; i++) {
    const item = items[i - 1];

    for (let w = 1; w <= W; w++) {
      const skipVal = currentTable[i - 1][w];

      if (item.weight > w) {
        // Cannot fit
        const chosen = skipVal;
        currentTable[i][w] = chosen;

        const packed = backtrackItemsAt(currentTable, i, w);
        const weightSum = packed.reduce((acc, id) => {
          const it = items.find(x => x.id === id);
          return acc + (it ? it.weight : 0);
        }, 0);

        snapshots.push({
          stepIndex: snapshots.length,
          totalSteps: 0,
          i,
          w,
          currentItem: item,
          table: currentTable.map(row => [...row]),
          action: 'cannot_fit',
          skipValue: skipVal,
          takeValue: -1,
          chosenValue: chosen,
          explanation: `Item #${i} (${item.name}, weight ${item.weight}kg) exceeds current sub-capacity (${w}kg). It cannot fit, so we carry forward dp[${i - 1}][${w}] = ${skipVal}.`,
          formulaTex: `dp[${i}][${w}] = dp[${i - 1}][${w}] = ${chosen}`,
          comparisonCells: {
            target: [i, w],
            skipCell: [i - 1, w],
          },
          packedItemIds: packed,
          totalWeightPacked: weightSum,
        });
      } else {
        // Can fit: compare skip vs take
        const remainderW = w - item.weight;
        const subVal = currentTable[i - 1][remainderW];
        const takeVal = subVal + item.value;
        const chosen = Math.max(skipVal, takeVal);
        currentTable[i][w] = chosen;

        const isTake = takeVal > skipVal;
        const actionType = isTake ? 'take' : 'skip';

        const packed = backtrackItemsAt(currentTable, i, w);
        const weightSum = packed.reduce((acc, id) => {
          const it = items.find(x => x.id === id);
          return acc + (it ? it.weight : 0);
        }, 0);

        const explanation = isTake
          ? `Option 1 (Skip): dp[${i - 1}][${w}] = $${skipVal}. Option 2 (Take): dp[${i - 1}][${remainderW}] ($${subVal}) + $${item.value} = $${takeVal}. Taking ${item.name} is better!`
          : `Option 1 (Skip): dp[${i - 1}][${w}] = $${skipVal}. Option 2 (Take): dp[${i - 1}][${remainderW}] ($${subVal}) + $${item.value} = $${takeVal}. Skipping ${item.name} is equal or better!`;

        snapshots.push({
          stepIndex: snapshots.length,
          totalSteps: 0,
          i,
          w,
          currentItem: item,
          table: currentTable.map(row => [...row]),
          action: actionType,
          skipValue: skipVal,
          takeValue: takeVal,
          chosenValue: chosen,
          explanation,
          formulaTex: `dp[${i}][${w}] = \\max(dp[${i - 1}][${w}], \\, dp[${i - 1}][${remainderW}] + ${item.value}) = ${chosen}`,
          comparisonCells: {
            target: [i, w],
            skipCell: [i - 1, w],
            takeCell: [i - 1, remainderW],
          },
          packedItemIds: packed,
          totalWeightPacked: weightSum,
        });
      }
    }
  }

  // Final Optimal Solution Backtrack snapshot
  const finalPacked = backtrackItemsAt(currentTable, N, W);
  const finalWeight = finalPacked.reduce((acc, id) => {
    const it = items.find(x => x.id === id);
    return acc + (it ? it.weight : 0);
  }, 0);
  const optimalValue = currentTable[N][W];

  const optimalNames = finalPacked
    .map(id => items.find(x => x.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  snapshots.push({
    stepIndex: snapshots.length,
    totalSteps: 0,
    i: N,
    w: W,
    currentItem: null,
    table: currentTable.map(row => [...row]),
    action: 'optimal_solution',
    skipValue: optimalValue,
    takeValue: optimalValue,
    chosenValue: optimalValue,
    explanation: `Optimal solution found! Maximum total value is $${optimalValue} with weight ${finalWeight}/${W}kg. Optimal packed items: [${optimalNames}].`,
    formulaTex: `\\text{Optimal Value} = dp[${N}][${W}] = ${optimalValue}`,
    comparisonCells: {
      target: [N, W],
    },
    packedItemIds: finalPacked,
    totalWeightPacked: finalWeight,
  });

  const total = snapshots.length;
  snapshots.forEach(s => {
    s.totalSteps = total;
  });

  return snapshots;
}
