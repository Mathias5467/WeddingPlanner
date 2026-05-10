"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ChevronUp, ChevronDown, X } from 'lucide-react';

interface Props {
  name: string;
  label?: string;
  defaultValue?: string;
}

export function PremiumDatePicker({ name, label, defaultValue }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(defaultValue ? new Date(defaultValue) : null);
  const [viewDate, setViewDate] = useState(defaultValue ? new Date(defaultValue) : new Date());
  
  const [time, setTime] = useState({ 
    h: defaultValue ? String(new Date(defaultValue).getHours()).padStart(2, '0') : "12", 
    m: defaultValue ? String(new Date(defaultValue).getMinutes()).padStart(2, '0') : "00" 
  });

  const months = ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"];
  const weekdays = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const handleTimeChange = (key: 'h' | 'm', val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setTime(prev => ({ ...prev, [key]: clean }));
  };

  const stepTime = (key: 'h' | 'm', delta: number) => {
    let num = parseInt(time[key]) || 0;
    if (key === 'h') num = (num + delta + 24) % 24;
    else num = (num + delta + 60) % 60;
    setTime(prev => ({ ...prev, [key]: String(num).padStart(2, '0') }));
  };

  const formatOnBlur = (key: 'h' | 'm') => {
    let num = parseInt(time[key]) || 0;
    if (key === 'h') num = Math.min(Math.max(num, 0), 23);
    else num = Math.min(Math.max(num, 0), 59);
    setTime(prev => ({ ...prev, [key]: String(num).padStart(2, '0') }));
  };

  const formatDateForInput = () => {
    if (!selectedDate) return "";
    const d = selectedDate;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${time.h || '00'}:${time.m || '00'}`;
  };

  return (
    <div className="w-full">
      {label && <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-[0.2em] block mb-2">{label}</label>}
      <input type="hidden" name={name} value={formatDateForInput()} />

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-4 h-[42px] text-sm outline-none transition-all flex items-center justify-between cursor-pointer hover:border-[var(--brand-primary)]"
      >
        <div className="flex items-center gap-3">
          <CalendarIcon size={18} className={selectedDate ? "text-[var(--brand-primary)]" : "text-[var(--text-muted)]"} />
          <span className={selectedDate ? "text-[var(--text-main)] font-bold" : "text-[var(--text-muted)] opacity-60"}>
            {selectedDate ? `${selectedDate.toLocaleDateString('sk-SK')} ${time.h || '00'}:${time.m || '00'}` : "Vybrať termín..."}
          </span>
        </div>
        <ChevronDown size={16} className="text-[var(--text-muted)]" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-[720px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <div className="flex-1 p-8 bg-[var(--bg-input)]/20 border-r border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-6">
                  <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-2 hover:bg-[var(--bg-card)] rounded-xl text-[var(--text-main)] cursor-pointer"><ChevronLeft size={20}/></button>
                  <span className="font-black text-[var(--text-main)] uppercase text-xs tracking-widest">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                  <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-2 hover:bg-[var(--bg-card)] rounded-xl text-[var(--text-main)] cursor-pointer"><ChevronRight size={20}/></button>
                </div>

                <div className="grid grid-cols-7 mb-3 text-center text-[10px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-tighter">
                  {weekdays.map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === viewDate.getMonth() && selectedDate?.getFullYear() === viewDate.getFullYear();
                    const isToday = new Date().getDate() === day && new Date().getMonth() === viewDate.getMonth() && new Date().getFullYear() === viewDate.getFullYear();

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))}
                        className={`h-10 w-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer
                          ${isSelected ? 'bg-[var(--brand-primary)] text-white shadow-lg scale-105 z-10' : 
                            isToday ? 'border border-[var(--brand-primary)]' : 
                            'text-[var(--text-main)] hover:bg-[var(--bg-card)]'}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full md:w-[300px] p-8 flex flex-col justify-between bg-[var(--bg-card)]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-[var(--text-main)] uppercase text-[10px] tracking-[0.3em]">Nastavenie času</h3>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-[var(--bg-input)] rounded-full text-[var(--text-muted)] cursor-pointer transition-colors"><X size={20} /></button>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <div className="flex items-center gap-4">
                    <TimePod 
                      value={time.h} 
                      onChange={(v) => handleTimeChange('h', v)}
                      onBlur={() => formatOnBlur('h')}
                      onIncr={() => stepTime('h', 1)}
                      onDecr={() => stepTime('h', -1)}
                    />
                    <span className="text-3xl font-black text-[var(--text-muted)] opacity-20">:</span>
                    <TimePod 
                      value={time.m} 
                      onChange={(v) => handleTimeChange('m', v)}
                      onBlur={() => formatOnBlur('m')}
                      onIncr={() => stepTime('m', 5)}
                      onDecr={() => stepTime('m', -5)}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-input)] px-4 py-1.5 rounded-full">
                    <Clock size={12} className="inline mr-2 text-[var(--brand-primary)]" /> 24-hodinový formát
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-10 bg-[var(--brand-primary)] hover:brightness-110 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-[var(--brand-primary)] cursor-pointer"
                >
                  Potvrdiť termín
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimePod({ value, onChange, onBlur, onIncr, onDecr }: { value: string, onChange: (v: string) => void, onBlur: () => void, onIncr: () => void, onDecr: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={onIncr} className="p-1 text-[var(--text-muted)] hover:text-[var(--brand-primary)] cursor-pointer transition-colors"><ChevronUp size={20} /></button>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-16 h-16 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl text-center text-2xl font-black text-[var(--text-main)] focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)] outline-none transition-all shadow-inner"
      />
      <button type="button" onClick={onDecr} className="p-1 text-[var(--text-muted)] hover:text-[var(--brand-primary)] cursor-pointer transition-colors"><ChevronDown size={20} /></button>
    </div>
  );
}