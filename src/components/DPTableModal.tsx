import React from 'react';
import { X, ExternalLink, HelpCircle } from 'lucide-react';
import { KnapsackItem, DPSnapshot } from '../types/knapsack';

interface DPTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: KnapsackItem[];
  capacity: number;
  currentSnapshot: DPSnapshot;
  snapshots: DPSnapshot[];
  onSelectCellStep: (stepIndex: number) => void;
}

export const DPTableModal: React.FC<DPTableModalProps> = ({
  isOpen,
  onClose,
  items,
  capacity,
  currentSnapshot,
  snapshots,
  onSelectCellStep,
}) => {
  if (!isOpen) return null;

  const currentTable = currentSnapshot.table;
  const activeI = currentSnapshot.i;
  const activeW = currentSnapshot.w;

  const finalSnapshot = snapshots[snapshots.length - 1];
  const optimalItemIds = new Set(finalSnapshot?.packedItemIds || []);

  // Find step index corresponding to (i, w)
  const getStepForCell = (i: number, w: number): number => {
    const match = snapshots.findIndex(s => s.i === i && s.w === w);
    return match !== -1 ? match : 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>Dynamic Programming Knapsack Table</span>
              <span className="text-xs font-normal text-slate-500">
                (Click any cell to inspect & seek 3D scene)
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              dp[i][w] represents the maximum value achievable considering items 1..i within weight capacity w.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-2.5 bg-slate-50/40 border-b border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-200 border border-amber-300 inline-block" />
            <span>Active Target Cell dp[i][w]</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-200 border border-emerald-300 inline-block" />
            <span>Optimal Solution Backtrack</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-sky-100 border border-sky-200 inline-block" />
            <span>Calculated Subproblem</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-200 inline-block" />
            <span>Pending / Uncomputed</span>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse text-center">
              <thead>
                <tr>
                  <th className="p-2 border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 sticky left-0 z-10">
                    Item (i) \ Cap (w)
                  </th>
                  {Array.from({ length: capacity + 1 }).map((_, w) => (
                    <th
                      key={w}
                      className={`p-2 border border-slate-200 text-xs font-bold ${
                        w === activeW ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      w = {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: items.length + 1 }).map((_, i) => {
                  const item = i > 0 ? items[i - 1] : null;
                  const isItemOptimal = item ? optimalItemIds.has(item.id) : false;

                  return (
                    <tr key={i}>
                      {/* Row Header */}
                      <td
                        className={`p-2 border border-slate-200 text-xs font-semibold text-left sticky left-0 z-10 transition ${
                          i === activeI
                            ? 'bg-amber-100/90 text-amber-950 font-bold'
                            : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {item && (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                          )}
                          <div>
                            <div>{i === 0 ? 'Base: 0 Items' : `#${i}: ${item?.name}`}</div>
                            {item && (
                              <div className="text-[10px] text-slate-500 font-normal">
                                {item.weight}kg · ${item.value} {isItemOptimal && '★'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cells */}
                      {Array.from({ length: capacity + 1 }).map((_, w) => {
                        const val = currentTable[i] ? currentTable[i][w] : -1;
                        const isCalculated = val !== -1;
                        const isActive = i === activeI && w === activeW;

                        // Check if in comparison
                        const isSkipCell =
                          currentSnapshot.comparisonCells.skipCell &&
                          currentSnapshot.comparisonCells.skipCell[0] === i &&
                          currentSnapshot.comparisonCells.skipCell[1] === w;

                        const isTakeCell =
                          currentSnapshot.comparisonCells.takeCell &&
                          currentSnapshot.comparisonCells.takeCell[0] === i &&
                          currentSnapshot.comparisonCells.takeCell[1] === w;

                        let cellBg = 'bg-white hover:bg-slate-50 text-slate-400';
                        if (isActive) {
                          cellBg = 'bg-amber-200 text-amber-950 font-black ring-2 ring-amber-400';
                        } else if (isTakeCell) {
                          cellBg = 'bg-emerald-100 text-emerald-900 font-bold ring-1 ring-emerald-400';
                        } else if (isSkipCell) {
                          cellBg = 'bg-amber-50 text-amber-900 font-bold ring-1 ring-amber-300';
                        } else if (isCalculated) {
                          cellBg = 'bg-sky-50/70 hover:bg-sky-100/70 text-slate-800 font-medium';
                        }

                        return (
                          <td
                            key={w}
                            onClick={() => {
                              const step = getStepForCell(i, w);
                              onSelectCellStep(step);
                            }}
                            className={`p-2.5 border border-slate-200 text-xs cursor-pointer transition select-none ${cellBg}`}
                            title={`dp[${i}][${w}] = ${isCalculated ? val : 'Uncomputed'}`}
                          >
                            <span className="font-mono">{isCalculated ? val : '-'}</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Formula: dp[i][w] = max(dp[i-1][w], dp[i-1][w-wi] + vi)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
