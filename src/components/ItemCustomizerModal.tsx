import React, { useState } from 'react';
import { X, Plus, Trash2, Check, RotateCcw } from 'lucide-react';
import { KnapsackItem, ItemIconType } from '../types/knapsack';

interface ItemCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: KnapsackItem[];
  capacity: number;
  onSave: (newItems: KnapsackItem[], newCapacity: number) => void;
}

const AVAILABLE_ICONS: { type: ItemIconType; label: string }[] = [
  { type: 'camera', label: 'Camera' },
  { type: 'gem', label: 'Gemstone' },
  { type: 'laptop', label: 'Laptop' },
  { type: 'trophy', label: 'Trophy' },
  { type: 'potion', label: 'Potion' },
  { type: 'book', label: 'Book' },
  { type: 'compass', label: 'Compass' },
  { type: 'watch', label: 'Watch' },
];

const PASTEL_PALETTE = [
  { bg: '#bae6fd', accent: '#0284c7' }, // Sky
  { bg: '#a7f3d0', accent: '#059669' }, // Mint
  { bg: '#fbcfe8', accent: '#db2777' }, // Pink
  { bg: '#fde68a', accent: '#d97706' }, // Amber
  { bg: '#ddd6fe', accent: '#7c3aed' }, // Purple
  { bg: '#fed7aa', accent: '#ea580c' }, // Orange
  { bg: '#c7d2fe', accent: '#4338ca' }, // Indigo
];

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({
  isOpen,
  onClose,
  items: initialItems,
  capacity: initialCapacity,
  onSave,
}) => {
  const [items, setItems] = useState<KnapsackItem[]>(initialItems);
  const [capacity, setCapacity] = useState<number>(initialCapacity);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (items.length >= 6) return; // Keep manageable for 3D layout
    const colorPick = PASTEL_PALETTE[items.length % PASTEL_PALETTE.length];
    const iconPick = AVAILABLE_ICONS[items.length % AVAILABLE_ICONS.length].type;
    const newItem: KnapsackItem = {
      id: `custom-${Date.now()}`,
      name: `Artifact ${items.length + 1}`,
      weight: 2,
      value: 30,
      color: colorPick.bg,
      accentColor: colorPick.accent,
      iconType: iconPick,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 2) return; // Minimum 2 items
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<KnapsackItem>) => {
    setItems(items.map(item => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleSave = () => {
    onSave(items, capacity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Customize Knapsack & Candidate Items
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set maximum backpack capacity and candidate weights/values.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Knapsack Capacity Slider */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-700">
                Max Knapsack Capacity (W):
              </label>
              <span className="text-base font-extrabold text-blue-600 font-mono">
                {capacity} kg
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={12}
              value={capacity}
              onChange={e => setCapacity(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>3 kg (Compact)</span>
              <span>7 kg (Standard)</span>
              <span>12 kg (Large)</span>
            </div>
          </div>

          {/* Items List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">
                Candidate Items ({items.length}/6)
              </h3>
              <button
                onClick={handleAddItem}
                disabled={items.length >= 6}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs"
                >
                  <span className="text-xs font-mono font-bold text-slate-400 w-5">
                    #{idx + 1}
                  </span>

                  {/* Name */}
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => handleUpdateItem(item.id, { name: e.target.value })}
                    className="flex-1 min-w-[120px] text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Item name"
                  />

                  {/* Weight */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500 font-medium">Weight:</span>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={item.weight}
                      onChange={e =>
                        handleUpdateItem(item.id, { weight: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-14 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center focus:outline-none"
                    />
                    <span className="text-slate-400">kg</span>
                  </div>

                  {/* Value */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500 font-medium">Value:</span>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={item.value}
                      onChange={e =>
                        handleUpdateItem(item.id, { value: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-16 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center focus:outline-none"
                    />
                    <span className="text-slate-400">$</span>
                  </div>

                  {/* 3D Model Shape */}
                  <select
                    value={item.iconType}
                    onChange={e =>
                      handleUpdateItem(item.id, { iconType: e.target.value as ItemIconType })
                    }
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none"
                  >
                    {AVAILABLE_ICONS.map(ic => (
                      <option key={ic.type} value={ic.type}>
                        {ic.label}
                      </option>
                    ))}
                  </select>

                  {/* Color Swatch */}
                  <div className="flex items-center gap-1">
                    {PASTEL_PALETTE.map((pal, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() =>
                          handleUpdateItem(item.id, { color: pal.bg, accentColor: pal.accent })
                        }
                        className={`w-5 h-5 rounded-full border transition ${
                          item.color === pal.bg
                            ? 'scale-110 ring-2 ring-slate-800 border-white'
                            : 'border-slate-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: pal.bg }}
                      />
                    ))}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={items.length <= 2}
                    title="Remove item"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            onClick={() => {
              setItems(initialItems);
              setCapacity(initialCapacity);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs font-medium text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Solve</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
