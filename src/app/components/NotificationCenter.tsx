"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, X, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationCenter({ tasks }: { tasks: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeNotifications, setActiveNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(now.getDate() + 7);

    const upcoming = tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return dueDate <= weekFromNow && dueDate >= now;
    });

    setActiveNotifications(upcoming);

    if (upcoming.length > 0) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [tasks]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all relative cursor-pointer
          ${isOpen ? 'bg-zinc-800 border-zinc-700' : 'border-[var(--border-color)]/80 hover:bg-zinc-800'}`}
      >
        <Bell size={18} className={activeNotifications.length > 0 ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'} />
        {activeNotifications.length > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-[rgb(var(--brand-primary))] rounded-full border-2 border-[#09090b]" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden z-[1000]"
          >
            <div className="p-5 border-b border-[var(--border-color)]/60 bg-[var(--bg-input)]/30">
              <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Oznámenia</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {activeNotifications.length > 0 ? (
                activeNotifications.map(task => (
                  <div key={task.id} className="p-4 border-b border-[var(--border-color)]/40 hover:bg-zinc-800/20 transition-colors group">
                    <div className="flex gap-3">
                      <div className="mt-1 p-1.5 rounded-lg bg-[var(--brand-light)] text-[rgb(var(--brand-primary))]">
                        <Clock size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-200 leading-tight mb-1">{task.text}</p>
                        <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-tight">
                          Termín: {new Date(task.due_date).toLocaleDateString('sk-SK')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-zinc-600">
                  <Info size={32} className="mx-auto mb-2 opacity-10" />
                  <p className="text-xs">Žiadne nové pripomienky</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed top-24 right-10 z-[1001] bg-[var(--bg-card)] border border-[rgb(var(--brand-primary)/0.3)] p-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[rgb(var(--brand-primary))]">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider">Pripomienka</p>
              <p className="text-xs text-[var(--text-muted)]">Máte {activeNotifications.length} úloh s blížiacim sa termínom.</p>
            </div>
            <button onClick={() => setShowToast(false)} className="text-zinc-600 hover:text-[var(--text-main)] transition-colors">
              <X size={16} />
            </button>
            <div className="absolute bottom-0 left-0 h-1 bg-[rgb(var(--brand-primary))] animate-progress-shrink" style={{ width: '100%' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}