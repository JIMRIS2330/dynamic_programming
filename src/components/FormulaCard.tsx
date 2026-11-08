import React from 'react';
import { ArrowRight, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { DPSnapshot } from '../types/knapsack';

interface FormulaCardProps {
  snapshot: DPSnapshot;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({ snapshot }) => {
  const { action, i, w, currentItem, skipValue, takeValue, chosenValue, explanation } = snapshot;

  const isOptimal = action === 'optimal_solution';
  const isStart = action === 'start';
  const isCannotFit = action === 'cannot_fit';
  const isTake = action === 'take';
  const isSkip = action === 'skip';

  return (
    <div className="bg-white/95 rounded-xl border border-slate-200/90 shadow-sm p-3 max-w-xl mx-auto transition-all">
      {/* Top Status Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          {isOptimal ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" /> Optimal Solution
            </span>
          ) : isStart ? (
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              Base Case
            </span>
          ) : isTake ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Decision: TAKE Item
            </span>
          ) : isSkip ? (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <XCircle className="w-3.5 h-3.5" /> Decision: SKIP Item
            </span>
          ) : isCannotFit ? (
            <span className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              <AlertCircle className="w-3.5 h-3.5" /> Overweight (Cannot Fit)
            </span>
          ) : null}

          {!isStart && !isOptimal && (
            <span className="text-xs font-mono font-medium text-slate-500">
              Cell: dp[{i}][{w}]
            </span>
          )}
        </div>

        {currentItem && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: currentItem.color }}
            />
            <span className="font-semibold text-slate-800">{currentItem.name}</span>
            <span className="text-slate-400">({currentItem.weight}kg · ${currentItem.value})</span>
          </div>
        )}
      </div>

      {/* Recurrence Equation Section */}
      {!isStart && !isOptimal && (
        <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
          {/* Option 1: Skip */}
          <div
            className={`p-2 rounded-lg border transition ${
              isSkip || isCannotFit
                ? 'bg-amber-50/80 border-amber-300 font-medium text-amber-950 ring-1 ring-amber-300'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">
              Option 1: Skip Item
            </div>
            <div className="font-mono text-xs">
              dp[{i - 1}][{w}] = <span className="font-bold text-sm">${skipValue}</span>
            </div>
          </div>

          {/* Option 2: Take */}
          <div
            className={`p-2 rounded-lg border transition ${
              isTake
                ? 'bg-emerald-50/80 border-emerald-300 font-medium text-emerald-950 ring-1 ring-emerald-300'
                : isCannotFit
                ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">
              Option 2: Take Item
            </div>
            {isCannotFit ? (
              <div className="font-mono text-xs italic">
                wt ({currentItem?.weight}kg) &gt; cap ({w}kg)
              </div>
            ) : (
              <div className="font-mono text-xs">
                dp[{i - 1}][{w - (currentItem?.weight || 0)}] + ${currentItem?.value} ={' '}
                <span className="font-bold text-sm">${takeValue}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pedagogical Explanation Text */}
      <div className="flex items-start gap-1.5 text-xs text-slate-600 leading-relaxed bg-slate-50/80 rounded-lg p-2 border border-slate-100">
        <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
        <p>{explanation}</p>
      </div>
    </div>
  );
};
