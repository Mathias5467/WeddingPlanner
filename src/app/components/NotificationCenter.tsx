"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell, Clock, X, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationCenter({ tasks }: { tasks: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastTaskName, setToastTaskName] = useState("");
  const [now, setNow] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Aktualizácia času každú minútu
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. Logika filtrovania úloh (reaguje na zmenu tasks aj času)
  const activeNotifications = useMemo(() => {
    if (!tasks) return [];
    const weekFromNow = new Date(now);
    weekFromNow.setDate(now.getDate() + 7);

    return tasks.filter(task => {
      const isDone = task.completed || task.is_completed;
      if (isDone) return false;
      const taskDateStr = task.due_date || task.date;
      if (!taskDateStr) return false;
      return new Date(taskDateStr) <= weekFromNow;
    }).sort((a, b) => new Date(a.due_date || a.date).getTime() - new Date(b.due_date || b.date).getTime());
  }, [tasks, now]);

  // 3. INTELIGENTNÁ LOGIKA PRE TOAST (Už nebude vyskakovať pri preklikávaní tabov)
  useEffect(() => {
    const currentCount = activeNotifications.length;
    if (currentCount === 0) {
      setShowToast(false);
      sessionStorage.setItem('wedding_last_count', "0");
      return;
    }

    // Získame posledný známy počet z pamäte prehliadača
    const savedCountStr = sessionStorage.getItem('wedding_last_count');
    const savedCount = savedCountStr === null ? -1 : parseInt(savedCountStr);

    // Prípad 1: Prvýkrát prichádzame do appky (v rámci tejto session)
    if (savedCount === -1) {
      const firstTask = activeNotifications[0];
      setToastTaskName(firstTask?.text || firstTask?.title || "Máte urgentné úlohy");
      setShowToast(true);
    } 
    // Prípad 2: Pribudla ÚPLNE NOVÁ urgentná úloha (počet sa zvýšil)
    else if (currentCount > savedCount) {
      // Nájdeme názov úlohy, ktorá je nová alebo najurgentnejšia
      const latestTask = activeNotifications[0];
      setToastTaskName(latestTask?.text || latestTask?.title || "Nová úloha v zozname");
      setShowToast(true);
    }

    // Vždy aktualizujeme sessionStorage, aby sme vedeli, že tento počet sme už "videli"
    sessionStorage.setItem('wedding_last_count', currentCount.toString());

  }, [activeNotifications.length]); // Sledujeme len zmenu počtu úloh

  // Zatvorenie dropdownu pri kliknutí mimo
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BELL BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all relative cursor-pointer group
          bg-transparent border-[var(--border-color)]
          hover:bg-[var(--brand-primary)] hover:border-[var(--brand-primary)]
          ${isOpen ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)]' : ''}`}
      >
        <Bell 
          size={18} 
          className={`transition-colors duration-300
            ${activeNotifications.length > 0 ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'}
            group-hover:text-white ${isOpen ? 'text-white' : ''}`} 
        />
        {activeNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[var(--bg-main)] shadow-sm">
            {activeNotifications.length}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden z-[1000]"
          >
            <div className="p-5 border-b border-[var(--border-color)]/60 bg-[var(--bg-input)]/30">
              <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest leading-none">Oznámenia</h3>
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {activeNotifications.length > 0 ? (
                activeNotifications.map(task => {
                  const tDate = new Date(task.due_date || task.date);
                  const isOverdue = tDate < now;
                  return (
                    <div key={task.id} className="p-4 border-b border-[var(--border-color)]/40 hover:bg-[var(--brand-light)]/10 transition-colors">
                      <div className="flex gap-3">
                        <div className={`mt-1 p-1.5 rounded-lg shrink-0 ${isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-[var(--brand-light)] text-[var(--brand-primary)]'}`}>
                          <Clock size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--text-main)] leading-tight mb-1 truncate">{task.text || task.title}</p>
                          <p className={`text-[10px] font-black uppercase tracking-tight ${isOverdue ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
                            {isOverdue ? 'Zmeškané: ' : 'Termín: '}{tDate.toLocaleDateString('sk-SK')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-[var(--text-muted)] italic text-xs">Všetko vybavené</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MINI TOAST (Vyskakuje len pri skutočnej zmene dát) */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-24 right-10 z-[1100] bg-[var(--bg-card)] border border-[var(--brand-primary)] py-3 pl-4 pr-2 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[220px] max-w-[320px] overflow-hidden"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--brand-light)] text-[var(--brand-primary)] shrink-0 shadow-inner">
              <AlertCircle size={18} />
            </div>
            
            <div className="flex-1 min-w-0">
               <p className="text-[11px] font-bold text-[var(--text-main)] truncate pr-2">
                 {toastTaskName}
               </p>
            </div>

            <button 
              onClick={() => setShowToast(false)} 
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>

            <motion.div 
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--brand-primary)] origin-left"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}