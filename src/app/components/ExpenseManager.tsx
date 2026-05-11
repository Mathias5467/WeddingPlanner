"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit3, CheckCircle2, Circle, X, Info, Eye, Euro, Users, CreditCard, Search
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
  
  const [isAdding, setIsAdding] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<any>(null);
  const [expenseDetails, setExpenseDetails] = useState<any>(null);

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
      
      {/* HEADER: Search & Add */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-[2rem] shadow-xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hľadať výdavok..." 
            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl h-[42px] pl-12 pr-4 outline-none focus:border-[rgb(var(--brand-primary)/0.5)] transition-all text-sm"
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white px-6 h-[42px] rounded-xl font-black transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Plus size={18} /> Nový výdavok
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-main)]/30 border-b border-[var(--border-color)]">
              <tr className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest">
                <th className="p-5 pl-10">Výdavok</th>
                <th className="p-5 text-center">Celkovo</th>
                <th className="p-5 text-center text-[var(--brand-primary)]">Na osobu</th>
                <th className="p-5 text-center">Stav</th>
                <th className="p-5 text-right pr-10">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/50">
            {filteredExpenses.map((ex) => {
              const total = ex.unit_price * ex.quantity;
              const perPerson = totalGuests > 0 ? total / totalGuests : 0;

              return (
                <tr key={ex.id} className="group hover:bg-[var(--brand-light)]/5 transition-colors">
                  <td className="p-5 pl-10">
                    <p className="font-bold text-[var(--text-main)] text-sm leading-tight">{ex.name}</p>
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tighter opacity-60">
                      {ex.category_name}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <span className="font-black text-sm text-[var(--text-main)]">{total.toFixed(2)} €</span>
                  </td>
                  <td className="p-5 text-center">
                    <span className="text-xs font-black text-[var(--brand-primary)] italic">
                      {perPerson.toFixed(2)} €
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <button 
                      onClick={() => toggleBooked(ex.id, ex.is_booked ? 0 : 1).then(loadData)} 
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black transition-all cursor-pointer ${ex.is_booked ? 'text-emerald-400 bg-emerald-500/10 border' : 'text-orange-400 bg-orange-500/10 border'}`}
                    >
                      {ex.is_booked ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      {ex.is_booked ? 'ZAJEDNANÉ' : 'ČAKÁ'}
                    </button>
                  </td>
                  <td className="p-5 text-right pr-10 space-x-1">
                    <button onClick={() => setExpenseDetails(ex)} className="p-2 text-[var(--text-muted)] hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"><Eye size={18} /></button>
                    <button onClick={() => setExpenseToEdit(ex)} className="p-2 text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-all cursor-pointer"><Edit3 size={18} /></button>
                    <button onClick={() => setExpenseToDelete(ex)} className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-all cursor-pointer"><Trash2 size={18} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {isAdding && (
        <ExpenseFormModal 
          title="Nový výdavok"
          categories={categories}
          onClose={() => setIsAdding(false)}
          onSubmit={async (fd: FormData) => { await addExpense(fd); loadData(); }}
        />
      )}

      {expenseToEdit && (
        <ExpenseFormModal 
          title="Upraviť výdavok"
          expense={expenseToEdit}
          categories={categories}
          onClose={() => setExpenseToEdit(null)}
          onSubmit={async (fd: FormData) => { await updateExpense(expenseToEdit.id, fd); loadData(); }}
        />
      )}

      {expenseDetails && (
        <DetailsExpenseModal 
          expense={expenseDetails} 
          totalGuests={totalGuests}
          onClose={() => setExpenseDetails(null)} 
        />
      )}

      <DeleteModal 
        isOpen={!!expenseToDelete} 
        text={`Zmazať výdavok ${expenseToDelete?.name}?`} 
        onClose={() => setExpenseToDelete(null)} 
        onConfirm={async () => { await deleteExpense(expenseToDelete.id); setExpenseToDelete(null); loadData(); }} 
      />
    </div>
  );
}


function ExpenseFormModal({ title, expense, categories, onClose, onSubmit }: any) {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in" onClick={onClose} />
      <form 
        onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          await onSubmit(new FormData(e.currentTarget));
          onClose();
        }}
        className="relative bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 space-y-6"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[var(--bg-input)] rounded-full cursor-pointer"><X size={24}/></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Názov výdavku</label>
            <input name="name" required autoComplete="off" defaultValue={expense?.name} placeholder="Čo kupujete?" className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl px-4 h-[42px] mt-1 outline-none focus:border-[var(--brand-primary)] text-sm" />
          </div>
          
          <CustomDropdown 
            label="Kategória" 
            name="category_id" 
            height="h-[42px]"
            defaultValue={expense ? String(expense.category_id) : undefined} 
            options={categories.map((c: any) => ({ value: String(c.id), label: c.name, color: '' }))} 
          />
          
          <PremiumAmountInput name="unit_price" label="Jedn. cena (€)" defaultValue={expense?.unit_price} height="h-[42px]" />
          
          <div>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Počet kusov</label>
            <input name="quantity" type="number" defaultValue={expense?.quantity || 1} className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl px-4 h-[42px] mt-1 outline-none text-sm" />
          </div>

          <PremiumAmountInput name="deposit" label="Záloha (€)" defaultValue={expense?.deposit} height="h-[42px]" />

          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Poznámka</label>
            <input name="note" defaultValue={expense?.note} autoComplete="off" placeholder="Doplňujúce info..." className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl px-4 h-[42px] mt-1 outline-none text-sm" />
          </div>

          <div className="md:col-span-2 flex items-center gap-3 bg-[var(--bg-input)] px-4 h-[42px] rounded-xl border border-[var(--border-color)]">
            <input name="is_booked" type="checkbox" defaultChecked={expense?.is_booked} className="w-4 h-4 accent-[var(--brand-primary)]" />
            <span className="text-xs font-bold text-[var(--text-main)]">Tento výdavok je už zajednaný / kúpený</span>
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <button type="button" onClick={onClose} className="flex-1 h-[42px] border  rounded-xl bg-[var(--bg-input)] text-[var(--text-muted)] font-bold transition-all cursor-pointer text-sm">Zrušiť</button>
          <button type="submit" className="flex-1 h-[42px] rounded-xl bg-[var(--brand-primary)] text-white font-black shadow-lg hover:opacity-90 active:scale-95 transition-all text-sm cursor-pointer">
            {expense ? 'Uložiť zmeny' : 'Pridať výdavok'}
          </button>
        </div>
      </form>
    </div>
  );
}


function DetailsExpenseModal({ expense, totalGuests, onClose }: any) {
  const total = expense.unit_price * expense.quantity;
  const toPay = total - expense.deposit;
  const perPerson = totalGuests > 0 ? total / totalGuests : 0;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-black text-[var(--text-main)] leading-tight">{expense.name}</h3>
              <span className="text-xs font-black text-[var(--brand-primary)] uppercase tracking-widest">{expense.category_name}</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[var(--bg-input)] cursor-pointer rounded-full transition-colors"><X size={24}/></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailCard icon={<Euro size={16}/>} label="Jedn. cena" value={`${expense.unit_price.toFixed(2)} €`} subValue={`Množstvo: ${expense.quantity}x`} />
            <DetailCard icon={<CreditCard size={16}/>} label="Záloha" value={`${expense.deposit.toFixed(2)} €`} color="text-emerald-400" />
            <DetailCard icon={<Info size={16}/>} label="Doplatiť" value={`${toPay.toFixed(2)} €`} color="text-orange-400" />
            <DetailCard icon={<Users size={16}/>} label="Na osobu" value={`${perPerson.toFixed(2)} €`} color="text-[var(--brand-primary)]" />
          </div>

          <div className="bg-[var(--bg-input)] p-5 rounded-2xl border border-[var(--border-color)]">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Celkový náklad</span>
                <span className="text-2xl font-black text-[var(--text-main)]">{total.toFixed(2)} €</span>
             </div>
          </div>

          {expense.note && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 tracking-widest">Poznámka</label>
              <p className="text-sm text-[var(--text-main)] bg-[var(--bg-input)]/50 p-4 rounded-xl border border-[var(--border-color)] italic leading-relaxed">
                "{expense.note}"
              </p>
            </div>
          )}
        </div>
        
        <button onClick={onClose} className="w-full cursor-pointer p-5 bg-[var(--brand-primary)] text-white font-black hover:bg-[var(--brand-hover)] transition-colors border-t border-[var(--border-color)] text-sm">
          Zatvoriť
        </button>
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value, subValue, color = "text-[var(--text-main)]" }: any) {
  return (
    <div className="bg-[var(--bg-input)]/50 border border-[var(--border-color)] p-4 rounded-2xl">
      <div className="flex items-center gap-2 mb-1 text-[var(--text-muted)]">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
      </div>
      <p className={`text-lg font-black ${color}`}>{value}</p>
      {subValue && <p className="text-[9px] text-[var(--text-muted)] font-bold">{subValue}</p>}
    </div>
  );
}