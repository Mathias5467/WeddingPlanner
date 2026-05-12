"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Camera, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getHomeData, deleteCouplePhoto, savePhotoToDb } from '../actions';
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "../api/uploadthing/core";

export function HomeView() {
  const [data, setData] = useState<{weddingDate: string | null, photos: any[]}>({ weddingDate: null, photos: [] });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<any>(null);

  const loadHome = async () => {
    const d = await getHomeData();
    setData(d);
  };

  useEffect(() => {
    loadHome();
    const timer = setInterval(() => calculateTimeLeft(), 1000);
    return () => clearInterval(timer);
  }, [data.weddingDate]);

  const calculateTimeLeft = () => {
    if (!data.weddingDate) return;
    const difference = +new Date(data.weddingDate) - +new Date();
    if (difference > 0) {
      setTimeLeft({
        dni: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hod: Math.floor((difference / (1000 * 60 * 60)) % 24),
        min: Math.floor((difference / 1000 / 60) % 60),
        sek: Math.floor((difference / 1000) % 60),
      });
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* ODPOČÍTAVANIE */}
      <div className="flex justify-center gap-4 md:gap-8 text-center">
        {timeLeft ? Object.entries(timeLeft).map(([label, value]) => (
          <div key={label} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 md:p-6 rounded-[2rem] min-w-[80px] md:min-w-[120px] shadow-xl">
            <div className="text-3xl md:text-5xl font-black text-[var(--brand-primary)] mb-1">{value as number}</div>
            <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">{label}</div>
          </div>
        )) : <div className="text-[var(--text-muted)] italic font-serif">Nastavte dátum svadby v nastaveniach...</div>}
      </div>

      {/* CAROUSEL */}
      <div className="relative h-[500px] w-full rounded-[2rem] overflow-hidden group shadow-lg border border-[var(--brand-primary)]">
        <AnimatePresence mode="wait">
          {data.photos.length > 0 ? (
            <motion.img
              key={data.photos[currentIndex].id}
              src={data.photos[currentIndex].path}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4">
              <Camera size={48} strokeWidth={1} />
              <p className="font-serif italic text-lg">Nahrajte vaše prvé spoločné fotky</p>
            </div>
          )}
        </AnimatePresence>

        {/* Ovládanie carouselu */}
        {data.photos.length > 1 && (
          <>
            <button onClick={() => setCurrentIndex((prev) => (prev === 0 ? data.photos.length - 1 : prev - 1))} className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
              <ChevronLeft size={24} />
            </button>
            <button onClick={() => setCurrentIndex((prev) => (prev === data.photos.length - 1 ? 0 : prev + 1))} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Mazanie */}
        {data.photos.length > 0 && (
          <button 
            onClick={async () => {
              await deleteCouplePhoto(data.photos[currentIndex].id, data.photos[currentIndex].path);
              setCurrentIndex(0);
              loadHome();
            }}
            className="absolute top-6 right-6 p-3 bg-red-500/20 backdrop-blur-md text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-50"
          >
            <Trash2 size={20} />
          </button>
        )}

        {/* Klientský Upload Button (Obchádza Vercel limity) */}
        <div className="absolute bottom-6 right-6 z-50">
            <UploadButton<OurFileRouter, "imageUploader">
                endpoint="imageUploader"
                onClientUploadComplete={async (res) => {
                    if (res && res[0]) {
                        await savePhotoToDb(res[0].url);
                        await loadHome();
                        setCurrentIndex(0);
                    }
                }}
                onUploadError={(error: Error) => {
                    alert(`Chyba: ${error.message}`);
                }}
                appearance={{
                    button: "bg-[var(--brand-primary)] text-white rounded-3xl font-black text-xs uppercase tracking-widest px-8 py-7 shadow-xl hover:scale-105 active:scale-95 transition-all duration-300",
                    allowedContent: "hidden"
                }}
                content={{
                    button: "Pridať fotku"
                }}
            />
        </div>
      </div>
    </div>
  );
}