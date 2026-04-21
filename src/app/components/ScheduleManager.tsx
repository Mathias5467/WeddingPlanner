"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, MapPin, Trash2, Edit3, X, Check, CalendarDays, AlignLeft } from 'lucide-react';
import { getSchedule, addScheduleItem, deleteScheduleItem, updateScheduleItem } from '../actions';
import { DeleteModal } from './ui/DeleteModal';
import { PremiumTimePicker } from './ui/PremiumTimePicker';

interface ScheduleItem {
  id: number; time: string; activity: string; location: string; description: string;
}

export function ScheduleManager() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ScheduleItem | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  const loadData = async () => {
    const data = await getSchedule();
    setItems(data as ScheduleItem[]);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Svadobný Harmonogram</h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">Podrobný plán vášho veľkého dňa</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-hover))] text-[var(--text-main)] px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg shadow-[rgb(var(--brand-primary)/0.2)] active:scale-95 cursor-pointer"
        >
          <Plus size={20} /> Pridať aktivitu
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-[31px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[rgb(var(--brand-primary))] via-[rgb(var(--brand-primary)/0.3)] to-transparent" />

        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative flex gap-8 group"
              >
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--bg-input)] border-2 border-[var(--border-color)] flex flex-col items-center justify-center shadow-xl group-hover:border-[rgb(var(--brand-primary)/0.5)] transition-all">
                    <span className="text-xs font-black text-[rgb(var(--brand-primary))]">{item.time}</span>
                    <Clock size={14} className="text-zinc-600 mt-1" />
                  </div>
                </div>

                <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)]/60 p-6 rounded-[2rem] shadow-xl hover:border-zinc-700 transition-all relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">{item.activity}</h3>
                      <div className="flex flex-wrap gap-4 text-xs font-medium text-[var(--text-muted)]">
                        {item.location && (
                          <span className="flex items-center gap-1.5 bg-[var(--bg-input)] px-3 py-1 rounded-full border border-[var(--border-color)]">
                            <MapPin size={12} className="text-[rgb(var(--brand-primary))]" /> {item.location}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-4 text-[var(--text-muted)] text-sm leading-relaxed border-l-2 border-[var(--border-color)] pl-4">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => setEditingItem(item)}
                        className="p-2 text-[var(--text-muted)] hover:text-green-500 hover:bg-green-500/10 rounded-xl transition-all cursor-pointer"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => setItemToDelete(item)}
                        className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="ml-20 p-20 text-center border-2 border-dashed border-[var(--border-color)] rounded-[3rem]">
              <CalendarDays size={48} className="mx-auto mb-4 opacity-10 text-[var(--text-main)]" />
              <p className="text-[var(--text-muted)]">Váš svadobný deň je zatiaľ prázdny. Začnite prvou aktivitou!</p>
            </div>
          )}
        </div>
      </div>

      {(isAddModalOpen || editingItem) && (
        <ScheduleModal 
          item={editingItem} 
          onClose={() => { setIsAddModalOpen(false); setEditingItem(null); }} 
          onRefresh={loadData} 
        />
      )}

      <DeleteModal 
        isOpen={!!itemToDelete} 
        text={`Odstrániť ${itemToDelete?.activity}?`} 
        onClose={() => setItemToDelete(null)} 
        onConfirm={async () => { if(itemToDelete) { await deleteScheduleItem(itemToDelete.id); setItemToDelete(null); loadData(); }}} 
      />
    </div>
  );
}

function ScheduleModal({ item, onClose, onRefresh }: { item: ScheduleItem | null, onClose: () => void, onRefresh: () => void }) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      <form 
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          item ? await updateScheduleItem(item.id, fd) : await addScheduleItem(fd);
          onRefresh();
          onClose();
        }}
        className="relative bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{item ? 'Upraviť aktivitu' : 'Nová aktivita'}</h3>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"><X size={24}/></button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-1">
            <PremiumTimePicker 
              name="time" 
              label="Čas" 
              defaultValue={item?.time || "14:00"} 
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Názov aktivity</label>
            <input 
              name="activity" 
              required 
              autoComplete="off"
              defaultValue={item?.activity} 
              placeholder="napr. Svadobný obrad" 
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl p-4 mt-2 outline-none focus:border-[rgb(var(--brand-primary)/0.5)] shadow-inner h-[56px] transition-all" 
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Miesto (Location)</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input name="location" defaultValue={item?.location} autoComplete="off" placeholder="Kde sa to koná?" className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl py-4 pl-12 pr-4 mt-2 outline-none focus:border-[rgb(var(--brand-primary)/0.5)] shadow-inner transition-all h-[56px]" />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Popis / Poznámka</label>
          <div className="relative">
            <AlignLeft className="absolute left-4 top-6 text-[var(--text-muted)]" size={18} />
            <textarea name="description" defaultValue={item?.description} rows={3} placeholder="Detaily aktivity..." className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl py-4 pl-12 pr-4 mt-2 outline-none focus:border-[rgb(var(--brand-primary)/0.5)] shadow-inner resize-none transition-all" />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-all cursor-pointer">Zrušiť</button>
          <button type="submit" className="flex-1 p-4 rounded-2xl bg-[rgb(var(--brand-primary))] hover:opacity-90 text-[var(--text-main)] font-black shadow-lg shadow-[rgb(var(--brand-primary)/0.2)] cursor-pointer active:scale-95 transition-all">
            {item ? 'Uložiť zmeny' : 'Pridať do plánu'}
          </button>
        </div>
      </form>
    </div>
  );
}