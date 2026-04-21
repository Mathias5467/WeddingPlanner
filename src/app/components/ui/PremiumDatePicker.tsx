"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  name: string;
  label: string;
  defaultValue?: string;
}

export function PremiumDatePicker({ name, label, defaultValue }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(defaultValue ? new Date(defaultValue) : null);
  const [viewDate, setViewDate] = useState(defaultValue ? new Date(defaultValue) : new Date());
  const [time, setTime] = useState({ 
    h: defaultValue ? String(new Date(defaultValue).getHours()).padStart(2, '0') : "12", 
    m: defaultValue ? String(new Date(defaultValue).getMinutes()).padStart(2, '0') : "00" 
  });

  const toggleDropdown = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 350);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const months = ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"];
  const weekdays = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  };

  const formatDateForInput = () => {
    if (!selectedDate) return "";
    const d = selectedDate;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${time.h}:${time.m}`;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-[0.2em]">{label}</label>
      <input type="hidden" name={name} value={formatDateForInput()} />

      <button
        type="button"
        onClick={toggleDropdown}
        className={`w-full bg-[var(--bg-input)] border mt-2 p-4 rounded-2xl flex items-center justify-between text-sm transition-all shadow-inner
          ${isOpen 
            ? 'border-[rgb(var(--brand-primary)/0.6)] ring-4 ring-[rgb(var(--brand-primary)/0.1)] shadow-[0_0_25px_rgba(var(--brand-primary),0.2)]' 
            : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-zinc-700 shadow-lg'}`}
      >
        <div className="flex items-center gap-3">
          <CalendarIcon size={18} className={selectedDate ? "text-[rgb(var(--brand-primary))]" : "text-zinc-600"} />
          <span className={selectedDate ? "text-[var(--text-main)] font-bold" : "text-[var(--text-muted)]"}>
            {selectedDate ? `${selectedDate.toLocaleDateString('sk-SK')} ${time.h}:${time.m}` : "Vybrať termín..."}
          </span>
        </div>
        <ChevronDown size={16} className={`text-zinc-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute z-[999] left-0 w-64 bg-[#131316] border border-[var(--border-color)] rounded-[1.5rem] p-4 animate-in fade-in zoom-in-95 duration-200
            ${openUp 
                ? 'bottom-full mb-3 shadow-[0_-20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(var(--brand-primary),0.1)] slide-in-from-bottom-2' 
                : 'top-full mt-3 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(var(--brand-primary),0.1)] slide-in-from-top-2'
            }`}
        >
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-1.5 hover:bg-zinc-800 rounded-lg text-[var(--text-muted)] cursor-pointer transition-colors"><ChevronLeft size={16}/></button>
            <span className="font-bold text-[var(--text-main)] uppercase text-[9px] tracking-widest">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-1.5 hover:bg-zinc-800 rounded-lg text-[var(--text-muted)] cursor-pointer transition-colors"><ChevronRight size={16}/></button>
          </div>

          <div className="grid grid-cols-7 mb-1 text-center text-[8px] font-black text-zinc-600 uppercase">
            {weekdays.map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === viewDate.getMonth() && selectedDate?.getFullYear() === viewDate.getFullYear();
              const isToday = new Date().getDate() === day && new Date().getMonth() === viewDate.getMonth() && new Date().getFullYear() === viewDate.getFullYear();

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`h-7 w-7 rounded-lg text-[10px] font-bold transition-all cursor-pointer
                    ${isSelected ? 'bg-[rgb(var(--brand-primary))] text-[var(--text-main)] shadow-md' : 
                      isToday ? 'text-[rgb(var(--brand-primary))] bg-[var(--brand-light)]' : 'text-[var(--text-muted)] hover:bg-zinc-800 hover:text-zinc-200'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-[9px] font-black uppercase tracking-widest">
              <Clock size={14} className="text-[rgb(var(--brand-primary))]" /> Čas
            </div>
            <div className="flex items-center gap-1.5">
              <TimePod 
                value={time.h} 
                onIncr={() => setTime(prev => ({ ...prev, h: String((parseInt(prev.h) + 1) % 24).padStart(2, '0') }))} 
                onDecr={() => setTime(prev => ({ ...prev, h: String((parseInt(prev.h) - 1 + 24) % 24).padStart(2, '0') }))} 
              />
              <span className="text-zinc-700 font-bold">:</span>
              <TimePod 
                value={time.m} 
                onIncr={() => setTime(prev => ({ ...prev, m: String((parseInt(prev.m) + 5) % 60).padStart(2, '0') }))} 
                onDecr={() => setTime(prev => ({ ...prev, m: String((parseInt(prev.m) - 5 + 60) % 60).padStart(2, '0') }))} 
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 bg-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-hover))] text-[var(--text-main)] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-lg shadow-[rgb(var(--brand-primary)/0.2)]"
          >
            Potvrdiť výber
          </button>
        </div>
      )}
    </div>
  );
}

function TimePod({ value, onIncr, onDecr }: { value: string, onIncr: () => void, onDecr: () => void }) {
  return (
    <div className="flex items-center bg-zinc-950 border border-[var(--border-color)] rounded-lg px-0.5 shadow-inner group">
      <button type="button" onClick={onDecr} className="p-1 text-zinc-600 hover:text-[rgb(var(--brand-primary))] transition-colors cursor-pointer"><ChevronDown size={11} /></button>
      <span className="w-5 text-center text-[10px] font-black text-[var(--text-main)]">{value}</span>
      <button type="button" onClick={onIncr} className="p-1 text-zinc-600 hover:text-[rgb(var(--brand-primary))] transition-colors cursor-pointer"><ChevronUp size={11} /></button>
    </div>
  );
}