"use client";

import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Check, X, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { addGuest, deleteGuest, updateGuest } from '../actions';
import { DeleteModal } from './ui/DeleteModal';
import { CustomDropdown } from './ui/CustomDropdown'; 


const SIDE_OPTIONS = [
  { value: 'Bride', label: 'Nevesta', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { value: 'Groom', label: 'Ženích', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { value: 'Mutual', label: 'Spoloční', color: 'bg-zinc-800 text-[var(--text-muted)] border-zinc-700' },
];

const STATUS_OPTIONS = [
  { value: 'Not Asked', label: 'Neoslovený', color: 'bg-zinc-800 text-[var(--text-muted)] border-zinc-700' },
  { value: 'Asked', label: 'Oslovený', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'Will Come', label: 'Príde', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'Won\'t Come', label: 'Nepríde', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];


export function GuestManager({ guests, refresh }: { guests: any[], refresh: () => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<{id: number, name: string} | null>(null);
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });

  const getOption = (val: string, options: any[]) => options.find(o => o.value === val) || options[0];

  const sortedGuests = useMemo(() => {
    let sortableItems = [...guests];
    sortableItems.sort((a, b) => {
      const aVal = (sortConfig.key === 'side' ? a.family_side : a[sortConfig.key]) || '';
      const bVal = (sortConfig.key === 'side' ? b.family_side : b[sortConfig.key]) || '';
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [guests, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={14} className="ml-2 text-zinc-600" />;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={14} className="ml-2 text-[rgb(var(--brand-primary))]" /> : 
      <ChevronDown size={14} className="ml-2 text-[rgb(var(--brand-primary))]" />;
  };

  return (
    <div className="space-y-6">
      
      <form 
        onSubmit={async (e: React.FormEvent<HTMLFormElement>) => { 
            e.preventDefault(); 
            const form = e.currentTarget; 
            const formData = new FormData(form);
            await addGuest(formData); 
            form.reset(); 
            refresh(); 
        }} 
        className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 p-6 rounded-3xl flex flex-wrap gap-4 items-end"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Meno hosťa</label>
          <input 
            autoComplete="off" 
            name="name" 
            required 
            placeholder="Meno a priezvisko" 
            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-zinc-200 rounded-xl px-4 py-3 outline-none transition-all 
              /* 1. Jemný vnútorný tieň pre hĺbku (vždy prítomný) */
              shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
              
              /* 2. Žiara vo farbe témy pri kliknutí (Focus) */
              focus:border-[rgb(var(--brand-primary)/0.8)]
              focus:shadow-[0_0_15px_rgba(var(--brand-primary),0.15),inset_0_2px_4px_rgba(0,0,0,0.3)]" 
          />
        </div>
        
        <div className="w-44">
          <CustomDropdown label="Strana" name="side" options={SIDE_OPTIONS} />
        </div>
        
        <div className="w-44">
          <CustomDropdown label="Stav" name="status" options={STATUS_OPTIONS} />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Poznámka</label>
          <input 
            name="note" 
            placeholder="Voliteľné..." 
            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-zinc-200 rounded-xl px-4 py-3 outline-none transition-all 
              /* 1. Jemný vnútorný tieň pre hĺbku (vždy prítomný) */
              shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
              
              /* 2. Žiara vo farbe témy pri kliknutí (Focus) */
              focus:border-[rgb(var(--brand-primary)/0.8)]
              focus:shadow-[0_0_15px_rgba(var(--brand-primary),0.15),inset_0_2px_4px_rgba(0,0,0,0.3)]" 
          />
        </div>

        <button type="submit" className="bg-[rgb(var(--brand-primary))] hover:opacity-90 text-[var(--text-main)] px-8 py-3 rounded-xl font-medium flex items-center h-[50px] transition-all active:scale-95 shadow-lg shadow-bg-[rgb(var(--brand-primary))]/10">
          <Plus size={18} className="mr-2" /> Pridať
        </button>
      </form>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[var(--bg-input)]/50 text-xs text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)]/60">
            <tr>
              <th className="p-5 pl-8 font-semibold cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => requestSort('name')}>
                <div className="flex items-center">Meno <SortIcon column="name" /></div>
              </th>
              <th className="p-5 font-semibold cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => requestSort('side')}>
                <div className="flex items-center">Strana <SortIcon column="side" /></div>
              </th>
              <th className="p-5 font-semibold cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => requestSort('status')}>
                <div className="flex items-center">Stav <SortIcon column="status" /></div>
              </th>
              <th className="p-5 font-semibold">Poznámka</th>
              <th className="p-5 text-right pr-8 font-semibold">Akcie</th>
            </tr>
          </thead>
          <tbody>
            {sortedGuests.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-zinc-600">Zatiaľ žiadni hostia v zozname.</td></tr>
            )}
            {sortedGuests.map(guest => (
              <tr key={guest.id} className="border-b border-[var(--border-color)]/30 hover:bg-[var(--bg-input)]/20 transition-colors group">
                {editingId === guest.id ? (
                  <td colSpan={5} className="p-0">
                    <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => { 
                        e.preventDefault(); 
                        await updateGuest(guest.id, new FormData(e.currentTarget)); 
                        setEditingId(null); 
                        refresh(); 
                    }} className="flex items-center gap-4 p-4 pl-8  animate-in fade-in">
                      <input name="name" defaultValue={guest.name} className="flex-1 bg-[var(--bg-input)] border border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[rgb(var(--brand-primary))]" />
                      
                      <div className="w-40"><CustomDropdown name="side" options={SIDE_OPTIONS} defaultValue={guest.family_side} /></div>
                      <div className="w-40"><CustomDropdown name="status" options={STATUS_OPTIONS} defaultValue={guest.status} /></div>
                      
                      <input name="note" defaultValue={guest.note} className="flex-1 bg-[var(--bg-input)] border border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none" placeholder="Poznámka..." />
                      
                      <div className="flex gap-2">
                        <button type="submit" className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg"><Check size={18} /></button>
                        <button type="button" onClick={() => setEditingId(null)} className="p-2 text-[var(--text-muted)] hover:bg-zinc-700 rounded-lg"><X size={18} /></button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="p-5 pl-8 text-[var(--text-main)] font-bold text-sm tracking-tight">{guest.name}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-widest font-bold border ${getOption(guest.family_side, SIDE_OPTIONS).color}`}>
                        {getOption(guest.family_side, SIDE_OPTIONS).label}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-widest font-bold border ${getOption(guest.status, STATUS_OPTIONS).color}`}>
                        {getOption(guest.status, STATUS_OPTIONS).label}
                      </span>
                    </td>
                    <td className="p-5 text-[var(--text-muted)] text-xs font-semibold italic max-w-[200px] truncate">
                      {guest.note || <span className="opacity-30">-</span>}
                    </td>
                    <td className="p-5 text-right pr-8 space-x-1">
                      <button onClick={() => setEditingId(guest.id)} className="p-2 text-[var(--text-muted)] hover:text-[rgb(var(--brand-primary))] cursor-pointer hover:bg-[rgb(var(--brand-primary))]/10 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => { 
                        setGuestToDelete({id: guest.id, name: guest.name}); 
                        setIsDeleteModalOpen(true); 
                      }} className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 rounded-lg cursor-pointer transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteModal 
        isOpen={isDeleteModalOpen} 
        text={`Naozaj chcete odstrániť hosťa ${guestToDelete?.name}?`}
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={async () => { 
          if(guestToDelete) await deleteGuest(guestToDelete.id); 
          setIsDeleteModalOpen(false); 
          refresh(); 
        }} 
      />
    </div>
  );
}