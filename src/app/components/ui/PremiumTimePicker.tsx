"use client";

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  name: string;
  label: string;
  defaultValue?: string;
}

export function PremiumTimePicker({ name, label, defaultValue = "14:00" }: Props) {
  const [h, m] = defaultValue.split(':');
  const [time, setTime] = useState({ h, m });

  const updateTime = (type: 'h' | 'm', delta: number) => {
    setTime(prev => {
      let val = parseInt(prev[type]) + delta;
      if (type === 'h') {
        if (val > 23) val = 0;
        if (val < 0) val = 23;
      } else {
        if (val > 55) val = 0;
        if (val < 0) val = 55;
      }
      return { ...prev, [type]: String(val).padStart(2, '0') };
    });
  };

  return (
    <div className="w-full">
      <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">{label}</label>
      <input type="hidden" name={name} value={`${time.h}:${time.m}`} />

      <div className="mt-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl py-2 px-3 flex items-center justify-center gap-2 shadow-inner h-[56px]">
        <TimePod 
          value={time.h} 
          onIncr={() => updateTime('h', 1)} 
          onDecr={() => updateTime('h', -1)} 
        />
        <span className="text-zinc-700 font-black animate-pulse">:</span>
        <TimePod 
          value={time.m} 
          onIncr={() => updateTime('m', 5)} 
          onDecr={() => updateTime('m', -5)} 
        />
      </div>
    </div>
  );
}

function TimePod({ value, onIncr, onDecr }: { value: string, onIncr: () => void, onDecr: () => void }) {
  return (
    <div className="flex flex-col items-center group">
      <button type="button" onClick={onIncr} className="text-zinc-600 hover:text-[rgb(var(--brand-primary))] transition-colors cursor-pointer"><ChevronUp size={14} /></button>
      <span className="text-sm font-black text-[var(--text-main)] leading-none my-0.5 w-6 text-center select-none">{value}</span>
      <button type="button" onClick={onDecr} className="text-zinc-600 hover:text-[rgb(var(--brand-primary))] transition-colors cursor-pointer"><ChevronDown size={14} /></button>
    </div>
  );
}