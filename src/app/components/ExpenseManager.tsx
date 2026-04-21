"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Edit3, CheckCircle2, Circle, X, Info
} from 'lucide-react';
import { 
  getExpenses, getExpenseCategories, addExpense, 
  deleteExpense, toggleBooked, getDashboardStats, updateExpense 
} from '../actions';
import { DeleteModal } from './ui/DeleteModal';
import { CustomDropdown } from './ui/CustomDropdown';
import { PremiumAmountInput } from './ui/PremiumAmountInput';

export function ExpenseManager() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalGuests, setTotalGuests] = useState(0);
  const [search, setSearch] = useState("");
  
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<any>(null);

  const loadData = async () => {
    const [e, c, stats] = await Promise.all([getExpenses(), getExpenseCategories(), getDashboardStats()]);
    setExpenses(e);
    setCategories(c);
    setTotalGuests(stats.totalGuests || 0);
  };

  useEffect(() => { loadData(); }, []);

  const filteredExpenses = expenses.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      
      {/* FORMULÁR PRIDANIA */}
      <form 
        onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const form = e.currentTarget; 
          const fd = new FormData(form);
          await addExpense(fd);
          form.reset();
          loadData();
        }}
        className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-[2rem] shadow-2xl space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1">Výdavok</label>
            <input name="name" required autoComplete="off" placeholder="Čo kupujete?" className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl p-3 mt-1 outline-none focus:border-[rgb(var(--brand-primary)/0.5)] transition-all" />
          </div>
          <div className="md:col-span-2">
            {categories.length > 0 && (
              <CustomDropdown label="Kategória" name="category_id" options={categories.map(c => ({ value: String(c.id), label: c.name, color: '' }))} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PremiumAmountInput name="unit_price" label="Jedn. cena (€)" />
          <div>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1">Počet kusov</label>
            <input name="quantity" type="number" defaultValue={1} className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl p-3 mt-1 outline-none focus:border-[rgb(var(--brand-primary)/0.5)] h-[46px]" />
          </div>
          <PremiumAmountInput name="deposit" label="Záloha (€)" />
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 cursor-pointer group bg-[var(--bg-input)] p-3 rounded-xl border border-[var(--border-color)] w-full h-[46px] transition-all hover:border-[rgb(var(--brand-primary)/0.3)]">
              <input name="is_booked" type="checkbox" className="w-5 h-5 accent-[rgb(var(--brand-primary))]" />
              <span className="text-xs font-bold text-[var(--text-main)]">Zajednané?</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <input name="note" autoComplete="off" placeholder="Poznámka..." className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl p-3 outline-none focus:border-[rgb(var(--brand-primary)/0.5)]" />
          <button type="submit" className="bg-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-hover))] text-white px-8 rounded-xl font-black transition-all active:scale-95 shadow-lg flex items-center gap-2 cursor-pointer h-[48px]">
            <Plus size={20} /> Pridať
          </button>
        </div>
      </form>

      {/* TABUĽKA VÝDAVKOV */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[var(--bg-main)]/30 border-b border-[var(--border-color)]">
              <tr className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest">
                <th className="p-4 pl-8">Výdavok</th>
                <th className="p-4 text-center">Jedn. cena</th>
                <th className="p-4 text-center">Množstvo</th>
                <th className="p-4 text-center">Záloha</th>
                <th className="p-4 text-center">Doplatiť</th>
                <th className="p-4 text-center">Zajednané</th>
                <th className="p-4 text-center font-bold text-[var(--text-main)]">Celkovo</th>
                <th className="p-4 text-center text-[var(--brand-primary)]">Na osobu</th>
                <th className="p-4 text-right pr-8">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/50">
            {filteredExpenses.map((ex) => {
              const total = ex.unit_price * ex.quantity;
              const toPay = total - ex.deposit;
              const perPerson = totalGuests > 0 ? total / totalGuests : 0;

              return (
                <React.Fragment key={ex.id}>
                  <tr className="group hover:bg-[var(--brand-light)]/5 transition-colors border-t border-[var(--border-color)]/40">
                    <td className="p-4 pl-8">
                      <p className="font-bold text-[var(--text-main)] text-sm tracking-tight">{ex.name}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-muted)] uppercase tracking-widest">
                        {ex.category_name}
                      </span>
                    </td>
                    <td className="p-4 text-center text-xs font-medium text-[var(--text-main)]">{ex.unit_price.toFixed(2)} €</td>
                    <td className="p-4 text-center text-xs font-bold text-[var(--text-muted)]">× {ex.quantity}</td>
                    <td className="p-4 text-center text-xs font-bold text-emerald-500 bg-emerald-500/5">{ex.deposit.toFixed(2)} €</td>
                    <td className="p-4 text-center text-xs font-black text-orange-400">{toPay.toFixed(2)} €</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => toggleBooked(ex.id, ex.is_booked ? 0 : 1).then(loadData)} 
                        className={`p-2 rounded-lg transition-all cursor-pointer ${ex.is_booked ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-600 bg-zinc-800/50 hover:bg-zinc-800'}`}
                      >
                        {ex.is_booked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                    </td>
                    <td className="p-4 text-center font-black text-sm text-[var(--text-main)] bg-[var(--brand-light)]/10">{total.toFixed(2)} €</td>
                    <td className="p-4 text-center text-xs text-[var(--brand-primary)] font-black italic">{perPerson.toFixed(2)} €</td>
                    <td className="p-4 text-right pr-8 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setExpenseToEdit(ex)} className="p-2 text-[var(--text-muted)] hover:text-[rgb(var(--brand-primary))] transition-colors cursor-pointer"><Edit3 size={16} /></button>
                      <button onClick={() => setExpenseToDelete(ex)} className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                    </td>
                  </tr>

                  {ex.note && (
                    <tr className="bg-[var(--bg-main)]/20">
                      <td colSpan={9} className="px-8 py-2 pb-4">
                        <div className="flex items-start gap-2 text-[var(--text-muted)] bg-[var(--bg-input)]/30 p-3 rounded-xl border border-[var(--border-color)]/30">
                          <Info size={14} className="mt-0.5 text-[rgb(var(--brand-primary)/0.5)] flex-shrink-0" />
                          <p className="text-[11px] font-medium leading-relaxed italic">
                            <span className="text-[9px] uppercase font-black not-italic mr-2 opacity-50 tracking-tighter">Poznámka:</span>
                            {ex.note}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>

      {/* MODÁLY */}
      <DeleteModal 
        isOpen={!!expenseToDelete} 
        text={`Zmazať ${expenseToDelete?.name}?`} 
        onClose={() => setExpenseToDelete(null)} 
        onConfirm={async () => { await deleteExpense(expenseToDelete.id); setExpenseToDelete(null); loadData(); }} 
      />

      {expenseToEdit && (
        <EditExpenseModal 
          expense={expenseToEdit} 
          categories={categories}
          onClose={() => setExpenseToEdit(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}

// --- EDIT MODAL ---
function EditExpenseModal({ expense, categories, onClose, onRefresh }: any) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      <form 
        onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const form = e.currentTarget; 
          const fd = new FormData(form);
          await updateExpense(expense.id, fd);
          onRefresh();
          onClose();
        }}
        className="relative bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Upraviť výdavok</h3>
          <button type="button" onClick={onClose} className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-input)] rounded-xl transition-colors cursor-pointer"><X size={24}/></button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1">Názov</label>
            <input name="name" required autoComplete="off" defaultValue={expense.name} className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl p-3 mt-1 outline-none focus:border-[rgb(var(--brand-primary))]" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <CustomDropdown label="Kategória" name="category_id" defaultValue={String(expense.category_id)} options={categories.map((c: any) => ({ value: String(c.id), label: c.name, color: '' }))} />
          </div>
          
          <PremiumAmountInput name="unit_price" label="Jednotková cena (€)" defaultValue={expense.unit_price} />
          <div>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1">Počet kusov</label>
            <input name="quantity" type="number" defaultValue={expense.quantity} className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl p-3 mt-1 outline-none h-[46px]" />
          </div>
          
          <PremiumAmountInput name="deposit" label="Záloha (€)" defaultValue={expense.deposit} />
          
          <div>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1">Poznámka</label>
            <input name="note" autoComplete="off" defaultValue={expense.note} className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl p-3 mt-1 outline-none h-[46px]" />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl bg-[var(--bg-input)] text-[var(--text-muted)] font-bold transition-all cursor-pointer">Zrušiť</button>
          <button type="submit" className="flex-1 p-4 rounded-2xl bg-[rgb(var(--brand-primary))] hover:opacity-90 text-white font-black shadow-lg cursor-pointer transition-all active:scale-95">
            Uložiť zmeny
          </button>
        </div>
      </form>
    </div>
  );
}