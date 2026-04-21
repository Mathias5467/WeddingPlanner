"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, CheckCircle2, Circle, Calendar as CalendarIcon, 
  Hash, Search, GripVertical, Clock, X, Edit3 
} from 'lucide-react';
import { getTasks, addTask, toggleTask, deleteTask, updateTasksOrder, updateTask } from '../actions';
import { DeleteModal } from './ui/DeleteModal';
import { PremiumDatePicker } from './ui/PremiumDatePicker';

export function TaskManager() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<'manual' | 'date'>('manual');
  
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [taskToEdit, setTaskToEdit] = useState<any>(null);

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  useEffect(() => { loadTasks(); }, []);

  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter(t => 
      t.text.toLowerCase().includes(search.toLowerCase()) || 
      (t.tags && t.tags.toLowerCase().includes(search.toLowerCase()))
    );

    if (sortBy === 'date') {
      result.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    }
    return result;
  }, [tasks, search, sortBy]);

  const handleReorder = (newOrder: any[]) => {
    setTasks(newOrder);
    if (sortBy === 'manual') {
      updateTasksOrder(newOrder.map(t => t.id));
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      
      <div className="flex flex-wrap gap-4 items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)]/60 p-5 rounded-[2rem] shadow-2xl">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input 
            placeholder="Hľadať úlohu alebo #tag..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-[rgb(var(--brand-primary)/0.5)] transition-all shadow-inner"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-[var(--border-color)] shadow-inner">
          <button 
            onClick={() => setSortBy('manual')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${sortBy === 'manual' ? 'bg-[var(--brand-light)] text-[rgb(var(--brand-primary))]' : 'text-[var(--text-muted)] hover:text-zinc-300'}`}
          >
            <GripVertical size={14} /> Drag & Drop
          </button>
          <button 
            onClick={() => setSortBy('date')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${sortBy === 'date' ? 'bg-[var(--brand-light)] text-[rgb(var(--brand-primary))]' : 'text-[var(--text-muted)] hover:text-zinc-300'}`}
          >
            <Clock size={14} /> Kalendár
          </button>
        </div>
      </div>

      <form 
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          await addTask(new FormData(form));
          form.reset();
          loadTasks();
        }}
        className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 p-8 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-12 gap-6 shadow-2xl relative z-20"
      >
        <div className="md:col-span-5">
          <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-[0.2em]">Názov novej úlohy</label>
          <input name="text" autoComplete='off' required placeholder="Čo treba vybaviť?" className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl p-4 mt-2 text-sm outline-none focus:border-[rgb(var(--brand-primary)/0.5)] shadow-inner transition-all" />
        </div>
        
        <div className="md:col-span-3">
          <PremiumDatePicker name="due_date" label="Termín (Deadline)" />
        </div>

        <div className="md:col-span-3">
          <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-[0.2em]">Hashtagy</label>
          <div className="relative">
            <Hash className="absolute left-4 top-[28px] text-[var(--text-muted)]" size={18} />
            <input autoComplete='off' name="tags" placeholder="napr. #foto #jedlo" className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl p-4 pl-12 mt-2 text-sm outline-none focus:border-[rgb(var(--brand-primary)/0.5)] shadow-inner transition-all" />
          </div>
        </div>

        <div className="md:col-span-1 flex items-end">
          <button type="submit" className="w-full h-[56px] bg-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-hover))] text-[var(--text-main)] rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-[rgb(var(--brand-primary)/0.2)] flex items-center justify-center cursor-pointer">
            <Plus size={28} />
          </button>
        </div>
      </form>

      <Reorder.Group axis="y" values={filteredAndSortedTasks} onReorder={handleReorder} className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredAndSortedTasks.map((task) => (
            <Reorder.Item 
              key={task.id} 
              value={task}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-[var(--bg-card)] border border-[var(--border-color)]/60 py-1 px-5 rounded-[1.5rem] flex items-center gap-5 group transition-all shadow-xl hover:border-zinc-700 ${task.completed ? 'opacity-50' : ''}`}
            >
              {sortBy === 'manual' && <GripVertical className="text-zinc-800 group-hover:text-zinc-600 cursor-grab active:cursor-grabbing" size={20} />}
              
              <button 
                onClick={async () => { await toggleTask(task.id, task.completed ? 0 : 1); loadTasks(); }}
                className={`transition-all transform hover:scale-110 cursor-pointer ${task.completed ? 'text-[rgb(var(--brand-primary))]' : 'text-zinc-800 hover:text-zinc-600'}`}
              >
                {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-base font-bold transition-all ${task.completed ? 'text-zinc-600 line-through' : 'text-zinc-100'}`}>
                  {task.text}
                </p>
                <div className="flex flex-wrap gap-4 mt-2">
                  {task.due_date && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-main)]/60 bg-zinc-950 px-3 py-1 rounded-full border border-[var(--border-color)] uppercase tracking-tighter shadow-inner">
                      <Clock size={12} className="text-[rgb(var(--brand-primary))]" /> 
                      {new Date(task.due_date).toLocaleString('sk-SK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {task.tags && task.tags.split(' ').map((tag: string, i: number) => (
                    <span key={i} className="text-[10px] font-black text-[rgb(var(--brand-primary))] bg-[var(--brand-light)] px-3 py-1 rounded-full uppercase tracking-widest border border-[rgb(var(--brand-primary)/0.1)]">
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => setTaskToEdit(task)}
                  className="p-3 text-[var(--text-muted)] hover:text-green-500 hover:bg-green-500/10 rounded-xl transition-all cursor-pointer"
                >
                  <Edit3 size={15} />
                </button>
                <button 
                  onClick={() => setTaskToDelete(task)}
                  className="p-3 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      <DeleteModal 
        isOpen={!!taskToDelete}
        text="Odstrániť túto úlohu?"
        onClose={() => setTaskToDelete(null)}
        onConfirm={async () => {
          if (taskToDelete) {
            await deleteTask(taskToDelete.id);
            setTaskToDelete(null);
            loadTasks();
          }
        }}
      />

      {taskToEdit && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setTaskToEdit(null)} />
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              await updateTask(taskToEdit.id, new FormData(e.currentTarget));
              setTaskToEdit(null);
              loadTasks();
            }}
            className="relative bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Upraviť úlohu</h3>
              <button type="button" onClick={() => setTaskToEdit(null)} className="p-2 text-[var(--text-muted)] hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"><X size={24}/></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Názov úlohy</label>
                <input name="text" required defaultValue={taskToEdit.text} className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl p-4 mt-2 text-sm outline-none focus:border-[rgb(var(--brand-primary)/0.5)] shadow-inner" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PremiumDatePicker name="due_date" label="Nový termín" defaultValue={taskToEdit.due_date} />
                <div>
                  <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Hashtagy</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-[28px] text-[var(--text-muted)]" size={18} />
                    <input name="tags" defaultValue={taskToEdit.tags} placeholder="#tagy" className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl p-4 pl-12 mt-2 text-sm outline-none focus:border-[rgb(var(--brand-primary)/0.5)] shadow-inner" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setTaskToEdit(null)} className="flex-1 p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-all cursor-pointer">Zrušiť</button>
              <button type="submit" className="flex-1 p-4 rounded-2xl bg-[rgb(var(--brand-primary))] hover:opacity-90 text-[var(--text-main)] font-black shadow-lg shadow-[rgb(var(--brand-primary)/0.2)] cursor-pointer">
                Uložiť zmeny
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}