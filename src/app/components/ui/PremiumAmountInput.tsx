"use client";

import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  name: string;
  label: string;
  defaultValue?: number;
}

export function PremiumAmountInput({ name, label, defaultValue = 0 }: Props) {
  const [value, setValue] = useState<string>(defaultValue.toString());

  useEffect(() => {
    setValue(defaultValue.toString());
  }, [defaultValue]);

  const adjust = (amount: number) => {
    const current = parseFloat(value) || 0;
    const next = Math.max(0, current + amount);
    setValue(next.toFixed(2).replace('.00', ''));
  };

  return (
    <div className="w-full">
      <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">{label}</label>
      
      <div className="relative mt-2 group">
        <input
          type="number"
          name={name}
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0.00"
          className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl p-3 pr-12 outline-none transition-all focus:border-[rgb(var(--brand-primary)/0.5)] focus:shadow-[0_0_15px_rgba(var(--brand-primary),0.1)] shadow-inner text-sm font-mono font-bold"
        />
        
        <div className="absolute right-1 top-1 bottom-1 flex flex-col w-8 border-l border-[var(--border-color)]/50">
          <button
            type="button"
            onClick={() => adjust(10)}
            className="flex-1 flex items-center justify-center text-zinc-600 hover:text-[rgb(var(--brand-primary))] hover:bg-zinc-800/50 rounded-tr-lg transition-all cursor-pointer"
          >
            <ChevronUp size={14} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => adjust(-10)}
            className="flex-1 flex items-center justify-center text-zinc-600 hover:text-[rgb(var(--brand-primary))] hover:bg-zinc-800/50 rounded-br-lg transition-all cursor-pointer border-t border-[var(--border-color)]/50"
          >
            <ChevronDown size={14} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}