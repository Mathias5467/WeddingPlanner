"use client";

import React, { useState, useEffect, useMemo, useRef  } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, ImageIcon, Trash2, Search, 
  Download, Plus, X, File as FileIcon, Eye, Edit3
} from 'lucide-react';
import { getFiles, uploadFile, deleteFile, renameFile } from '../actions';
import { DeleteModal } from './ui/DeleteModal';

export function FileManager() {
  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");

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
      await renameFile(id, tempName.trim());
    }
    setEditingId(null);
    loadData();
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
      
      <div className="flex flex-wrap gap-6 items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)]/60 p-6 rounded-[2.5rem] shadow-2xl">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
          <input 
            placeholder="Hľadať súbor..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-[rgb(var(--brand-primary)/0.5)] transition-all shadow-inner"
          />
        </div>

        <label className="bg-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-hover))] text-[var(--text-main)] px-8 py-3.5 rounded-2xl font-black flex items-center gap-3 transition-all shadow-lg shadow-[rgb(var(--brand-primary)/0.2)] cursor-pointer active:scale-95">
          {isUploading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Upload size={20}/></motion.div> : <Plus size={20} />}
          <span>{isUploading ? 'Nahrávam...' : 'Nahrať súbor'}</span>
          <input 
            type="file" 
            className="hidden" 
            onChange={async (e) => {
              if (e.target.files?.[0]) {
                setIsUploading(true);
                const fd = new FormData();
                fd.append('file', e.target.files[0]);
                await uploadFile(fd);
                setIsUploading(false);
                loadData();
              }
            }} 
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
                className="group bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-[2rem] overflow-hidden shadow-xl hover:border-zinc-600 transition-all flex flex-col"
              >
                <div className="aspect-square h-35 bg-[var(--bg-input)] relative overflow-hidden flex items-center justify-center border-b border-[var(--border-color)]/60">
                  {isImage ? (
                    <img src={file.path} alt={file.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4  bg-zinc-950 rounded-2xl border border-[var(--border-color)] shadow-inner">
                        <FileText size={40} className="text-[rgb(var(--brand-primary))] opacity-60" />
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a href={file.path} target="_blank" className="p-3 bg-[var(--bg-input)] rounded-xl text-[var(--text-main)] hover:bg-[rgb(var(--brand-primary))] transition-all shadow-xl">
                      <Eye size={20} />
                    </a>
                    <a href={file.path} download={file.name} className="p-3 bg-[var(--bg-input)] rounded-xl text-[var(--text-main)] hover:bg-[rgb(var(--brand-primary))] transition-all shadow-xl">
                      <Download size={20} />
                    </a>
                    <button 
                      onClick={() => setFileToDelete(file)}
                      className="p-3 bg-[var(--bg-input)] rounded-xl text-red-500 hover:bg-red-500 hover:text-[var(--text-main)] transition-all shadow-xl"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#161618]">
                  {editingId === file.id ? (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                      <input
                        autoFocus
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(file.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={() => handleRename(file.id)}
                        className="w-full bg-zinc-950 border border-[rgb(var(--brand-primary)/0.5)] text-[var(--text-main)] text-[11px] font-bold py-1 px-2 rounded-lg outline-none shadow-[0_0_10px_rgba(var(--brand-primary),0.15)]"
                      />
                    </div>
                  ) : (
                    <p 
                      onClick={() => {
                        setEditingId(file.id);
                        setTempName(file.name);
                      }}
                      className="text-xs font-bold text-zinc-200 truncate pr-2 cursor-pointer hover:text-[rgb(var(--brand-primary))] transition-colors flex items-center gap-2 group/text" 
                      title="Kliknite pre premenovanie"
                    >
                      <span className="truncate">{file.name}</span>
                      <Edit3 size={10} className="text-zinc-600 opacity-0 group-hover/text:opacity-100 transition-opacity flex-shrink-0" />
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-1.5 border-t border-[var(--border-color)]/50 pt-1.5">
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{file.type.split('/')[1]}</span>
                    <span className="text-[9px] font-bold text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded-full border border-[var(--border-color)]">{formatSize(file.size)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredFiles.length === 0 && (
        <div className="py-32 text-center border-2 border-dashed border-[var(--border-color)] rounded-[3rem]">
          <ImageIcon size={64} className="mx-auto mb-4 opacity-10 text-[var(--text-main)]" />
          <p className="text-[var(--text-muted)]">Žiadne súbory nenajdené. Nahrajte prvú zmluvu alebo fotku!</p>
        </div>
      )}

      <DeleteModal 
        isOpen={!!fileToDelete}
        text="Odstrániť súbor?"
        onClose={() => setFileToDelete(null)}
        onConfirm={async () => {
          if (fileToDelete) {
            await deleteFile(fileToDelete.id, fileToDelete.path);
            setFileToDelete(null);
            loadData();
          }
        }}
      />
    </div>
  );
}