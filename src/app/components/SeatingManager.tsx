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
          className="flex items-center justify-center gap-2 bg-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-hover))] text-white p-4 rounded-2xl font-bold shadow-lg shadow-[rgb(var(--brand-primary)/0.2)] transition-all active:scale-95 cursor-pointer"
        >
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

    const handleRotate = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDragging.current) return;
        const currentRot = typeof table.rotation === 'number' ? table.rotation : 0;
        await updateTableRotation(table.id, (currentRot + 45) % 360);
        onRefresh();
    };

    const getSeatPos = (i: number) => {
        if (isRound) {
            const angle = (i * 2 * Math.PI) / capacity;
            const radius = 95; 
            return { 
                x: (tableWidth / 2) + Math.cos(angle) * radius - (seatSize / 2), 
                y: (tableHeight / 2) + Math.sin(angle) * radius - (seatSize / 2) 
            };
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
            className="absolute z-10 group"
        >
            {Array.from({ length: capacity }).map((_, i) => {
                const pos = getSeatPos(i);
                const seatData = seats.find((s: Seat) => s.table_id === table.id && s.seat_number === i);
                return (
                    <div key={i} className="absolute transition-all duration-500" style={{ left: pos.x, top: pos.y }}>
                        
                        <div className="group/seat relative">
                            <motion.div 
                                animate={{ rotate: -(table.rotation || 0) }}
                                className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all shadow-xl z-10 
                                ${seatData 
                                    ? (seatData.family_side === 'Bride' ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'bg-sky-500/20 border-sky-500 text-sky-500') 
                                    : 'bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-muted)]'}`}
                            >
                                {seatData ? seatData.guest_name[0] : i + 1}
                            </motion.div>

                            {seatData && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/seat:block z-[130] pointer-events-none animate-in fade-in slide-in-from-bottom-1">
                                    <div className="bg-[#09090b] border-2 border-zinc-500 px-3 py-2 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,1)] whitespace-nowrap text-white text-center">
                                        <p className="text-sm font-bold tracking-tight">{seatData.guest_name}</p>
                                        <p className={`text-[10px] uppercase font-black tracking-widest mt-0.5 ${seatData.family_side === 'Bride' ? 'text-rose-400' : 'text-sky-400'}`}>
                                            {seatData.family_side === 'Bride' ? 'Nevesta' : 'Ženích'}
                                        </p>
                                    </div>
                                    <div className="w-3 h-3 bg-[#09090b] border-r-2 border-b-2 border-zinc-500 rotate-45 mx-auto -mt-1.5 shadow-lg"></div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            <div className="relative" style={{ width: tableWidth, height: tableHeight }}>
                <motion.div 
                    onTap={() => { if (!isDragging.current) onEditRequest(table.id); }}
                    className={`absolute inset-0 flex flex-col items-center justify-center border-2 border-zinc-700 bg-[var(--bg-input)]/95 shadow-2xl backdrop-blur-md transition-all cursor-pointer
                        ${isRound ? 'rounded-full' : 'rounded-3xl'} hover:border-[rgb(var(--brand-primary)/0.5)]`}
                >
                    <motion.p 
                        animate={{ rotate: -(table.rotation || 0) }}
                        className="text-sm font-bold text-[var(--text-main)] px-6 text-center leading-tight select-none pointer-events-none group-hover:opacity-10 transition-opacity"
                    >
                        {table.name}
                    </motion.p>
                </motion.div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all z-20">
                    <button 
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()} 
                        onClick={handleRotate}
                        className="p-3 bg-[var(--bg-card)] border-2 border-[rgb(var(--brand-primary))] rounded-full text-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary))] hover:text-white transition-all shadow-2xl cursor-pointer active:scale-90 pointer-events-auto"
                    >
                        <RotateCw size={24} strokeWidth={3} />
                    </button>
                </div>
            </div>
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
        return { x: Math.cos(angle) * radius + (tableWidth / 2) - 28, y: Math.sin(angle) * radius + (tableHeight / 2) - 28 };
    } else {
        const isTop = i < peoplePerSide;
        const column = isTop ? i : i - peoplePerSide;
        const rowWidth = (peoplePerSide - 1) * seatSpacing;
        const startX = (tableWidth - rowWidth) / 2 - 28;

        return {
            x: startX + (column * seatSpacing),
            y: isTop ? -90 : tableHeight + 30
        };
    }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-[var(--bg-main)] flex animate-in fade-in duration-300">
            <div className="w-85 border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-[var(--border-color)]">
                    <h3 className="font-black text-xl text-[var(--text-main)] mb-6 uppercase tracking-tighter">Dostupní hostia</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                        <input placeholder="Hľadať hosťa..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl py-3 pl-10 pr-4 text-sm text-[var(--text-main)] outline-none focus:border-[rgb(var(--brand-primary))] transition-all shadow-inner" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                    {filteredGuests.map((g: Guest) => (
                        <div key={g.id} onClick={async () => { if (activeSeat !== null) { await assignGuestToSeat(table.id, activeSeat, g.id); setActiveSeat(null); onRefresh(); } }} className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${activeSeat !== null ? 'bg-[var(--bg-input)] border-[var(--border-color)] hover:bg-[var(--brand-light)] hover:border-[rgb(var(--brand-primary)/0.4)]' : 'bg-[var(--bg-input)] opacity-40 pointer-events-none'}`}>
                            <div className="leading-tight"><p className="text-xs font-bold text-[var(--text-main)]">{g.name}</p><p className={`text-[8px] font-black uppercase tracking-wider ${g.family_side === 'Bride' ? 'text-rose-500' : 'text-sky-500'}`}>{g.family_side === 'Bride' ? 'Nevesta' : 'Ženích'}</p></div>
                            <UserPlus size={14} className="text-[rgb(var(--brand-primary))] opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-grid">
                <div className="absolute top-8 right-8 flex gap-3">
                    <button onClick={onDelete} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl hover:bg-red-600 text-red-500 hover:text-white transition-all cursor-pointer shadow-xl active:scale-95 group"><Trash2 size={24} /></button>
                    <button onClick={onClose} className="p-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl hover:bg-zinc-800 text-[var(--text-muted)] cursor-pointer shadow-xl active:scale-95"><X size={24} /></button>
                </div>
                <div className="relative">
                    {Array.from({ length: capacity }).map((_, i) => {
                        const pos = getSeatPos(i);
                        const seatData = seats.find((s: Seat) => s.table_id === table.id && s.seat_number === i);
                        const isActive = activeSeat === i;
                        return (
                            <div key={i} className="absolute transition-all duration-500" style={{ left: pos.x, top: pos.y }}>
                                <div onClick={() => !seatData && setActiveSeat(isActive ? null : i)} className={`relative w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center transition-all shadow-2xl cursor-pointer ${isActive ? 'border-[rgb(var(--brand-primary))] bg-[var(--brand-light)] scale-110 z-20 shadow-[0_0_20px_rgba(var(--brand-primary),0.3)]' : 'z-10'} ${seatData ? (seatData.family_side === 'Bride' ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'bg-sky-500/20 border-sky-500 text-sky-500') : 'bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-muted)]'}`}>
                                    {seatData ? (<><span className="text-sm font-black">{seatData.guest_name[0]}</span><button onClick={async (e) => { e.stopPropagation(); await unassignGuest(table.id, i); onRefresh(); }} className="absolute -top-1 -right-1 bg-[var(--bg-main)] border border-[var(--border-color)] p-1.5 rounded-full text-red-500 hover:scale-110 transition-all cursor-pointer shadow-lg"><UserMinus size={12} /></button></>) : <Plus size={20} className={isActive ? 'text-[rgb(var(--brand-primary))] animate-pulse' : ''} />}
                                    {seatData && <span className="absolute top-full mt-3 text-[10px] font-bold text-[var(--text-main)] whitespace-nowrap bg-[var(--bg-card)] px-3 py-1.5 rounded-lg border border-[var(--border-color)] shadow-2xl animate-in fade-in">{seatData.guest_name}</span>}
                                </div>
                            </div>
                        );
                    })}
                    <div 
    style={{ width: tableWidth, height: tableHeight }} 
    className={`flex flex-col items-center justify-center border-4 border-zinc-800 bg-[#0c0c0e] shadow-[0_0_100px_rgba(0,0,0,0.6)] 
        ${isRound ? 'rounded-full' : 'rounded-[4rem]'}`}>
                        <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight px-10 text-center leading-none mb-4">{table.name}</h2>
                        <div className="flex items-center gap-4 bg-[var(--bg-input)] p-2 rounded-2xl border border-[var(--border-color)]">
                            <button onClick={() => updateTableCapacity(table.id, Math.max(2, capacity - 1)).then(onRefresh)} className="p-2 hover:bg-red-500/20 rounded-xl text-[var(--text-muted)] hover:text-red-400 transition-colors"><Minus size={18}/></button>
                            <span className="text-xl font-mono text-[rgb(var(--brand-primary))] font-black min-w-[30px] text-center">{capacity}</span>
                            <button onClick={() => updateTableCapacity(table.id, capacity + 1).then(onRefresh)} className="p-2 hover:bg-green-500/20 rounded-xl text-[var(--text-muted)] hover:text-green-400 transition-colors"><Plus size={18}/></button>
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
            <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl bg-[var(--bg-input)] hover:bg-zinc-700 text-sm font-bold text-[var(--text-muted)] transition-all cursor-pointer text-white">Zrušiť</button>
            <button type="submit" className="flex-1 p-4 rounded-2xl bg-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-hover))] text-white text-sm font-black shadow-lg shadow-[rgb(var(--brand-primary)/0.2)] transition-all cursor-pointer">Vytvoriť</button>
          </div>
        </form>
      </div>
    );
}