"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, ImageIcon, Trash2, Search, 
  Download, Plus, X, Eye, Edit3
} from 'lucide-react';
import { getFiles, uploadFile, deleteFile, renameFile } from '../actions';
import { DeleteModal } from './ui/DeleteModal';
import { NotificationToast, NotificationType } from './ui/NotificationToast';

export function FileManager() {
  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");

  // --- STATE PRE NOTIFIKÁCIE ---
  const [notify, setNotify] = useState<{ msg: string, type: NotificationType, show: boolean }>({
    msg: "",
    type: "info",
    show: false
  });

  const showNotification = (msg: string, type: NotificationType) => {
    setNotify({ msg, type, show: true });
  };

  const loadData = async () => {
    const data = await getFiles();
    setFiles(data);
  };

  useEffect(() => { loadData(); }, []);

  const filteredFiles = useMemo(() => 
    files.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),
    [files, search]
  );

  const handleRename = async (id: number) => {
    if (tempName.trim()) {
      try {
        await renameFile(id, tempName.trim());
        showNotification("Súbor bol úspešne premenovaný.", "success");
      } catch (e) {
        showNotification("Nepodarilo sa premenovať súbor.", "error");
      }
    }
    setEditingId(null);
    loadData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Základná kontrola veľkosti pred odoslaním (Vercel limit)
    if (file.size > 4.5 * 1024 * 1024) {
      showNotification("Súbor je príliš veľký (max 4.5MB).", "warning");
      return;
    }

    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      await uploadFile(fd);
      showNotification("Súbor bol úspešne nahraný.", "success");
      loadData();
    } catch (err) {
      showNotification("Nahrávanie zlyhalo. Skúste to znova.", "error");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset inputu
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-8">
      
      {/* NOTIFIKÁCIA */}
      <NotificationToast 
        isVisible={notify.show}
        message={notify.msg}
        type={notify.type}
        onClose={() => setNotify(prev => ({ ...prev, show: false }))}
      />

      <div className="flex flex-wrap gap-6 items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)]/60 p-6 rounded-[2rem] shadow-lg">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
          <input 
            placeholder="Hľadať súbor..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-[var(--brand-primary)] transition-all shadow-inner"
          />
        </div>

        <label className={`bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white px-8 h-[52px] rounded-2xl font-black flex items-center gap-3 transition-all shadow-lg cursor-pointer active:scale-95 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {isUploading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <Upload size={20}/>
            </motion.div>
          ) : (
            <Plus size={20} />
          )}
          <span>{isUploading ? 'Nahrávam...' : 'Nahrať súbor'}</span>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-5 gap-6">
        <AnimatePresence>
          {filteredFiles.map((file) => {
            const isImage = file.type.startsWith('image/');
            return (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-[1.5rem] overflow-hidden shadow-xl transition-all flex flex-col"
              >
                <div className="aspect-square bg-[var(--bg-input)] relative overflow-hidden flex items-center justify-center border-b border-[var(--border-color)]/60">
                  {isImage ? (
                    <img src={file.path} alt={file.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4 rounded-2xl border border-[var(--brand-hover)]/30">
                        <FileText size={40} className="text-[var(--brand-primary)] opacity-60" />
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 duration-300 backdrop-blur-sm">
                    <a href={file.path} target="_blank" className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white border border-white/20 transition-all shadow-xl">
                      <Eye size={20} />
                    </a>
                    <a href={file.path} download={file.name} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white border border-white/20 transition-all shadow-xl">
                      <Download size={20} />
                    </a>
                    <button 
                      onClick={() => setFileToDelete(file)}
                      className="p-3 bg-rose-500/20 hover:bg-rose-500 rounded-xl text-rose-500 hover:text-white border border-rose-500/50 transition-all shadow-xl cursor-pointer"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[var(--bg-card)]">
                  {editingId === file.id ? (
                    <input
                      autoFocus
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(file.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => handleRename(file.id)}
                      className="w-full bg-[var(--bg-input)] border border-[var(--brand-primary)] text-[var(--text-main)] text-sm font-bold py-1.5 px-2 rounded-lg outline-none"
                    />
                  ) : (
                    <p 
                      onClick={() => {
                        setEditingId(file.id);
                        setTempName(file.name);
                      }}
                      className="text-sm font-bold text-[var(--text-main)] truncate pr-2 cursor-pointer hover:text-[var(--brand-primary)] transition-colors flex items-center gap-2 group/text" 
                    >
                      <span className="truncate">{file.name}</span>
                      <Edit3 size={14} className="opacity-0 group-hover/text:opacity-100 shrink-0" />
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-color)]/40">
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase">{formatSize(file.size)}</span>
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase opacity-40">{file.type.split('/')[1]}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredFiles.length === 0 && !isUploading && (
        <div className="py-32 text-center border-2 border-dashed border-[var(--border-color)] rounded-[3rem]">
          <ImageIcon size={64} className="mx-auto mb-4 opacity-10 text-[var(--text-main)]" />
          <p className="text-[var(--text-muted)] font-medium">Žiadne súbory. Nahrajte prvý dokument!</p>
        </div>
      )}

      <DeleteModal 
        isOpen={!!fileToDelete}
        text={`Odstrániť súbor ${fileToDelete?.name}?`}
        onClose={() => setFileToDelete(null)}
        onConfirm={async () => {
          if (fileToDelete) {
            try {
              await deleteFile(fileToDelete.id, fileToDelete.path);
              showNotification("Súbor bol odstránený.", "info");
              setFileToDelete(null);
              loadData();
            } catch (e) {
              showNotification("Súbor sa nepodarilo odstrániť.", "error");
            }
          }
        }}
      />
    </div>
  );
}