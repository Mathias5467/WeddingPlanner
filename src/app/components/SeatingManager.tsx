"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, PanInfo, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  Plus, Minus, Maximize2, Trash2, LayoutGrid, 
  Search, UserPlus, UserMinus, RotateCw, X 
} from 'lucide-react';
import { 
  getTables, addTable, updateTablePos, 
  updateTableCapacity, deleteTable, getTableSeats, 
  assignGuestToSeat, unassignGuest, updateTableRotation 
} from '../actions';
import { DeleteModal } from './ui/DeleteModal';


interface Table { id: number; name: string; shape: string; capacity: number; x_pos: number; y_pos: number; rotation: number; }
interface Seat { id: number; table_id: number; guest_id: number; seat_number: number; guest_name: string; family_side: string; allergies?: string; }
interface Guest { id: number; name: string; family_side: string; allergies?: string; }

interface TableViewProps {
  table: Table;
  seats: Seat[];
  onDragEnd: (id: number, info: PanInfo) => void;
  onRefresh: () => void;
  onDeleteRequest: (table: Table) => void;
  onEditRequest: (id: number) => void;
  zoom: number;
}

export function SeatingManager({ guests }: { guests: Guest[] }) {
  const [tables, setTables] = useState<Table[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultCapacity, setDefaultCapacity] = useState(8);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadData = async () => {
    const [t, s] = await Promise.all([getTables(), getTableSeats()]);
    setTables(t as Table[]);
    setSeats(s as Seat[]);
  };

  useEffect(() => { loadData(); }, []);

  const currentEditingTable = useMemo(() => 
    tables.find(t => t.id === editingId), 
    [tables, editingId]
  );

  const handleDragEnd = useCallback(async (id: number, info: PanInfo) => {
    const table = tables.find(t => t.id === id);
    if (table) {
      const newX = table.x_pos + (info.offset.x / zoom);
      const newY = table.y_pos + (info.offset.y / zoom);
      setTables(prev => prev.map(t => t.id === id ? { ...t, x_pos: newX, y_pos: newY } : t));
      await updateTablePos(id, newX, newY);
    }
  }, [tables, zoom]);

  return (
    <div className="relative h-[calc(100vh-180px)] bg-[var(--bg-main)] rounded-3xl overflow-hidden border border-[var(--border-color)] shadow-inner transition-colors">
      
      <div className="absolute top-6 right-6 z-[150] flex flex-col gap-2">
        <div className="flex gap-2 bg-[var(--bg-card)]/90 backdrop-blur-md p-2 rounded-2xl border border-[var(--border-color)] shadow-xl">
          <button onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))} className="p-2 hover:bg-[var(--brand-light)] rounded-xl text-[var(--text-muted)] cursor-pointer transition-colors"><Plus size={18}/></button>
          <button onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))} className="p-2 hover:bg-[var(--brand-light)] rounded-xl text-[var(--text-muted)] cursor-pointer transition-colors"><Minus size={18}/></button>
          <button onClick={() => setZoom(1)} className="p-2 hover:bg-[var(--brand-light)] rounded-xl text-[var(--text-muted)] border-l border-[var(--border-color)] ml-1 cursor-pointer transition-colors"><Maximize2 size={16}/></button>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 rounded-2xl p-5 font-black text-white text-sm shadow-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] shadow-[var(--brand-light)] transition-all active:scale-95 cursor-pointer">
          <LayoutGrid size={20} />
          <span>Pridať stôl</span>
        </button>
      </div>

      <div className="w-full h-full cursor-grab active:cursor-grabbing overflow-auto custom-scrollbar bg-grid">
        <motion.div 
            animate={{ scale: zoom }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative min-w-[4000px] min-h-[4000px] origin-top-left p-80"
        >
          {tables.map((table) => (
            <TableView 
              key={table.id} 
              table={table} 
              zoom={zoom}
              seats={seats.filter((s: Seat) => s.table_id === table.id)}
              onDragEnd={handleDragEnd}
              onRefresh={loadData}
              onDeleteRequest={(t: Table) => setTableToDelete(t)}
              onEditRequest={(id: number) => setEditingId(id)}
            />
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
            <CreateTableModal 
              onClose={() => setIsModalOpen(false)} 
              defaultCap={defaultCapacity} 
              onCreated={(cap: number) => { setDefaultCapacity(cap); loadData(); }} 
            />
        )}

        {currentEditingTable && (
            <TableDetailEditor 
                table={currentEditingTable} 
                guests={guests} 
                seats={seats} 
                onClose={() => setEditingId(null)} 
                onRefresh={loadData}
                onDelete={() => setTableToDelete(currentEditingTable)}
            />
        )}
      </AnimatePresence>

      {tableToDelete && (
        <DeleteModal 
          isOpen={!!tableToDelete} 
          text={`Odstrániť stôl ${tableToDelete.name}?`} 
          onClose={() => setTableToDelete(null)} 
          onConfirm={async () => { 
            if (tableToDelete) {
              await deleteTable(tableToDelete.id); 
              setTableToDelete(null);
              setEditingId(null);
              loadData(); 
            }
          }} 
        />
      )}
    </div>
  );
}

function TableView({ table, seats, onDragEnd, onRefresh, onDeleteRequest, onEditRequest, zoom }: TableViewProps) {
    const isDragging = useRef(false);
    const isRound = table.shape === 'round';
    const capacity = table.capacity;
    const dragControls = useDragControls();
    
    const seatSize = 44;
    const seatSpacing = 68;
    const tableHeight = 120;
    const peoplePerSide = Math.ceil(capacity / 2);
    const tableWidth = isRound ? 120 : Math.max(120, peoplePerSide * seatSpacing);

    const getSeatPos = (i: number) => {
        if (isRound) {
            const angle = (i * 2 * Math.PI) / capacity;
            const radius = 95;
            return { x: (tableWidth / 2) + Math.cos(angle) * radius - 22, y: (tableHeight / 2) + Math.sin(angle) * radius - 22 };
        }  else {
            const isTop = i < peoplePerSide;
            const column = isTop ? i : i - peoplePerSide;
            const rowWidth = (peoplePerSide - 1) * seatSpacing;
            const startX = (tableWidth - rowWidth) / 2 - 22;
            return { x: startX + (column * seatSpacing), y: isTop ? -55 : tableHeight + 11 };
        }
    };

    return (
        <motion.div
            drag 
            dragMomentum={false}
            dragControls={dragControls}
            dragListener={false}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={(_, info) => { 
                onDragEnd(table.id, info); 
                setTimeout(() => (isDragging.current = false), 50); 
            }}
            animate={{ x: table.x_pos, y: table.y_pos, rotate: table.rotation }}
            className="absolute group select-none"
            style={{ zIndex: 10 }}
        >
            <div className="relative" style={{ width: tableWidth, height: tableHeight }}>
                <motion.div 
                    onPointerDown={(e) => dragControls.start(e)}
                    onTap={() => { if (!isDragging.current) onEditRequest(table.id); }}
                    className={`absolute inset-0 z-10 flex flex-col items-center justify-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl backdrop-blur-md transition-all cursor-pointer
                        ${isRound ? 'rounded-full' : 'rounded-3xl'} group-hover:border-[var(--brand-primary)]`}
                >
                    <motion.p 
                        animate={{ rotate: -table.rotation }} 
                        className="text-xs font-black text-[var(--text-main)] px-4 text-center leading-tight uppercase tracking-tighter"
                    >
                        {table.name}
                    </motion.p>
                </motion.div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all z-30">
                    <button 
                        type="button" 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e: any) => {
                            e.stopPropagation();
                            const currentRot = table.rotation || 0;
                            updateTableRotation(table.id, (currentRot + 45) % 360).then(onRefresh);
                        }} 
                        className="p-3 bg-[var(--bg-card)] border-2 border-[var(--brand-primary)] rounded-full text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white shadow-2xl cursor-pointer active:scale-90 pointer-events-auto transition-all z-30"
                    >
                        <RotateCw size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {Array.from({ length: capacity }).map((_, i) => {
                const pos = getSeatPos(i);
                const seatData = seats.find((s: Seat) => s.table_id === table.id && s.seat_number === i);
                return (
                    <div 
                        key={i} 
                        className="absolute transition-all duration-300 z-30 hover:z-[100]" 
                        style={{ left: pos.x, top: pos.y, width: 44, height: 44 }}
                    >
                        <motion.div 
                            animate={{ rotate: -table.rotation }}
                            className="group/seat relative w-full h-full"
                        >
                            <div className={`w-full h-full rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-lg transition-colors
                                ${seatData 
                                    ? (seatData.family_side === 'Bride' ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400' : 'bg-sky-500/20 border-sky-500 text-sky-600 dark:text-sky-400') 
                                    : 'bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-muted)]'}`}
                            >
                                {seatData ? seatData.guest_name[0] : i + 1}
                            </div>

                            {seatData && (
                                <div className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 hidden group-hover/seat:block z-[9999] pointer-events-none animate-in fade-in zoom-in-95">
                                    
                                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1.5 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] whitespace-nowrap text-center opacity-100">
                                        
                                        <p className="text-xs font-bold text-[var(--text-main)] mb-0.5">{seatData.guest_name}</p>
                                        
                                        <p className={`text-[8px] uppercase font-black tracking-widest ${seatData.family_side === 'Bride' ? 'text-rose-400' : 'text-sky-400'}`}>
                                            {seatData.family_side === 'Bride' ? 'Nevesta' : 'Ženích'}
                                        </p>

                                        {seatData.allergies && (
                                            <p className="text-[10px] text-amber-400 font-bold mt-1.5 max-w-[120px] whitespace-normal leading-tight">
                                                ⚠️ {seatData.allergies}
                                            </p>
                                        )}
                                    </div>

                                    <div className="w-2 h-2 bg-[var(--bg-card)] border-r border-b border-[var(--border-color)] rotate-45 mx-auto -mt-1 opacity-100"></div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                );
            })}
        </motion.div>
    );
}

function TableDetailEditor({ table, guests, seats, onClose, onRefresh, onDelete }: any) {
    const [search, setSearch] = useState("");
    const [activeSeat, setActiveSeat] = useState<number | null>(null);

    const unseatedGuests = useMemo(() => {
        return guests.filter((guest: Guest) => !seats.some((s: Seat) => s.guest_id === guest.id));
    }, [guests, seats]);

    const filteredGuests = useMemo(() => {
        return unseatedGuests.filter((g: Guest) => g.name.toLowerCase().includes(search.toLowerCase()));
    }, [unseatedGuests, search]);

    const isRound = table.shape === 'round';
    const capacity = table.capacity;
    const seatSpacing = 85;
    const peoplePerSide = Math.ceil(capacity / 2);
    const tableWidth = isRound ? 220 : Math.max(220, peoplePerSide * seatSpacing);
    const tableHeight = 220;

    const getSeatPos = (i: number) => {
        if (isRound) {
            const angle = (i * 2 * Math.PI) / capacity;
            const radius = 180;
            return { x: Math.cos(angle) * radius + (tableWidth / 2) - 32, y: Math.sin(angle) * radius + (tableHeight / 2) - 32 };
        } else {
            const isTop = i < peoplePerSide;
            const column = isTop ? i : i - peoplePerSide;
            const rowWidth = (peoplePerSide - 1) * seatSpacing;
            const startX = (tableWidth - rowWidth) / 2 - 32;
            return { x: startX + (column * seatSpacing), y: isTop ? -90 : tableHeight + 30 };
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-[var(--bg-main)] flex overflow-hidden"
        >
            <div className="w-80 border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col shadow-2xl z-50">
                <div className="p-6 border-b border-[var(--border-color)]">
                    <h3 className="font-black text-xl text-[var(--text-main)] mb-4 uppercase tracking-tighter">Hostia</h3>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                        <input 
                            placeholder="Hľadať..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-[var(--text-main)] outline-none focus:border-[rgb(var(--brand-primary))]" 
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {filteredGuests.length > 0 ? filteredGuests.map((g: Guest) => (
                        <button 
                            key={g.id} 
                            disabled={activeSeat === null}
                            onClick={async () => { 
                                if (activeSeat !== null) { 
                                    await assignGuestToSeat(table.id, activeSeat, g.id); 
                                    setActiveSeat(null); 
                                    onRefresh(); 
                                } 
                            }} 
                            className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between group text-left
                                ${activeSeat !== null 
                                    ? 'bg-[var(--bg-card)] border-[rgb(var(--brand-primary))] shadow-md hover:scale-[1.02] cursor-pointer' 
                                    : 'bg-[var(--bg-input)] border-transparent opacity-60'}`}
                        >
                            <div>
                                <p className="text-sm font-black text-[var(--text-main)]">{g.name}</p>
                                <p className={`text-[10px] font-black uppercase tracking-wider ${g.family_side === 'Bride' ? 'text-rose-500' : 'text-sky-500'}`}>
                                    {g.family_side === 'Bride' ? 'Nevesta' : 'Ženích'}
                                </p>
                            </div>
                            <UserPlus size={18} className="text-[rgb(var(--brand-primary))] opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                    )) : (
                        <div className="text-center py-10 text-[var(--text-muted)] text-sm italic">Žiadni hostia k dispozícii</div>
                    )}
                </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-grid overflow-hidden">
                <div className="absolute top-8 right-8 flex gap-3 z-50">
                    <button onClick={onDelete} className="p-4 bg-[var(--bg-card)] border border-red-500/50 rounded-2xl hover:bg-red-500 text-red-500 hover:text-white transition-all cursor-pointer shadow-xl active:scale-95"><Trash2 size={24} /></button>
                    <button onClick={onClose} className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl hover:bg-[var(--bg-input)] text-[var(--text-main)] cursor-pointer shadow-xl active:scale-95 transition-all"><X size={24} /></button>
                </div>

                <motion.div 
                    animate={{ rotate: table.rotation || 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative"
                >
                    {Array.from({ length: capacity }).map((_, i) => {
                        const pos = getSeatPos(i);
                        const seatData = seats.find((s: Seat) => s.table_id === table.id && s.seat_number === i);
                        const isActive = activeSeat === i;
                        
                        return (
                            <div 
                                key={i} 
                                className="absolute z-10 hover:z-50 transition-all" 
                                style={{ left: pos.x, top: pos.y, width: 64, height: 64 }}
                            >
                                <motion.div 
                                    animate={{ rotate: -(table.rotation || 0) }} 
                                    className="group/seat relative w-full h-full flex items-center justify-center"
                                >
                                    <button 
                                        onClick={() => !seatData && setActiveSeat(isActive ? null : i)}
                                        className={`relative w-16 h-16 rounded-full border-[3px] flex flex-col items-center justify-center transition-all shadow-xl cursor-pointer
                                            ${isActive ? 'border-[rgb(var(--brand-primary))] bg-[var(--brand-light)] scale-110 z-20 ring-4 ring-[rgb(var(--brand-primary))/20]' : 'z-10'} 
                                            ${seatData 
                                                ? (seatData.family_side === 'Bride' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-sky-500/10 border-sky-500 text-sky-500') 
                                                : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[rgb(var(--brand-primary))]'}`}
                                    >
                                        <div className="flex items-center justify-center w-full h-full">
                                            {seatData ? (
                                                <span className="text-xl font-black">{seatData.guest_name[0]}</span>
                                            ) : (
                                                <Plus size={24} className={isActive ? 'text-[rgb(var(--brand-primary))] animate-pulse' : 'text-[var(--text-muted)]'} />
                                            )}
                                        </div>
                                        {seatData && (
                                            <div onClick={async (e) => { e.stopPropagation(); await unassignGuest(table.id, i); onRefresh(); }} className="absolute -top-2 -right-2 bg-white border border-red-500 p-1 rounded-full text-red-500 hover:scale-110 transition-all shadow-lg z-30"><UserMinus size={14} /></div>
                                        )}
                                    </button>

                                    {/* TOOLTIP BEZ DVOJITEJ ROTÁCIE */}
                                    {seatData && (
                                        <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 hidden group-hover/seat:block z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                                            <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] px-4 py-2 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] whitespace-nowrap text-center">
                                                <p className="text-sm font-black text-[var(--text-main)] leading-none">{seatData.guest_name}</p>
                                                <p className={`text-[10px] uppercase font-black tracking-widest mt-1 ${seatData.family_side === 'Bride' ? 'text-rose-500' : 'text-sky-500'}`}>
                                                    {seatData.family_side === 'Bride' ? 'Nevesta' : 'Ženích'}
                                                </p>
                                                {seatData.allergies && (
                                                    <p className="text-[10px] text-amber-500 font-bold mt-1.5 border-t border-[var(--border-color)] pt-1">
                                                        ⚠️ {seatData.allergies}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="w-3 h-3 bg-[var(--bg-card)] border-r-2 border-b-2 border-[var(--border-color)] rotate-45 mx-auto -mt-1.5 shadow-lg"></div>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        );
                    })}

                    <div style={{ width: tableWidth, height: tableHeight }} 
                        className={`flex flex-col items-center justify-center border-4 border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl transition-all ${isRound ? 'rounded-full' : 'rounded-[3.5rem]'}`}>
                        
                        <motion.div 
                            animate={{ rotate: -(table.rotation || 0) }} 
                            className="flex flex-col items-center justify-center"
                        >
                            <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tighter px-10 text-center leading-none mb-6 uppercase">{table.name}</h2>
                            
                            <div className="flex items-center gap-4 bg-[var(--bg-input)] p-2 rounded-2xl border border-[var(--border-color)] shadow-inner">
                                <button onClick={() => updateTableCapacity(table.id, Math.max(2, capacity - 1)).then(onRefresh)} className="p-2 hover:bg-red-500/10 rounded-xl text-[var(--text-main)] hover:text-red-500 transition-colors cursor-pointer"><Minus size={20} strokeWidth={3}/></button>
                                <span className="text-2xl font-mono text-[rgb(var(--brand-primary))] font-black min-w-[40px] text-center">{capacity}</span>
                                <button onClick={() => updateTableCapacity(table.id, capacity + 1).then(onRefresh)} className="p-2 hover:bg-green-500/10 rounded-xl text-[var(--text-main)] hover:text-green-500 transition-colors cursor-pointer"><Plus size={20} strokeWidth={3}/></button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

function CreateTableModal({ onClose, defaultCap, onCreated }: { onClose: () => void, defaultCap: number, onCreated: (cap: number) => void }) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.form 
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            await addTable(fd);
            onCreated(parseInt(fd.get('capacity') as string) || 8);
            onClose();
          }} 
          className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
          <h3 className="text-2xl font-black mb-8 text-[var(--text-main)] tracking-tight text-center uppercase">Nový stôl</h3>
          <div className="space-y-4">
            <div>
                <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Názov stola</label>
                <input name="name" required autoComplete="off" placeholder="napr. Rodina" className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] p-4 rounded-2xl mt-1.5 text-sm outline-none focus:border-[rgb(var(--brand-primary))] transition-colors" />
            </div>
            <div>
                <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Tvar stola</label>
                <select name="shape" className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] p-4 rounded-2xl mt-1.5 text-sm outline-none cursor-pointer appearance-none">
                    <option value="round">Kruhový</option>
                    <option value="rect">Obdĺžnikový</option>
                </select>
            </div>
            <div>
                <label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Kapacita</label>
                <input name="capacity" type="number" defaultValue={defaultCap} className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] p-4 rounded-2xl mt-1.5 text-[var(--text-main)] text-sm outline-none focus:border-[rgb(var(--brand-primary))]" />
            </div>
          </div>
          <div className="flex gap-4 mt-10">
            <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl bg-[var(--bg-input)] text-[var(--text-main)] text-sm font-bold hover:bg-[var(--border-color)] transition-all cursor-pointer">Zrušiť</button>
            <button type="submit" className="flex-1 p-4 rounded-2xl transition-all cursor-pointer font-black text-white text-sm shadow-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] shadow-[var(--brand-light)]">Vytvoriť</button>
          </div>
        </motion.form>
      </div>
    );
}