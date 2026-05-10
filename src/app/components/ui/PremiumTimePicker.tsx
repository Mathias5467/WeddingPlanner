"use client";

import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  name: string;
  label: string;
  defaultValue?: string;
}

interface TimeInputPodProps {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  onIncr: () => void;
  onDecr: () => void;
}

export function PremiumTimePicker({ name, label, defaultValue = "14:00" }: Props) {
  const [initialH, initialM] = defaultValue.split(':');
  const [time, setTime] = useState({ h: initialH, m: initialM });

  useEffect(() => {
    const [newH, newM] = defaultValue.split(':');
    setTime({ h: newH, m: newM });
  }, [defaultValue]);

  const handleInputChange = (key: 'h' | 'm', val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setTime(prev => ({ ...prev, [key]: clean }));
  };

  const handleBlur = (key: 'h' | 'm') => {
    let num = parseInt(time[key]) || 0;
    if (key === 'h') num = Math.min(Math.max(num, 0), 23);
    else num = Math.min(Math.max(num, 0), 59);
    setTime(prev => ({ ...prev, [key]: String(num).padStart(2, '0') }));
  };

  const stepTime = (key: 'h' | 'm', delta: number) => {
    let num = parseInt(time[key]) || 0;
    if (key === 'h') num = (num + delta + 24) % 24;
    else num = (num + delta + 60) % 60;
    setTime(prev => ({ ...prev, [key]: String(num).padStart(2, '0') }));
  };

  return (
    <div className="w-full">
      <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest block mb-2">
        {label}
      </label>
      
      <input type="hidden" name={name} value={`${time.h || '00'}:${time.m || '00'}`} />

      <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center gap-0.5 h-[56px] px-2 transition-all focus-within:border-[rgb(var(--brand-primary))]">
        <TimeInputPod 
          value={time.h} 
          onChange={(v) => handleInputChange('h', v)}
          onBlur={() => handleBlur('h')}
          onIncr={() => stepTime('h', 1)}
          onDecr={() => stepTime('h', -1)}
        />

        <span className="text-lg font-black text-[var(--text-muted)] opacity-30">:</span>

        <TimeInputPod 
          value={time.m} 
          onChange={(v) => handleInputChange('m', v)}
          onBlur={() => handleBlur('m')}
          onIncr={() => stepTime('m', 5)}
          onDecr={() => stepTime('m', -5)}
        />
      </div>
    </div>
  );
}

function TimeInputPod({ value, onChange, onBlur, onIncr, onDecr }: TimeInputPodProps) {
  return (    
  <div className="flex flex-col items-center justify-center">
    <button 
      type="button" 
      onClick={onIncr} 
      className="text-[var(--text-muted)] hover:text-[rgb(var(--brand-primary))] cursor-pointer leading-none"
    >
      <ChevronUp size={14} />
    </button>

    <input 
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className="w-8 bg-transparent text-center text-base font-black text-[var(--text-main)] outline-none border-none p-0 focus:text-[rgb(var(--brand-primary))]"
    />

    <button 
      type="button" 
      onClick={onDecr} 
      className="text-[var(--text-muted)] hover:text-[rgb(var(--brand-primary))] cursor-pointer leading-none"
    >
      <ChevronDown size={14} />
    </button>
  </div>
);
}