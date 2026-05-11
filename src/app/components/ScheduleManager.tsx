"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Clock, MapPin, Trash2, Edit3, X, Check, 
  CalendarDays, AlignLeft, FileDown, AlertTriangle 
} from 'lucide-react';
import { getSchedule, addScheduleItem, deleteScheduleItem, updateScheduleItem } from '../actions';
import { DeleteModal } from './ui/DeleteModal';
import { PremiumTimePicker } from './ui/PremiumTimePicker';

import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface ScheduleItem {
  id: number; time: string; activity: string; location: string; description: string;
}

export function ScheduleManager() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ScheduleItem | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [showModeWarning, setShowModeWarning] = useState(false);
  
  const scheduleRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    const data = await getSchedule();
    setItems(data as unknown as ScheduleItem[]);
  };

  useEffect(() => { loadData(); }, []);

  const handleDownloadPDF = async () => {
    const html = document.documentElement;
    const body = document.body;
    
    const styleHtml = getComputedStyle(html);
    const styleBody = getComputedStyle(body);
    
    const isLight = (color: string) => {
      const rgb = color.match(/\d+/g);
      if (!rgb || rgb.length < 3) return false;
      const brightness = (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3;
      return brightness > 200;
    };

    const isLightMode = 
      html.getAttribute('data-mode') === 'light' || 
      body.getAttribute('data-mode') === 'light' ||
      html.classList.contains('light') || 
      body.classList.contains('light') ||
      isLight(styleHtml.backgroundColor) || 
      isLight(styleBody.backgroundColor) ||
      styleBody.color === 'rgb(0, 0, 0)' || styleBody.color === 'rgb(15, 23, 42)';

    if (!isLightMode) {
      setShowModeWarning(true);
      setTimeout(() => setShowModeWarning(false), 6000);
      return;
    }

    if (!scheduleRef.current) return;
    setIsExporting(true);

    try {
      const element = scheduleRef.current;

      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 5,
        backgroundColor: '#ffffff',
        width: 1200,
        style: {
          width: '1200px',
          padding: '0px',
        },
        filter: (node) => {
          if (node.nodeType === 1) {
            const el = node as HTMLElement;
            return !el.classList?.contains('pdf-ignore');
          }
          return true;
        }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const margin = 5;
      const availableWidth = pdfWidth - (margin * 2);

      const imgProps = pdf.getImageProperties(dataUrl);
      const finalHeight = (imgProps.height * availableWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', margin, margin, availableWidth, finalHeight);
      pdf.save('Svadobny-Harmonogram.pdf');

    } catch (error) {
      console.error('Chyba pri PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500 relative">
      
      <AnimatePresence>
        {showModeWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-10 left-1/2 z-[999] w-[90%] max-w-md"
          >
            <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl shadow-2xl flex items-start gap-4">
              <div className="bg-amber-500 p-2 rounded-xl text-white shadow-lg">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h4 className="text-amber-900 font-black text-sm uppercase tracking-tight">Potrebný Svetlý Režim</h4>
                <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                  Pre správne farby v PDF prepnite aplikáciu v nastaveniach na <b>Svetlý režim</b>. V tmavom režime by PDF nebolo čitateľné.
                </p>
              </div>
              <button onClick={() => setShowModeWarning(false)} className="text-amber-400 hover:text-amber-600">
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scheduleRef} className="p-4 bg-[var(--bg-main)] transition-colors duration-500">
        
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Svadobný Harmonogram</h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">Podrobný plán vášho veľkého dňa</p>
          </div>
          
          <div className="flex gap-3 pdf-ignore">
            <button 
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[var(--bg-input)] transition-all cursor-pointer disabled:opacity-50"
            >
              <FileDown size={20} className="text-[var(--brand-primary)]" />
              {isExporting ? 'Generujem...' : 'Stiahnuť PDF'}
            </button>

            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[var(--brand-primary)] hover:brightness-110 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus size={20} /> Aktivita
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-[31px] top-0 bottom-0 w-0.5 bg-[var(--brand-primary)] opacity-80" />

          <div className="space-y-8 pb-10">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div key={item.id} layout className="relative flex gap-8 group">
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--border-color)] flex flex-col items-center justify-center shadow-lg group-hover:border-[var(--brand-primary)] transition-all">
                      <span className="text-xs font-black text-[var(--brand-primary)]">{item.time}</span>
                      <Clock size={14} className="text-[var(--text-muted)] mt-1 opacity-50" />
                    </div>
                  </div>

                  <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-[var(--brand-primary)] transition-all relative">
                    <div className="flex justify-between items-start">
                      <div className="max-w-[80%]">
                        <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">{item.activity}</h3>
                        <div className="flex flex-wrap gap-4 text-xs font-medium text-[var(--text-muted)]">
                          {item.location && (
                            <span className="flex items-center gap-1.5 bg-[var(--bg-input)] px-3 py-1 rounded-full border border-[var(--border-color)]">
                              <MapPin size={12} className="text-[var(--brand-primary)]" /> {item.location}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-4 text-[var(--text-muted)] text-sm leading-relaxed border-l-2 border-[var(--border-color)] pl-4">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all pdf-ignore">
                        <button onClick={() => setEditingItem(item)} className="p-2 text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:bg-[rgba(var(--brand-primary),0.1)] rounded-xl transition-all cursor-pointer">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => setItemToDelete(item)} className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer">
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
                <p className="text-[var(--text-muted)]">Váš svadobný deň je zatiaľ prázdny.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {(isAddModalOpen || editingItem) && (
        <ScheduleModal item={editingItem} onClose={() => { setIsAddModalOpen(false); setEditingItem(null); }} onRefresh={loadData} />
      )}

      <DeleteModal isOpen={!!itemToDelete} text={`Odstrániť ${itemToDelete?.activity}?`} onClose={() => setItemToDelete(null)} onConfirm={async () => { if(itemToDelete) { await deleteScheduleItem(itemToDelete.id); setItemToDelete(null); loadData(); }}} />
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
        className="relative bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] w-full max-w-xl shadow-lg animate-in zoom-in-95 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{item ? 'Upraviť aktivitu' : 'Nová aktivita'}</h3>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"><X size={24}/></button>
        </div>
        
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-[140px] flex-shrink-0">
            <PremiumTimePicker 
              name="time" 
              label="Čas" 
              defaultValue={item?.time || "14:00"} 
            />
          </div>

          <div className="flex-1">
            <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest block mb-2">
              Názov aktivity
            </label>
            <input 
              name="activity" 
              required 
              autoComplete="off"
              defaultValue={item?.activity} 
              placeholder="napr. Svadobný obrad" 
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl px-5 outline-none focus:border-[var(--brand-primary)] shadow-inner h-[56px] transition-all" 
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Miesto (Location)</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input name="location" defaultValue={item?.location} autoComplete="off" placeholder="Kde sa to koná?" className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl py-4 pl-12 pr-4 mt-2 outline-none focus:border-[var(--brand-primary)] shadow-inner transition-all h-[56px]" />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Popis / Poznámka</label>
          <div className="relative">
            <AlignLeft className="absolute left-4 top-6 text-[var(--text-muted)]" size={18} />
            <textarea name="description" defaultValue={item?.description} rows={3} placeholder="Detaily aktivity..." className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl py-4 pl-12 pr-4 mt-2 outline-none focus:border-[var(--brand-primary)] shadow-inner resize-none transition-all" />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-all cursor-pointer">Zrušiť</button>
          <button type="submit" className="flex-1 p-4 rounded-2xl bg-[var(--brand-primary)] hover:opacity-90 text-white font-black shadow-lg shadow-[var(--brand-primary)] cursor-pointer active:scale-95 transition-all">
            {item ? 'Uložiť zmeny' : 'Pridať do plánu'}
          </button>
        </div>
      </form>
    </div>
  );
}