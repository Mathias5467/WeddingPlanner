"use client";

import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Check, X, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { addGuest, deleteGuest, updateGuest } from '../actions';
import { DeleteModal } from './ui/DeleteModal';
import { CustomDropdown } from './ui/CustomDropdown'; 

const SIDE_OPTIONS = [
  { value: 'Bride', label: 'Nevesta', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { value: 'Groom', label: 'Ženích', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { value: 'Mutual', label: 'Spoloční', color: 'text-[var(--text-muted)] border-zinc-700' },
];

const STATUS_OPTIONS = [
  { value: 'Not Asked', label: 'Neoslovený', color: 'text-[var(--text-muted)] border-zinc-700' },
  { value: 'Asked', label: 'Oslovený', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'Will Come', label: 'Príde', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'Won\'t Come', label: 'Nepríde', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

const inputStyles = "w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-4 h-[42px] text-sm outline-none transition-all focus:border-[var(--brand-primary))] focus:shadow-[0_0_5px_var(--brand-primary)] ring-[var(--brand-primary)]";

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
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={14} className="ml-2 opacity-20" />;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={14} className="ml-2 text-[var(--brand-primary)]" /> : 
      <ChevronDown size={14} className="ml-2 text-[var(--brand-primary)]" />;
  };

  return (
    <div className="space-y-6">
      
      <form 
        onSubmit={async (e) => { 
            e.preventDefault(); 
            const form = e.currentTarget;
            const formData = new FormData(form);
            await addGuest(formData); 
            form.reset();
            refresh(); 
        }} 
        className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 p-6 rounded-[1rem] flex flex-wrap gap-4 items-end shadow-xl"
      >
        <div className="flex-[2] min-w-[200px]">
          <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-widest">Meno hosťa</label>
          <input autoComplete="off" name="name" required placeholder="Meno a priezvisko" className={inputStyles} />
        </div>
        <div className="w-40">
          <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-widest">Strana</label>
          <CustomDropdown name="side" options={SIDE_OPTIONS} />
        </div>
        <div className="w-44">
          <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-widest">Stav</label>
          <CustomDropdown name="status" options={STATUS_OPTIONS} />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-widest">Alergie</label>
          <input autoComplete='off' name="alergies" placeholder="..." className={inputStyles} />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-widest">Poznámka</label>
          <input autoComplete='off' name="note" placeholder="..." className={inputStyles} />
        </div>
        <button type="submit" className="bg-[var(--brand-primary)] cursor-pointer text-white px-6 h-[42px] rounded-lg font-bold flex items-center transition-all active:scale-95 shadow-lg shadow-[var(--brand-primary)]/20 hover:brightness-110">
          <Plus size={18} className="mr-2" /> Pridať
        </button>
      </form>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-[1rem] overflow-visible shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[var(--bg-input)] text-[10px] text-[var(--text-muted)] uppercase tracking-[0.15em] border-b border-[var(--border-color)]">
            <tr>
              <th className="p-5 pl-8 cursor-pointer group" onClick={() => requestSort('name')}>
                <div className="flex items-center group-hover:text-[var(--text-main)] transition-colors">Meno <SortIcon column="name" /></div>
              </th>
              <th className="p-5 cursor-pointer group" onClick={() => requestSort('side')}>
                <div className="flex items-center group-hover:text-[var(--text-main)] transition-colors">Strana <SortIcon column="side" /></div>
              </th>
              <th className="p-5 cursor-pointer group" onClick={() => requestSort('status')}>
                <div className="flex items-center group-hover:text-[var(--text-main)] transition-colors">Stav <SortIcon column="status" /></div>
              </th>
              <th className="p-5">Alergie</th>
              <th className="p-5">Poznámka</th>
              <th className="p-5 text-right pr-8">Akcie</th>
            </tr>
          </thead>
          <tbody>
            {sortedGuests.map(guest => {
              const isEditing = editingId === guest.id;
              
              if (isEditing) {
                return (
                  <tr key={guest.id} className="bg-[rgba(var(--brand-primary),0.05)] border-b border-[var(--border-color)]/50 h-[64px]">
                    <td className="px-3 pl-8">
                      <div className="flex items-center h-full">
                        <input autoComplete='off' form={`edit-form-${guest.id}`} name="name" defaultValue={guest.name} className={inputStyles} />
                      </div>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center h-full">
                        <CustomDropdown 
                          name="side" 
                          options={SIDE_OPTIONS} 
                          defaultValue={guest.family_side} 
                          form={`edit-form-${guest.id}`}
                        />
                      </div>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center h-full">
                        <CustomDropdown 
                          name="status" 
                          options={STATUS_OPTIONS} 
                          defaultValue={guest.status} 
                          form={`edit-form-${guest.id}`}
                        />
                      </div>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center h-full">
                        <input autoComplete='off' form={`edit-form-${guest.id}`} name="alergies" defaultValue={guest.alergies} className={inputStyles} />
                      </div>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center h-full">
                        <input autoComplete='off' form={`edit-form-${guest.id}`} name="note" defaultValue={guest.note} className={inputStyles} />
                      </div>
                    </td>
                    <td className="px-3 text-right pr-8">
                      <form 
                        id={`edit-form-${guest.id}`} 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          await updateGuest(guest.id, new FormData(form));
                          setEditingId(null);
                          refresh();
                        }} 
                        className="flex items-center justify-end gap-3 h-[42px]"
                      >
                        <button type="submit" className="text-emerald-500 cursor-pointer"><Check size={22} /></button>
                        <button type="button" onClick={() => setEditingId(null)} className="text-red-500 cursor-pointer"><X size={22} /></button>
                      </form>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={guest.id} className="border-b border-[var(--border-color)]/30 hover:bg-[var(--bg-input)]/30 transition-colors group">
                  <td className="p-5 pl-8 text-[var(--text-main)] font-bold text-sm tracking-tight">{guest.name}</td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] uppercase tracking-widest font-black border ${getOption(guest.family_side, SIDE_OPTIONS).color}`}>
                      {getOption(guest.family_side, SIDE_OPTIONS).label}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] uppercase tracking-widest font-black border ${getOption(guest.status, STATUS_OPTIONS).color}`}>
                      {getOption(guest.status, STATUS_OPTIONS).label}
                    </span>
                  </td>
                  <td className="p-5  text-xs font-bold">
                    {guest.alergies || <span className="opacity-10 font-normal text-[var(--text-main)]">-</span>}
                  </td>
                  <td className="p-5 text-[var(--text-muted)] text-xs italic max-w-[200px] truncate">
                    {guest.note || <span className="opacity-20">-</span>}
                  </td>
                  <td className="p-5 text-right pr-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditingId(guest.id)} className="p-2 text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 rounded-lg transition-colors cursor-pointer">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => { setGuestToDelete({id: guest.id, name: guest.name}); setIsDeleteModalOpen(true); }} className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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