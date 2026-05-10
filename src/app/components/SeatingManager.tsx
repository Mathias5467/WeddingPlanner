"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { 
  Plus, Minus, Maximize2, Trash2, LayoutGrid, 
  Edit3, X, Search, UserPlus, UserMinus, RotateCw 
} from 'lucide-react';
import { 
  getTables, addTable, updateTablePos, 
  updateTableCapacity, deleteTable, getTableSeats, 
  assignGuestToSeat, unassignGuest, updateTableRotation 
} from '../actions';
import { DeleteModal } from './ui/DeleteModal';

interface Table { id: number; name: string; shape: string; capacity: number; x_pos: number; y_pos: number; rotation: number; }
interface Seat { id: number; table_id: number; guest_id: number; seat_number: number; guest_name: string; family_side: string; }
interface Guest { id: number; name: string; family_side: string; }

interface TableViewProps {
  table: Table;
  seats: Seat[];
  onDragEnd: (info: PanInfo) => void;
  onRefresh: () => void;
  onDeleteRequest: (table: Table) => void;
  onEditRequest: (id: number) => void;
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
    const t = await getTables();
    const s = await getTableSeats();
    setTables(t as Table[]);
    setSeats(s as Seat[]);
  };

  useEffect(() => { loadData(); }, []);

  const currentEditingTable = useMemo(() => 
    tables.find(t => t.id === editingId), 
    [tables, editingId]
  );

  const handleDragEnd = async (id: number, info: PanInfo) => {
    const table = tables.find(t => t.id === id);
    if (table) {
      const newX = table.x_pos + info.offset.x;
      const newY = table.y_pos + info.offset.y;
      await updateTablePos(id, newX, newY);
      setTables(prev => prev.map(t => t.id === id ? { ...t, x_pos: newX, y_pos: newY } : t));
    }
  };

  return (
    <div className="relative h-[calc(100vh-180px)] bg-[var(--bg-main)] rounded-3xl overflow-hidden border border-[var(--border-color)] shadow-inner transition-colors">
      
      <div className="absolute top-6 right-6 z-[150] flex flex-col gap-2">
        <div className="flex gap-2 bg-[var(--bg-card)]/90 backdrop-blur-md p-2 rounded-2xl border border-[var(--border-color)] shadow-xl">
          <button onClick={() => setZoom(Math.min(zoom + 0.1, 2))} className="p-2 hover:bg-[var(--brand-light)] rounded-xl text-[var(--text-muted)] cursor-pointer transition-colors"><Plus size={18}/></button>
          <button onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))} className="p-2 hover:bg-[var(--brand-light)] rounded-xl text-[var(--text-muted)] cursor-pointer transition-colors"><Minus size={18}/></button>
          <button onClick={() => setZoom(1)} className="p-2 hover:bg-[var(--brand-light)] rounded-xl text-[var(--text-muted)] border-l border-[var(--border-color)] ml-1 cursor-pointer transition-colors"><Maximize2 size={16}/></button>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 rounded-2xl p-5 font-black text-white text-sm shadow-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] shadow-[var(--brand-light)] transition-all active:scale-95 cursor-pointer">
          <LayoutGrid size={20} />
          <span>Pridať stôl</span>
        </button>
      </div>

      <div 
        className="w-full h-full cursor-default overflow-auto custom-scrollbar bg-grid"
        onClick={(e) => {
          if ((e.target as HTMLElement).classList.contains('bg-grid')) {
            setIsModalOpen(true);
          }
        }}
      >
        <motion.div animate={{ scale: zoom }} className="relative min-w-[3000px] min-h-[3000px] origin-top-left p-40 bg-grid">
          {tables.map((table) => (
            <TableView 
              key={table.id} 
              table={table} 
              seats={seats.filter((s: Seat) => s.table_id === table.id)}
              onDragEnd={(info: PanInfo) => handleDragEnd(table.id, info)}
              onRefresh={loadData}
              onDeleteRequest={(t: Table) => setTableToDelete(t)}
              onEditRequest={(id: number) => setEditingId(id)}
            />
          ))}
        </motion.div>
      </div>

      {isModalOpen && (
        <CreateTableModal 
          onClose={() => setIsModalOpen(false)} 
          defaultCap={defaultCapacity} 
          onCreated={(cap: number) => { setDefaultCapacity(cap); loadData(); }} 
        />
      )}

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
    </div>
  );
}

function TableView({ table, seats, onDragEnd, onRefresh, onDeleteRequest, onEditRequest }: TableViewProps) {
    const isDragging = useRef(false);
    const isRound = table.shape === 'round';
    const capacity = table.capacity;
    
    const seatSize = 44;
    const seatSpacing = 64;
    const tableHeight = 120;
    const peoplePerSide = Math.ceil(capacity / 2);
    const tableWidth = isRound ? 120 : Math.max(120, peoplePerSide * seatSpacing);

    const getSeatPos = (i: number) => {
        if (isRound) {
            const angle = (i * 2 * Math.PI) / capacity;
            const radius = 95; 
            return { x: (tableWidth / 2) + Math.cos(angle) * radius - (seatSize / 2), y: (tableHeight / 2) + Math.sin(angle) * radius - (seatSize / 2) };
        } else {
            const isTop = i < peoplePerSide;
            const col = isTop ? i : i - peoplePerSide;
            const rowWidth = (peoplePerSide - 1) * seatSpacing;
            const startX = (tableWidth - rowWidth) / 2 - (seatSize / 2);
            return { x: startX + (col * seatSpacing), y: isTop ? -55 : tableHeight + 11 };
        }
    };

    return (
        <motion.div
            drag dragMomentum={false}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={(_, info: PanInfo) => { 
                onDragEnd(info); 
                setTimeout(() => (isDragging.current = false), 150); 
            }}
            initial={{ x: table.x_pos, y: table.y_pos, rotate: table.rotation }}
            animate={{ x: table.x_pos, y: table.y_pos, rotate: table.rotation }}
            className="absolute group"
            style={{ zIndex: 10 }} // Základná vrstva stola
        >
            {/* 1. TELO STOLA A ROTÁCIA (Vrstva naspodu) */}
            <div className="relative z-0" style={{ width: tableWidth, height: tableHeight }}>
                {/* Povrch stola */}
                <motion.div 
                    onTap={() => { if (!isDragging.current) onEditRequest(table.id); }}
                    className={`absolute inset-0 flex flex-col items-center justify-center border-2 border-[var(--text-muted)] bg-[var(--bg-card)] shadow-xl backdrop-blur-md transition-all cursor-pointer
                        ${isRound ? 'rounded-full' : 'rounded-3xl'} hover:border-[rgb(var(--brand-primary))]`}
                >
                    <motion.p animate={{ rotate: -(table.rotation || 0) }} className="text-sm font-bold text-[var(--text-main)] px-6 text-center leading-tight select-none pointer-events-none group-hover:opacity-10 transition-opacity">
                        {table.name}
                    </motion.p>
                </motion.div>

                {/* VRSTVA ROTÁCIE - nastavená na nízky z-index (z-10) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all z-10">
                    <button 
                        type="button" 
                        onPointerDown={(e) => e.stopPropagation()} 
                        onClick={(e: any) => {
                            e.stopPropagation();
                            const currentRot = typeof table.rotation === 'number' ? table.rotation : 0;
                            updateTableRotation(table.id, (currentRot + 45) % 360).then(onRefresh);
                        }} 
                        className="p-3 bg-[var(--bg-card)] border-2 border-[rgb(var(--brand-primary))] rounded-full text-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary))] hover:text-white shadow-2xl cursor-pointer active:scale-90 pointer-events-auto shadow-[0_0_20px_rgba(var(--brand-primary),0.3)]"
                    >
                        <RotateCw size={24} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* 2. SEDADLÁ A TOOLTIPY (Vykreslené neskôr a s vyšším z-indexom) */}
            {Array.from({ length: capacity }).map((_, i) => {
                const pos = getSeatPos(i);
                const seatData = seats.find((s: Seat) => s.table_id === table.id && s.seat_number === i);
                return (
                    <div 
                        key={i} 
                        className="absolute transition-all duration-500 z-30" // Vyšší z-index ako stôl a rotácia
                        style={{ left: pos.x, top: pos.y, width: 44, height: 44 }}
                    >
                        <motion.div 
                            animate={{ rotate: -(table.rotation || 0) }}
                            className="group/seat relative w-full h-full"
                        >
                            {/* Krúžok stoličky */}
                            <div className={`w-full h-full rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-xl z-10 
                                ${seatData 
                                    ? (seatData.family_side === 'Bride' ? 'bg-rose-500/20 border-rose-500 text-rose-500 text-black dark:text-rose-400' : 'bg-sky-500/20 border-sky-500 text-sky-500 text-black dark:text-sky-400') 
                                    : 'bg-[var(--bg-input)] border-[var(--text-muted)] text-[var(--text-main)]'}`}
                            >
                                {seatData ? seatData.guest_name[0] : i + 1}
                            </div>

                            {/* TOOLTIP - NAJVYŠŠÍ Z-INDEX */}
                            {seatData && (
                                <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 hidden group-hover/seat:block z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-2">
                                    <div className="bg-[#000000] border-2 border-zinc-500 px-4 py-2 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] whitespace-nowrap text-white text-center">
                                        <p className="text-sm font-black tracking-tight">{seatData.guest_name}</p>
                                        <p className={`text-[10px] uppercase font-black tracking-widest mt-1 ${seatData.family_side === 'Bride' ? 'text-rose-400' : 'text-sky-400'}`}>
                                            {seatData.family_side === 'Bride' ? 'Nevesta' : 'Ženích'}
                                        </p>
                                    </div>
                                    <div className="w-3.5 h-3.5 bg-[#09090b] border-r-2 border-b-2 border-zinc-500 rotate-45 mx-auto -mt-2 shadow-lg"></div>
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

    const handleCapacityChange = async (diff: number) => {
        await updateTableCapacity(table.id, Math.max(2, capacity + diff));
        onRefresh(); 
    };

    const getSeatPos = (i: number) => {
        if (isRound) {
            const angle = (i * 2 * Math.PI) / capacity;
            const radius = 180;
            return { x: Math.cos(angle) * radius + (tableWidth / 2) - 28, y: Math.sin(angle) * radius + (tableHeight / 2) - 28 };
        } else {
            const isTop = i < peoplePerSide;
            const column = isTop ? i : i - peoplePerSide;
            const rowWidth = (peoplePerSide - 1) * seatSpacing;
            const startX = (tableWidth - rowWidth) / 2 - 28;
            return { x: startX + (column * seatSpacing), y: isTop ? -90 : tableHeight + 30 };
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-[var(--bg-main)] flex animate-in fade-in duration-300">
            {/* L'AVÝ PANEL ZOSTAJE ROVNAKÝ */}
            <div className="w-85 border-r-2 border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col shadow-2xl z-50">
                <div className="p-6 border-b-2 border-[var(--border-color)]">
                    <h3 className="font-black text-xl text-[var(--text-main)] mb-6 uppercase tracking-tighter">Dostupní hostia</h3>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                        <input placeholder="Hľadať hosťa..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[var(--bg-input)] border-2 border-[var(--border-color)] rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-[var(--text-main)] outline-none focus:border-[rgb(var(--brand-primary))] transition-all shadow-inner" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                    {filteredGuests.map((g: Guest) => (
                        <div key={g.id} onClick={async () => { if (activeSeat !== null) { await assignGuestToSeat(table.id, activeSeat, g.id); setActiveSeat(null); onRefresh(); } }} className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${activeSeat !== null ? 'bg-[var(--bg-input)] border-[rgb(var(--brand-primary))] shadow-md' : 'bg-[var(--bg-input)] border-[var(--border-color)] opacity-60 hover:opacity-100'}`}>
                            <div className="leading-tight">
                                <p className="text-sm font-black text-[var(--text-main)]">{g.name}</p>
                                <p className={`text-[10px] font-black uppercase tracking-wider mt-1 ${g.family_side === 'Bride' ? 'text-rose-500' : 'text-sky-500'}`}>{g.family_side === 'Bride' ? 'Nevesta' : 'Ženích'}</p>
                            </div>
                            <UserPlus size={18} className="text-[rgb(var(--brand-primary))] opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                    ))}
                </div>
            </div>

            {/* PLOCHA V EDITORE */}
            <div className="flex-1 relative flex items-center justify-center bg-grid">
                <div className="absolute top-8 right-8 flex gap-3 z-50">
                    <button onClick={onDelete} className="p-4 bg-[var(--bg-card)] border-2 border-red-500/50 rounded-2xl hover:bg-red-500 text-red-500 hover:text-white transition-all cursor-pointer shadow-xl active:scale-95 group"><Trash2 size={24} strokeWidth={3} /></button>
                    <button onClick={onClose} className="p-4 bg-[var(--bg-card)] border-2 border-[var(--text-muted)] rounded-2xl hover:bg-[var(--text-muted)] text-[var(--text-main)] hover:text-white cursor-pointer shadow-xl active:scale-95 transition-all"><X size={24} strokeWidth={3} /></button>
                </div>
                <div className="relative">
                    {Array.from({ length: capacity }).map((_, i) => {
                        const pos = getSeatPos(i);
                        const seatData = seats.find((s: Seat) => s.table_id === table.id && s.seat_number === i);
                        const isActive = activeSeat === i;
                        return (
                            <div key={i} className="absolute transition-all duration-500" style={{ left: pos.x, top: pos.y }}>
                                <div className="group/seat relative">
                                    <div onClick={() => !seatData && setActiveSeat(isActive ? null : i)} className={`relative w-16 h-16 rounded-full border-[3px] flex flex-col items-center justify-center transition-all shadow-xl cursor-pointer ${isActive ? 'border-[rgb(var(--brand-primary))] bg-[var(--brand-light)] scale-110 z-20 shadow-[0_0_20px_rgba(var(--brand-primary),0.3)]' : 'z-10'} ${seatData ? (seatData.family_side === 'Bride' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-sky-500/20 border-sky-500 text-sky-400') : 'bg-[var(--bg-input)] border-[var(--text-muted)] text-[var(--text-main)] hover:border-[rgb(var(--brand-primary))]'}`}>
                                        
                                        {seatData ? (<><span className="text-lg font-black">{seatData.guest_name[0]}</span><button onClick={async (e) => { e.stopPropagation(); await unassignGuest(table.id, i); onRefresh(); }} className="absolute -top-2 -right-2 bg-[var(--bg-card)] border-2 border-[var(--text-muted)] p-1.5 rounded-full text-red-500 hover:scale-110 hover:border-red-500 transition-all cursor-pointer shadow-lg"><UserMinus size={14} strokeWidth={3} /></button></>) : <Plus size={24} strokeWidth={3} className={isActive ? 'text-[rgb(var(--brand-primary))] animate-pulse' : ''} />}
                                    
                                    </div>

                                    {/* OPRAVENÝ TOOLTIP V MODÁLI */}
                                    {seatData && (
                                        <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 hidden group-hover/seat:block z-[400] pointer-events-none animate-in fade-in slide-in-from-bottom-2">
                                            <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] px-4 py-2 rounded-xl shadow-2xl whitespace-nowrap text-center">
                                                <p className="text-sm font-black text-[var(--text-main)] tracking-tight">{seatData.guest_name}</p>
                                                <p className={`text-[9px] uppercase font-black tracking-widest mt-1 ${seatData.family_side === 'Bride' ? 'text-rose-500' : 'text-sky-500'}`}>
                                                    {seatData.family_side === 'Bride' ? 'Nevesta' : 'Ženích'}
                                                </p>
                                            </div>
                                            {/* Šípka */}
                                            <div className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[var(--bg-card)] border-r-2 border-b-2 border-[var(--border-color)] rotate-45 shadow-lg"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div style={{ width: tableWidth, height: tableHeight }} 
                         // ZMENA KONTRASTU STOLA V MODÁLI
                         className={`flex flex-col items-center justify-center border-4 border-[var(--text-muted)] bg-[var(--bg-card)]  ${isRound ? 'rounded-full' : 'rounded-[4rem]'}`}>
                        <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tight px-10 text-center leading-none mb-6">{table.name}</h2>
                        
                        <div className="flex items-center gap-4 bg-[var(--bg-input)] p-2 rounded-2xl border-2 border-[var(--text-muted)] shadow-inner">
                            <button onClick={() => updateTableCapacity(table.id, Math.max(2, capacity - 1)).then(onRefresh)} className="p-2 hover:bg-red-500/20 rounded-xl text-[var(--text-main)] hover:text-red-500 transition-colors cursor-pointer"><Minus size={20} strokeWidth={3}/></button>
                            <span className="text-2xl font-mono text-[rgb(var(--brand-primary))] font-black min-w-[40px] text-center">{capacity}</span>
                            <button onClick={() => updateTableCapacity(table.id, capacity + 1).then(onRefresh)} className="p-2 hover:bg-green-500/20 rounded-xl text-[var(--text-main)] hover:text-green-500 transition-colors cursor-pointer"><Plus size={20} strokeWidth={3}/></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
function CreateTableModal({ onClose, defaultCap, onCreated }: { onClose: () => void, defaultCap: number, onCreated: (cap: number) => void }) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          await addTable(fd);
          onCreated(parseInt(fd.get('capacity') as string) || 8);
          onClose();
        }} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95">
          <h3 className="text-2xl font-black mb-8 text-[var(--text-main)] tracking-tight text-center uppercase">Nový stôl</h3>
          <div className="space-y-5">
            <div><label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Názov stola</label><input name="name" required autoComplete="off" placeholder="napr. Rodina" className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] p-4 rounded-2xl mt-2 text-sm outline-none focus:border-[rgb(var(--brand-primary))] transition-colors shadow-inner" /></div>
            <div><label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Tvar stola</label><select name="shape" className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] p-4 rounded-2xl mt-2 text-sm outline-none cursor-pointer appearance-none text-[var(--text-main)]"><option value="round">Kruhový</option><option value="rect">Obdĺžnikový</option></select></div>
            <div><label className="text-[10px] uppercase font-black text-[var(--text-muted)] ml-1 tracking-widest">Kapacita</label><input name="capacity" type="number" defaultValue={defaultCap} className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] p-4 rounded-2xl mt-2 text-sm outline-none focus:border-[rgb(var(--brand-primary))] shadow-inner" /></div>
          </div>
          <div className="flex gap-4 mt-10">
            <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] text-black dark:text-[var(--text-main)] text-sm font-bold text-[var(--text-muted)] transition-all cursor-pointer text-white">Zrušiť</button>
            <button type="submit" className="flex-1 p-4 rounded-2xl transition-all cursor-pointer font-black text-white text-sm shadow-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] shadow-[var(--brand-light)]">Vytvoriť</button>
          </div>
        </form>
      </div>
    );
}